// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiHandler } from '@/lib/agent/http'
import { middleware } from '@/middleware'

let clientNumber = 1
const newClient = () => `8.8.4.${clientNumber++}`
const request = (path, method = 'GET', token = newClient()) =>
  new NextRequest(`https://zenhungyep.com${path}`, { method, headers: { 'x-real-ip': token } })

beforeEach(() => vi.stubEnv('VERCEL', '1'))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('public API boundary', () => {
  it.each(['/api', '/api/v1'])('discovers the API at %s', async (path) => {
    const response = await middleware(request(path))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ version: 'v1', openapi: 'https://zenhungyep.com/openapi.json' })
  })
  it.each(['/api/missing', '/api/missing.json', '/api/v2/posts', '/api/v1/auth/raindrop'])(
    'returns JSON 404 for %s',
    async (path) => {
      const response = await middleware(request(path))
      expect(response.status).toBe(404)
      expect(await response.json()).toMatchObject({ ok: false, code: 'not_found', hint: expect.any(String) })
    }
  )
  it('returns JSON 405 with Allow and handles OPTIONS and HEAD', async () => {
    const response = await middleware(request('/api/posts', 'POST'))
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD, OPTIONS')
    expect((await response.json()).code).toBe('method_not_allowed')
    expect((await middleware(request('/api/posts', 'OPTIONS'))).status).toBe(204)
    expect((await middleware(request('/api/posts', 'HEAD'))).status).toBe(200)
  })
  it('rewrites only versioned public routes and preserves queries', async () => {
    const response = await middleware(request('/api/v1/bookmarks?collection=65582294&page=2'))
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://zenhungyep.com/api/bookmarks?collection=65582294&page=2'
    )
    expect(response.headers.get('api-version')).toBe('v1')
    expect(response.headers.get('deprecation')).toBeNull()
    expect((await middleware(request('/api/auth/raindrop'))).headers.get('x-middleware-next')).toBe('1')
  })
  it('enforces shared alias quotas, accepts the full limit, counts down and resets', async () => {
    vi.useFakeTimers()
    const token = newClient()
    for (let i = 0; i < 5; i++) {
      const response = await middleware(request('/api/submit-bookmark', 'POST', token))
      expect(response.status).toBe(200)
      expect(response.headers.get('ratelimit-remaining')).toBe(String(4 - i))
      expect(response.headers.get('cache-control')).toBe('private, no-store')
    }
    vi.advanceTimersByTime(10_000)
    const response = await middleware(request('/api/v1/submit-bookmark', 'POST', token))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('590')
    expect(response.headers.get('ratelimit')).toBe('"submit-bookmark";r=0;t=590')
    expect(response.headers.get('ratelimit-policy')).toBe('"submit-bookmark";q=5;w=600')
    expect((await response.json()).code).toBe('rate_limited')
    vi.advanceTimersByTime(590_000)
    expect((await middleware(request('/api/submit-bookmark', 'POST', token))).status).toBe(200)
  })
  it('ignores spoofed forwarding chains and uses Vercel-controlled client identity', async () => {
    const token = newClient()
    for (let i = 0; i < 5; i++) {
      const req = request('/api/submit-bookmark', 'POST', token)
      req.headers.set('x-forwarded-for', `1.1.1.${i + 1}, 9.9.9.9`)
      expect((await middleware(req)).status).toBe(200)
    }
    const spoofed = request('/api/submit-bookmark', 'POST', token)
    spoofed.headers.set('x-forwarded-for', '4.4.4.4')
    expect((await middleware(spoofed)).status).toBe(429)
    expect((await middleware(request('/api/submit-bookmark', 'POST'))).status).toBe(200)
  })
  it('does not share an unknown bucket or trust arbitrary headers outside the hosting platform', async () => {
    vi.stubEnv('VERCEL', '')
    for (let i = 0; i < 6; i++) {
      const read = await middleware(request('/api/posts'))
      expect(read.status).toBe(200)
      expect(read.headers.get('ratelimit')).toBeNull()
    }
    const write = await middleware(request('/api/submit-bookmark', 'POST'))
    expect(write.status).toBe(503)
    expect((await write.json()).code).toBe('client_identity_unavailable')
  })
  it('never falls back to untrusted forwarded headers when Vercel identity is missing', async () => {
    const req = new NextRequest('https://zenhungyep.com/api/submit-bookmark', {
      method: 'POST',
      headers: { 'x-forwarded-for': '8.8.8.8' }
    })
    expect((await middleware(req)).status).toBe(503)
  })
  it('advertises real read quotas and isolates clients', async () => {
    for (const path of ['/api/posts', '/api/bookmarks', '/api/visual/list']) {
      const response = await middleware(request(path))
      expect(response.headers.get('ratelimit-limit')).toBe('120')
      expect(response.headers.get('ratelimit-remaining')).toBe('119')
    }
  })
})

describe('route error safety', () => {
  it('converts malformed JSON to 400 before invoking the handler', async () => {
    const handler = vi.fn()
    const response = await apiHandler(handler)(
      new Request('https://example.com', { method: 'POST', body: '{', headers: { 'content-type': 'application/json' } })
    )
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('invalid_json')
    expect(handler).not.toHaveBeenCalled()
  })
  it('contains unexpected errors without exposing secrets', async () => {
    const response = await apiHandler(() => {
      throw new Error('secret-key')
    })(new Request('https://example.com'))
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('secret-key')
  })
  it('preserves successful payloads and forbids caching client quota responses', async () => {
    const response = await apiHandler(() => Response.json({ posts: [] }, { headers: { 'Cache-Control': 'public' } }))(
      new Request('https://example.com')
    )
    expect(await response.json()).toEqual({ posts: [] })
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
