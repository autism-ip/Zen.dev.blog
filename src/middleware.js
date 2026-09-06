import { NextResponse } from 'next/server'

export function middleware(request, event) {
  const { pathname } = request.nextUrl

  // --- Writing 分析 ---
  const writingSlug = pathname.match(/\/writing\/(.*)/)?.[1]

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
  if (writingSlug) event.waitUntil(sendAnalytics())
  return NextResponse.next()
}

export const config = {
  // matcher: '/writing/:path' — 无尾斜杠（trailingSlash: false，真实 URL 形态）
  // 带尾斜杠请求由 Next 308 重定向到无斜杠后才计数，天然避免双计数
  // The below solution also filters out the user navigations which is not desired:
  // See: https://github.com/vercel/next.js/discussions/37736#discussioncomment-7886601
  matcher: [
    {
      source: '/writing/:path',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
}
