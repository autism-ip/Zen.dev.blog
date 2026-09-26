/**
 * [INPUT]: Query slug, public API boundary and server-only view-count provider
 * [OUTPUT]: Legacy counter success payload or structured validation/upstream errors
 * [POS]: Rate-limited public entry point; internal analytics call the provider directly
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { NextResponse } from 'next/server'

import { apiError, apiHandler } from '@/lib/agent/http'
import { isDevelopment } from '@/lib/utils'
import { decodeViewSlug, incrementViewCount } from '@/lib/view-count'

const INVALID_SLUG_HINT = 'Use 1-200 characters: letters, digits, CJK, space, dash, underscore, or dot'

async function handle(request) {
  if (isDevelopment) {
    return apiError({
      code: 'not_available_in_development',
      message: 'Not available in development',
      hint: 'Call this endpoint from a production deployment',
      status: 400
    })
  }

  const searchParams = request.nextUrl.searchParams
  const rawSlug = searchParams.get('slug')
  if (!rawSlug) {
    return apiError({
      code: 'missing_slug',
      message: 'Missing slug parameter',
      hint: 'Pass ?slug=<page-slug> in the query string',
      status: 400
    })
  }

  // searchParams has decoded once; preserve legacy validation before the shared provider.
  const slug = decodeViewSlug(rawSlug)
  if (!slug) {
    return apiError({ code: 'invalid_slug', message: 'Invalid slug parameter', hint: INVALID_SLUG_HINT, status: 400 })
  }

  try {
    await incrementViewCount(slug)
    return NextResponse.json({ messsage: `View count incremented successfully for slug: ${slug}` }, { status: 200 })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return apiError({
      code: 'upstream_unavailable',
      message: 'Failed to increment view count',
      hint: 'The counter store is temporarily unreachable; retry later',
      status: 500
    })
  }
}

export const POST = apiHandler(handle)
