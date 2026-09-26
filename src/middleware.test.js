// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '@/middleware'

vi.mock('server-only', () => ({}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('SUPABASE_URL', 'https://counter.example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'TEST-SERVICE-KEY')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
const visit = async (path, options) => {
  const pending = []
  const response = await middleware(new NextRequest(`https://zenhungyep.com${path}`, options), {
    waitUntil: (promise) => pending.push(promise)
  })
  await Promise.all(pending)
  return response
}
describe('internal view counting', () => {
  it('updates the provider directly beyond the shared public quota and decodes the slug', async () => {
    for (let i = 0; i < 65; i++) await visit('/writing/Hello%20%E4%B8%AD%E6%96%87')
    expect(fetch).toHaveBeenCalledTimes(65)
    expect(fetch).toHaveBeenLastCalledWith(
      'https://counter.example.supabase.co/rest/v1/rpc/increment_view_count',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ page_slug: 'Hello 中文' }),
        cache: 'no-store',
        signal: expect.any(AbortSignal),
        headers: {
          apikey: 'TEST-SERVICE-KEY',
          Authorization: 'Bearer TEST-SERVICE-KEY',
          'Content-Type': 'application/json'
        }
      })
    )
  })
  it('skips prefetch, HEAD, malformed slugs and development visits', async () => {
    await visit('/writing/test', { headers: { 'next-router-prefetch': '1' } })
    await visit('/writing/test', { method: 'HEAD' })
    await visit('/writing/%25')
    vi.stubEnv('NODE_ENV', 'development')
    await visit('/writing/test')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('keeps the page available when the counter store rejects a write', async () => {
    fetch.mockResolvedValue(new Response('private database details', { status: 500 }))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await visit('/writing/test')).status).toBe(200)
    expect(log).toHaveBeenCalled()
    expect(JSON.stringify(log.mock.calls)).not.toContain('private database details')
    log.mockRestore()
  })
})
