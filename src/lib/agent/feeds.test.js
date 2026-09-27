import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as bookmarksFeed } from '@/app/bookmarks.xml/route'
import { GET as writingFeed } from '@/app/writing.xml/route'
import { getAllPosts } from '@/lib/contentful'
import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'

vi.mock('@/lib/contentful', () => ({ getAllPosts: vi.fn() }))
vi.mock('@/lib/raindrop-with-auth', () => ({ getBookmarks: vi.fn(), getBookmarkItems: vi.fn() }))
const parse = async (response) => new DOMParser().parseFromString(await response.text(), 'text/xml')
beforeEach(() => {
  getBookmarks.mockResolvedValue([{ _id: 1 }])
  getBookmarkItems.mockResolvedValue({
    items: [
      {
        _id: 2,
        title: 'A & B',
        excerpt: 'Text',
        link: 'https://example.com',
        cover: 'https://example.com/image?format=jpg&name=large',
        created: '2026-01-01',
        lastUpdate: '2026-01-01'
      }
    ]
  })
  getAllPosts.mockResolvedValue([])
})
describe('canonical and valid RSS', () => {
  it('escapes enclosure URLs and declares GUID semantics', async () => {
    const doc = await parse(await bookmarksFeed())
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.querySelector('enclosure').getAttribute('url')).toBe('https://example.com/image?format=jpg&name=large')
    expect(doc.querySelector('enclosure').getAttribute('type')).toBe('image/jpeg')
    expect(doc.querySelector('guid').getAttribute('isPermaLink')).toBe('false')
    expect(doc.querySelector('channel > link').textContent).toBe('https://zenhungyep.com/bookmarks')
    expect(doc.querySelector('channel > title').textContent).toContain('Zen')
    expect(doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0].getAttribute('href')).toBe(
      'https://zenhungyep.com/bookmarks.xml'
    )
  })
  it('keeps required channel fields on empty and failed feeds', async () => {
    for (const unavailable of [false, true]) {
      if (unavailable) getBookmarks.mockRejectedValue(new Error('offline'))
      else getBookmarks.mockResolvedValue([])
      const response = await bookmarksFeed()
      expect(response.status).toBe(unavailable ? 500 : 200)
      const doc = await parse(response)
      expect(doc.querySelector('parsererror')).toBeNull()
      for (const field of ['title', 'link', 'description'])
        expect(doc.querySelector(`channel > ${field}`).textContent).toBeTruthy()
    }
  })
  it('uses the actual writing feed self URL', async () => {
    const doc = await parse(await writingFeed())
    expect(doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0].getAttribute('href')).toBe(
      'https://zenhungyep.com/writing.xml'
    )
  })
})
