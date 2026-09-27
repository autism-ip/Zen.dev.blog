/**
 * [INPUT]: NextRequest, API/Markdown boundaries and server-only view-count provider
 * [OUTPUT]: Negotiated responses, public API quotas and background internal page analytics
 * [POS]: Site middleware; page analytics shares the visitor quota without HTTP self-fetches
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { NextResponse } from 'next/server'

import { apiBoundary, claimPageView } from '@/lib/agent/api'
import { prefersMarkdown, VARIANT_HEADER } from '@/lib/agent/http'
import { decodeViewSlug, incrementViewCount } from '@/lib/view-count'

export async function middleware(request, event) {
  const { pathname } = request.nextUrl

  if (pathname === '/api' || pathname.startsWith('/api/')) return apiBoundary(request)

  // --- Markdown 内容协商 ---
  // 仅当客户端显式要求 text/markdown 且非 RSC 导航请求时处理。
  // 直接返回受控响应而非重写：app 路由管线会给响应追加自己的 Vary（RSC 系列），
  // 造成重复的 Vary 头，部分客户端只读第一个而判定缺失 Accept。此处在 middleware 收口，
  // 保证 Vary 唯一且包含 Accept；取回失败时回退为重写，功能不中断。
  if (!request.headers.get('rsc') && prefersMarkdown(request.headers.get('accept'))) {
    const url = request.nextUrl.clone()
    url.pathname = `/api/markdown${pathname === '/' ? '' : pathname}`

    try {
      const upstream = await fetch(url, { headers: { accept: 'text/markdown' } })

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: VARIANT_HEADER,
          'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
        }
      })
    } catch (error) {
      console.error('Markdown negotiation fetch failed, falling back to rewrite', error)
      return NextResponse.rewrite(url)
    }
  }

  // --- Writing 分析 ---
  // 仅精确匹配 /writing/<单段 slug>（与旧 matcher '/writing/:path' 语义一致）
  const writingSlug = pathname.match(/^\/writing\/([^/]+)$/)?.[1]

  const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch'
  // Match the legacy query decode followed by the public route slug validation.
  const slug = decodeViewSlug(decodeViewSlug(writingSlug))
  if (
    slug &&
    request.method === 'GET' &&
    !isPrefetch &&
    process.env.NODE_ENV === 'production' &&
    claimPageView(request, slug)
  ) {
    event.waitUntil(
      incrementViewCount(slug).catch(() => {
        console.error('Failed to update writing view count')
      })
    )
  }

  return NextResponse.next()
}

export const config = {
  // API（含带点路径）由统一边界处理；HTML 页面继续 Markdown 协商。
  matcher: ['/api/:path*', '/((?!api/|_next/|.*\\..*).*)']
}
