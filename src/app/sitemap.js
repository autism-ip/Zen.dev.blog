import { SECTIONS, SITE } from '@/lib/agent/site'
import { getAllPageSlugs, getAllPosts } from '@/lib/contentful'
import { getBookmarks } from '@/lib/raindrop-with-auth'
import { getSortedPosts } from '@/lib/utils'

export default async function sitemap() {
  const staticPages = [
    { url: SITE.url, changeFrequency: 'yearly', priority: 1 },
    ...SECTIONS.map((section) => ({ url: `${SITE.url}${section.path}`, changeFrequency: 'monthly', priority: 0.8 }))
  ]
  try {
    const [allPosts, bookmarks, allPages] = await Promise.all([
      getAllPosts().catch(() => []),
      getBookmarks().catch((error) => {
        console.info('Sitemap: Bookmarks unavailable during build:', error.message)
        return []
      }),
      getAllPageSlugs().catch(() => [])
    ])

    const sortedWritings = getSortedPosts(allPosts)
    const writings = sortedWritings.map((post) => {
      return {
        url: `${SITE.url}/writing/${encodeURIComponent(post.slug)}`,
        lastModified: post.sys.publishedAt,
        changeFrequency: 'yearly',
        priority: 0.5
      }
    })

    const mappedBookmarks = (bookmarks || []).map((bookmark) => {
      return {
        url: `${SITE.url}/bookmarks/${encodeURIComponent(bookmark.slug)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1
      }
    })

    const pages = allPages.map((page) => {
      let changeFrequency = 'yearly'
      if (['writing', 'journey'].includes(page.slug)) changeFrequency = 'monthly'
      if (['bookmarks'].includes(page.slug)) changeFrequency = 'daily'

      let lastModified = page.sys.publishedAt
      if (['writing', 'journey', 'bookmarks'].includes(page.slug)) lastModified = new Date()

      let priority = 0.5
      if (['writing', 'journey'].includes(page.slug)) priority = 0.8
      if (['bookmarks'].includes(page.slug)) priority = 1

      return {
        url: `${SITE.url}/${encodeURIComponent(page.slug)}`,
        lastModified,
        changeFrequency,
        priority
      }
    })

    return [
      ...new Map(
        [...staticPages, ...pages, ...writings, ...mappedBookmarks].map((entry) => [entry.url, entry])
      ).values()
    ]
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    // 返回基本的 sitemap，不包含书签
    return staticPages
  }
}
