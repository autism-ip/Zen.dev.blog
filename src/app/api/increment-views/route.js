import { NextResponse } from 'next/server'

import { apiError, apiHandler } from '@/lib/agent/http'
import supabase from '@/lib/supabase/private'
import { isDevelopment } from '@/lib/utils'

// 10 分钟窗口内单 IP 上限 60 次（真人浏览远低于此，仅防脚本刷量）

// slug 安全字符集：字母数字 / 中文 / 空格 / -_.% （% 仅作为已编码序列残留放行，非法编码在 decode 阶段即被拒绝）
const SLUG_PATTERN = /^[a-zA-Z0-9\u4e00-\u9fff\s\-_.%]+$/
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

  // searchParams 已解码一次；此处兜底再解码（含孤立 % 的畸形编码直接 400）
  let slug = rawSlug
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    return apiError({ code: 'invalid_slug', message: 'Invalid slug parameter', hint: INVALID_SLUG_HINT, status: 400 })
  }

  if (slug.length < 1 || slug.length > 200 || !SLUG_PATTERN.test(slug)) {
    return apiError({ code: 'invalid_slug', message: 'Invalid slug parameter', hint: INVALID_SLUG_HINT, status: 400 })
  }

  try {
    await supabase.client.rpc('increment_view_count', { page_slug: slug })
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
