/**
 * [INPUT]: Published Contentful article lookup, server-only Supabase credentials and validated slugs
 * [OUTPUT]: Shared slug normalization and a bounded RPC for existing published articles
 * [POS]: Internal page analytics and the public counter API share this provider without HTTP self-fetches
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import 'server-only'

const SLUG_PATTERN = /^[a-zA-Z0-9\u4e00-\u9fff\s\-_.%]+$/
export function decodeViewSlug(raw) {
  if (typeof raw !== 'string') return null
  try {
    const slug = decodeURIComponent(raw)
    return slug.length >= 1 && slug.length <= 200 && SLUG_PATTERN.test(slug) ? slug : null
  } catch {
    return null
  }
}

export async function incrementViewCount(slug) {
  // Check published existence without negative/stale CMS caching before privileged writes.
  const space = process.env.CONTENTFUL_SPACE_ID
  const token = process.env.CONTENTFUL_ACCESS_TOKEN
  if (!space || !token) throw new Error('Article lookup is not configured')
  const articleResponse = await fetch(`https://graphql.contentful.com/content/v1/spaces/${space}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query:
        'query($slug: String!) { postCollection(where: { slug: $slug }, preview: false, limit: 1) { items { slug } } }',
      variables: { slug }
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000)
  })
  if (!articleResponse.ok) throw new Error('Article lookup failed')
  const article = await articleResponse.json()
  const items = article?.data?.postCollection?.items
  if (article.errors?.length || !Array.isArray(items)) throw new Error('Article lookup failed')
  if (!items.some((item) => item?.slug === slug)) return false
  const base = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('Counter store is not configured')
  const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/increment_view_count`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_slug: slug }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000)
  })
  if (!response.ok) throw new Error('Counter store request failed')
  return true
}
