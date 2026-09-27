/**
 * [INPUT]: Published CMS indexes, bookmark collections and the local section registry
 * [OUTPUT]: Deduplicated canonical URLs with real modification dates only
 * [POS]: Search-engine sitemap; excludes private, diagnostic and unroutable CMS entries
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SECTIONS, SITE } from '@/lib/agent/site'
import { getAllPageSlugs, getAllPosts } from '@/lib/contentful'
import { getBookmarks } from '@/lib/raindrop-with-auth'
import { validDate, validSlug } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap() {
  const staticPages = [{ url: SITE.url }, ...SECTIONS.map(({ path }) => ({ url: `${SITE.url}${path}` }))]
  const [posts, collections, pages] = await Promise.all([
    getAllPosts(false).catch(() => []),
    getBookmarks().catch(() => []),
    getAllPageSlugs(false).catch(() => [])
  ])
  const reserved = new Set([
    'admin',
    'api',
    'debug-og',
    'icon',
    'opengraph-image',
    ...SECTIONS.map(({ path }) => path.slice(1))
  ])
  const entry = (path, date) => ({
    url: `${SITE.url}${path}`,
    ...(validDate(date) && { lastModified: validDate(date) })
  })
  const dynamic = [
    ...(posts || [])
      .filter((post) => validSlug(post?.slug))
      .map((post) => entry(`/writing/${encodeURIComponent(post.slug)}`, post.sys?.publishedAt)),
    ...(collections || [])
      .filter((collection) => validSlug(collection?.slug))
      .map((collection) => entry(`/bookmarks/${encodeURIComponent(collection.slug)}`, collection.lastUpdate)),
    ...(pages || [])
      .filter((page) => validSlug(page?.slug) && !page.hasCustomPage && !reserved.has(page.slug))
      .map((page) => entry(`/${encodeURIComponent(page.slug)}`, page.sys?.publishedAt))
  ]
  return [...new Map([...staticPages, ...dynamic].map((item) => [item.url, item])).values()]
}
