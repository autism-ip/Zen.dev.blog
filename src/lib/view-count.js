/**
 * [INPUT]: Existing server-only Supabase URL/service key and validated writing slugs
 * [OUTPUT]: Shared slug normalization and a bounded, direct view-counter RPC
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
}
