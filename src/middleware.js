import { NextResponse } from 'next/server'

import { apiBoundary } from '@/lib/agent/api'
import { prefersMarkdown, VARIANT_HEADER } from '@/lib/agent/http'

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

  async function sendAnalytics() {
    const URL =
      process.env.NODE_ENV === 'production'
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/increment-views`
        : 'http://localhost:3000/api/increment-views'

    try {
      const res = await fetch(`${URL}?slug=${writingSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (res.status !== 200) console.error('Failed to send analytics', res)
    } catch (error) {
      console.error('Error sending analytics', error)
    }
  }

  /**
   * The `event.waitUntil` function is the real magic here.
   * It enables the response to proceed without waiting for the completion of `sendAnalytics()`.
   * This ensures that the user experience remains uninterrupted and free from unnecessary delays.
   */
  const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch'
  if (writingSlug && !isPrefetch) event.waitUntil(sendAnalytics())

  return NextResponse.next()
}

export const config = {
  // API（含带点路径）由统一边界处理；HTML 页面继续 Markdown 协商。
  matcher: ['/api/:path*', '/((?!api/|_next/|.*\\..*).*)']
}
