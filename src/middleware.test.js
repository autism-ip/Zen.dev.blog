// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '@/middleware'

vi.mock('server-only', () => ({}))
let client = 1
let published
let counterStatus
const writes = () => fetch.mock.calls.filter(([url]) => url.includes('/rest/v1/rpc/'))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('VERCEL', '1')
  client++
  published = true
  counterStatus = 200
  vi.stubEnv('CONTENTFUL_SPACE_ID', 'test-space')
  vi.stubEnv('CONTENTFUL_ACCESS_TOKEN', 'TEST-CMS-TOKEN')
  vi.stubEnv('SUPABASE_URL', 'https://counter.example.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'TEST-SERVICE-KEY')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options) => {
      if (url.includes('graphql.contentful.com')) {
        const slug = JSON.parse(options.body).variables.slug
        return Response.json({ data: { postCollection: { items: published ? [{ slug }] : [] } } })
      }
      return new Response(counterStatus === 200 ? null : 'private database details', { status: counterStatus })
    })
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
const visit = async (path, options) => {
  const pending = []
  const response = await middleware(
    new NextRequest(`https://zenhungyep.com${path}`, {
      ...options,
      headers: { 'x-real-ip': `8.8.8.${client}`, ...options?.headers }
    }),
    {
      waitUntil: (promise) => pending.push(promise)
    }
  )
  await Promise.all(pending)
  return response
}
describe('internal view counting', () => {
  it('updates the provider directly beyond the shared public quota and decodes the slug', async () => {
    for (let i = 1; i <= 65; i++)
      await visit('/writing/Hello%20%E4%B8%AD%E6%96%87', { headers: { 'x-real-ip': `8.8.4.${i}` } })
    expect(writes()).toHaveLength(65)
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
  it('deduplicates repeat views by the same trusted visitor for ten minutes', async () => {
    vi.useFakeTimers()
    for (let i = 0; i < 65; i++) await visit('/writing/test')
    expect(writes()).toHaveLength(1)
    vi.advanceTimersByTime(600001)
    await visit('/writing/test')
    expect(writes()).toHaveLength(2)
  })
  it('shares the visitor counter quota with the public API while keeping pages available', async () => {
    for (let i = 0; i < 60; i++) await visit('/api/v1/increment-views', { method: 'POST' })
    expect((await visit('/writing/test')).status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
    await visit('/writing/test', { headers: { 'x-real-ip': '9.9.9.9' } })
    expect(writes()).toHaveLength(1)
  })
  it('never creates a counter for a nonexistent article', async () => {
    published = false
    await visit('/writing/nonexistent')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(writes()).toHaveLength(0)
  })
  it('skips prefetch, HEAD, malformed slugs and development visits', async () => {
    await visit('/writing/test', { headers: { 'next-router-prefetch': '1' } })
    await visit('/writing/test', { method: 'HEAD' })
    await visit('/writing/%25')
    await visit('/writing/test', { headers: { 'x-real-ip': '', 'x-forwarded-for': '1.1.1.1' } })
    vi.stubEnv('NODE_ENV', 'development')
    await visit('/writing/test')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('does not write counters when article validation fails', async () => {
    fetch.mockResolvedValueOnce(Response.json({ errors: [{ message: 'private CMS details' }] }))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await visit('/writing/test')).status).toBe(200)
    expect(writes()).toHaveLength(0)
    expect(JSON.stringify(log.mock.calls)).not.toContain('private CMS details')
    log.mockRestore()
  })
  it('keeps the page available when the counter store rejects a write', async () => {
    counterStatus = 500
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await visit('/writing/test')).status).toBe(200)
    expect(log).toHaveBeenCalled()
    expect(JSON.stringify(log.mock.calls)).not.toContain('private database details')
    log.mockRestore()
  })
})
