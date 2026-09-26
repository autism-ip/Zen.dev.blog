// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { POST as incrementViews } from '@/app/api/increment-views/route'
import { POST as createMusing } from '@/app/api/musings/route'
import { GET as listPosts } from '@/app/api/posts/route'
import { POST as submitBookmark } from '@/app/api/submit-bookmark/route'
import { getAllPosts } from '@/lib/contentful'

vi.mock('@/lib/contentful', () => ({ getAllPosts: vi.fn() }))
vi.mock('@/lib/supabase/private', () => ({ default: { client: { rpc: vi.fn().mockResolvedValue({}) } } }))
vi.mock('@/lib/utils', () => ({ isDevelopment: false }))
vi.mock('isbot', () => ({ isbot: () => false }))
const request = (body) =>
  new Request('https://zenhungyep.com/api', { method: 'POST', body, headers: { 'content-type': 'application/json' } })
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('public route regression cases', () => {
  it('preserves the posts payload and returns structured upstream failures', async () => {
    getAllPosts.mockResolvedValue([{ title: 'Test', slug: 'test', date: '2026-01-01' }])
    expect(await (await listPosts(new Request('https://example.com'))).json()).toMatchObject({
      ok: true,
      posts: [{ slug: 'test' }]
    })
    getAllPosts.mockRejectedValue(new Error('unavailable'))
    expect(await (await listPosts(new Request('https://example.com'))).json()).toMatchObject({
      code: 'upstream_unavailable'
    })
  })
  it.each([submitBookmark, createMusing])('returns JSON 400 for malformed input', async (handler) => {
    const response = await handler(request('{'))
    expect(response.status).toBe(400)
    expect((await response.json()).code).toBe('invalid_json')
  })
  it.each([submitBookmark, createMusing])(
    'rejects missing or non-object JSON before upstream calls',
    async (handler) => {
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)
      for (const body of [undefined, '', 'null', '[]', '123', '"text"']) {
        const response = await handler(request(body))
        expect(response.status).toBe(400)
        expect((await response.json()).hint).toBeTruthy()
      }
      expect(fetch).not.toHaveBeenCalled()
    }
  )
  it('validates musing body and labels before contacting GitHub', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const payload of [{ body: 42 }, { body: 'Text', labels: 'bad' }, { body: 'Text', labels: [1] }]) {
      expect((await createMusing(request(JSON.stringify(payload)))).status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })
  it('preserves owner publishing success and authentication', async () => {
    vi.stubEnv('MUSING_CODE', 'TEST-SECRET')
    vi.stubEnv('GITHUB_PAT', 'TEST-TOKEN')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ id: 1, number: 2, html_url: 'https://github.com/test/2' }))
    )
    expect((await createMusing(request(JSON.stringify({ body: 'Missing credential' })))).status).toBe(401)
    const response = await createMusing(request(JSON.stringify({ body: 'Hello TEST-SECRET', labels: ['Public'] })))
    expect(await response.json()).toMatchObject({ success: true, issue: { id: 1, title: 'Hello' } })
  })
  it('preserves bookmark success and turns upstream rejection into JSON 500', async () => {
    const payload = JSON.stringify({ url: 'https://example.com', email: 'reader@example.com' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ id: 'record', fields: {}, createdTime: '2026-01-01T00:00:00Z' }))
    )
    expect(await (await submitBookmark(request(payload))).json()).toMatchObject({ res: { id: 'record' } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'denied' }, { status: 403 })))
    const failed = await submitBookmark(request(payload))
    expect(failed.status).toBe(500)
    expect((await failed.json()).code).toBe('upstream_error')
  })
  it('accepts an empty streamed body for the query-only view counter', async () => {
    const req = new NextRequest('https://example.com/api/increment-views?slug=test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: new ReadableStream({
        start(controller) {
          controller.close()
        }
      }),
      duplex: 'half'
    })
    expect(req.body).not.toBeNull()
    const response = await incrementViews(req)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ messsage: 'View count incremented successfully for slug: test' })
  })
  it('preserves view validation and the legacy successful response field', async () => {
    const req = (slug) => new NextRequest(`https://example.com/api/increment-views${slug}`, { method: 'POST' })
    expect((await incrementViews(req(''))).status).toBe(400)
    expect((await incrementViews(req('?slug=%25'))).status).toBe(400)
    expect(await (await incrementViews(req('?slug=test'))).json()).toEqual({
      messsage: 'View count incremented successfully for slug: test'
    })
  })
})
