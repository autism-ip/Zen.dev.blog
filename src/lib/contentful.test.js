// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

import { getAllPosts } from '@/lib/contentful'

vi.mock('server-only', () => ({}))
afterEach(() => vi.unstubAllGlobals())
it('bounds the post index data cache to one hour without changing the payload', async () => {
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
