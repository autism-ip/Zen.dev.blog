import { Feed } from 'feed'

import { SITE } from '@/lib/agent/site'
import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const bookmarks = await getBookmarks()
    if (!bookmarks || bookmarks.length === 0) {
      return new Response(emptyFeed('Bookmarks unavailable'), {
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
      })
    }
    const date = new Date()
    const siteURL = SITE.url
    const author = {
      name: SITE.title,
      link: SITE.url
    }

    const feed = new Feed({
      title: `Bookmarks RSS feed by ${author.name}`,
      description: 'Stay up to date with my latest selection of various handpicked bookmarks',
      id: siteURL,
      link: `${siteURL}/bookmarks`,
      language: 'en',
      copyright: `All rights reserved ${date.getFullYear()}, ${author.name}`,
      author,
      feedLinks: {
        rss: `${siteURL}/bookmarks.xml`
      }
    })

    const bookmarkList = []
    for (const bookmark of bookmarks) {
      const bookmarkItems = await getBookmarkItems(bookmark._id)
      const { items = [] } = bookmarkItems ?? {}

      items?.slice(0, 10).forEach((bookmark) => {
        bookmarkList.push({
          id: bookmark._id,
          guid: bookmark._id,
          title: bookmark.title,
          link: bookmark.link,
          description: bookmark.excerpt,
          content: bookmark.excerpt,
          image: rssImage(bookmark.cover),
          date: new Date(bookmark.created),
          updated: new Date(bookmark.lastUpdate),
          author: [author],
          contributor: [author]
        })
      })
    }

    const sortedBookmarks = bookmarkList.sort(
      (a, b) => new Date(b.updated || b.created) - new Date(a.updated || a.created)
    )
    sortedBookmarks.forEach((bookmark) => {
      feed.addItem({ ...bookmark })
    })

    return new Response(feed.rss2().replaceAll('<guid>', '<guid isPermaLink="false">'), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Bookmarks RSS generation failed:', error)
    return new Response(emptyFeed('Bookmarks RSS Error'), {
      status: 500,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
    })
  }
}

function emptyFeed(title) {
  return new Feed({
    title,
    description: 'The bookmark feed is temporarily unavailable. Please retry later.',
    id: SITE.url,
    link: `${SITE.url}/bookmarks`,
    copyright: SITE.title
  }).rss2()
}

// feed 4.x does not XML-escape enclosure attributes or infer query-based image formats.
function rssImage(cover) {
  if (!cover) return undefined
  try {
    const url = new URL(cover)
    if (!['https:', 'http:'].includes(url.protocol)) return undefined
    const format = url.searchParams.get('format') || url.pathname.split('.').pop().toLowerCase()
    const mime = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      avif: 'image/avif',
      svg: 'image/svg+xml'
    }[format]
    if (!mime) return undefined
    return { url: url.href.replaceAll('&', '&amp;'), type: mime, length: 0 }
  } catch {
    return undefined
  }
}
