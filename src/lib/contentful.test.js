// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

import { getAllPosts, getPost } from '@/lib/contentful'

vi.mock('server-only', () => ({}))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
it('bounds the post index data cache to one hour without changing the payload', async () => {
  vi.stubEnv('CONTENTFUL_SPACE_ID', 'test-space')
  vi.stubEnv('CONTENTFUL_ACCESS_TOKEN', 'test-token')
  const posts = [{ title: 'Fresh writing', slug: 'fresh', date: '2026-09-27' }]
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: { postCollection: { items: posts } } }))
  vi.stubGlobal('fetch', fetch)
  expect(await getAllPosts(false)).toEqual(posts)
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('graphql.contentful.com'),
    expect.objectContaining({
      cache: 'force-cache',
      next: { revalidate: 3600 }
    })
  )
})

it('distinguishes a missing article from a configured CMS outage', async () => {
  vi.stubEnv('CONTENTFUL_SPACE_ID', 'test-space')
  vi.stubEnv('CONTENTFUL_ACCESS_TOKEN', 'test-token')
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(Response.json({ data: { postCollection: { items: [] } } }))
  vi.stubGlobal('fetch', fetch)
  await expect(getPost('missing', false)).rejects.toThrow('Content service unavailable')
  expect(await getPost('missing', false)).toBeNull()
})
it('escapes URL slugs in GraphQL queries', async () => {
  vi.stubEnv('CONTENTFUL_SPACE_ID', 'test-space')
  vi.stubEnv('CONTENTFUL_ACCESS_TOKEN', 'test-token')
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: { postCollection: { items: [] } } }))
  vi.stubGlobal('fetch', fetch)
  await getPost('a"b', false)
  expect(JSON.parse(fetch.mock.calls[0][1].body).query).toContain('slug: ' + JSON.stringify('a"b'))
})
