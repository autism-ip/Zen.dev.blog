/**
 * [INPUT]: Web Request/Response, NextResponse, @arcjet/ip, trusted host identity, SITE and shared JSON errors
 * [OUTPUT]: claimPageView and apiBoundary: versioned aliases, method errors, discovery and live quota headers
 * [POS]: Public API middleware boundary; owner/OAuth routes keep their existing handlers
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import findIp from '@arcjet/ip'
import { NextResponse } from 'next/server'

import { apiError } from '@/lib/agent/http'
import { SITE } from '@/lib/agent/site'

export const PUBLIC_API = {
  '/api': { method: 'GET', limit: 120, window: 60, policy: 'discovery' },
  '/api/posts': { method: 'GET', limit: 120, window: 60, policy: 'posts' },
  '/api/bookmarks': { method: 'GET', limit: 120, window: 60, policy: 'bookmarks' },
  '/api/visual/list': { method: 'GET', limit: 120, window: 60, policy: 'visual' },
  '/api/increment-views': { method: 'POST', limit: 60, window: 600, policy: 'increment-views' },
  '/api/submit-bookmark': { method: 'POST', limit: 5, window: 600, policy: 'submit-bookmark' },
  '/api/musings': { method: 'POST', limit: 5, window: 600, policy: 'musings' }
}

const INTERNAL_METHODS = {
  '/api/revalidate': ['GET', 'POST'],
  '/api/cron/refresh-tokens': ['GET'],
  '/api/disable-draft': ['GET'],
  '/api/draft': ['GET'],
  '/api/bookmarks/refresh': ['POST'],
  '/api/auth/raindrop': ['GET'],
  '/api/auth/raindrop/callback': ['GET'],
  '/api/auth/raindrop/status': ['GET'],
  '/api/auth/raindrop/clear': ['POST']
}

// Bounded, fixed-window, per-instance limiter, as with the previous route limiters.
// Aliases deliberately share buckets. Trust only the platform-controlled identity,
// or a header explicitly configured for a gateway that overwrites client input.
const buckets = new Map()
const MAX_BUCKETS = 5000
function clientIp(request) {
  const header = process.env.VERCEL === '1' ? 'x-real-ip' : process.env.TRUSTED_CLIENT_IP_HEADER
  if (!header) return ''
  const value = request.headers.get(header)
  if (!value) return ''
  // Restrict the resolver's input: it must not fall back to a caller's X-Forwarded-For.
  return findIp({ headers: new Headers({ 'x-real-ip': value }) }, { platform: 'vercel' })
}

function quota(token, policy) {
  const key = `${policy.policy}:${token}`
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.reset <= now) {
    if (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value)
    bucket = { count: 0, reset: now + policy.window * 1000 }
    buckets.set(key, bucket)
  }
  const allowed = bucket.count < policy.limit
  if (allowed) bucket.count++
  const remaining = Math.max(0, policy.limit - bucket.count)
  const reset = Math.max(1, Math.ceil((bucket.reset - now) / 1000))
  return {
    allowed,
    headers: {
      'RateLimit-Policy': `"${policy.policy}";q=${policy.limit};w=${policy.window}`,
      RateLimit: `"${policy.policy}";r=${remaining};t=${reset}`,
      // Compatibility fields; Reset is delay-seconds, never an epoch timestamp.
      'RateLimit-Limit': String(policy.limit),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(reset),
      ...(!allowed ? { 'Retry-After': String(reset) } : {})
    }
  }
}

// Page-triggered analytics uses the visitor's trusted identity, never an egress IP.
// Bound both total writes and repeated views; entries expire after ten minutes.
const pageViews = new Map()
export function claimPageView(request, slug) {
  const token = clientIp(request)
  if (!token) return false
  const key = `${token}:${slug}`
  const now = Date.now()
  if ((pageViews.get(key) || 0) > now) return false
  const policy = PUBLIC_API['/api/increment-views']
  if (!quota(token, policy).allowed) return false
  if (pageViews.size >= MAX_BUCKETS) pageViews.delete(pageViews.keys().next().value)
  pageViews.set(key, now + policy.window * 1000)
  return true
}

export function apiBoundary(request) {
  const pathname = request.nextUrl.pathname
  const versioned = pathname === '/api/v1' || pathname.startsWith('/api/v1/')
  const canonical = versioned ? pathname.replace(/^\/api\/v1/, '/api') : pathname
  const policy = PUBLIC_API[canonical]
  const internal = !versioned && (INTERNAL_METHODS[pathname] || (/^\/api\/markdown(?:\/|$)/.test(pathname) && ['GET']))
  const methods = policy ? [policy.method] : internal
  const headers = {
    'Cache-Control': 'private, no-store',
    Link: `<${SITE.url}/openapi.json>; rel="service-desc", <${SITE.url}/developers>; rel="service-doc"`,
    ...(policy ? { 'API-Version': 'v1' } : {})
  }
  if (!methods)
    return apiError({
      code: 'not_found',
      message: 'API endpoint not found',
      hint: `See ${SITE.url}/openapi.json for supported endpoints`,
      status: 404,
      headers
    })
  const allow = [...methods, ...(methods.includes('GET') ? ['HEAD'] : []), 'OPTIONS'].join(', ')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, Allow: allow } })
  if (!methods.includes(request.method) && !(request.method === 'HEAD' && methods.includes('GET'))) {
    return apiError({
      code: 'method_not_allowed',
      message: 'Method not allowed',
      hint: `Use ${allow}`,
      status: 405,
      headers: { ...headers, Allow: allow }
    })
  }
  if (!policy) return NextResponse.next()
  const token = clientIp(request)
  // No shared "unknown" bucket: keep public reads available without claiming a
  // per-client quota. Writes fail closed until the host supplies trusted identity.
  if (!token && policy.method !== 'GET') {
    return apiError({
      code: 'client_identity_unavailable',
      message: 'Client identity is unavailable',
      hint: 'The host must configure a trusted client IP source before accepting writes',
      status: 503,
      headers
    })
  }
  const result = token ? quota(token, policy) : { allowed: true, headers: {} }
  Object.assign(headers, result.headers)
  if (!result.allowed)
    return apiError({
      code: 'rate_limited',
      message: 'Too many requests',
      hint: 'Wait for Retry-After seconds before retrying',
      status: 429,
      headers
    })
  if (canonical === '/api') {
    return new Response(
      request.method === 'HEAD'
        ? null
        : JSON.stringify({
            name: SITE.title,
            version: 'v1',
            openapi: `${SITE.url}/openapi.json`,
            documentation: `${SITE.url}/developers`
          }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
  if (versioned) {
    const url = request.nextUrl.clone()
    url.pathname = canonical
    return NextResponse.rewrite(url, { headers })
  }
  return NextResponse.next({ headers })
}
