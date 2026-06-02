import { NextResponse } from 'next/server'

function checkBasicAuth(request) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null

  const auth = request.headers.get('authorization')
  if (auth && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6))
      const password = decoded.slice(decoded.indexOf(':') + 1)
      if (password === secret) return null
    } catch {
      /* malformed auth header */
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"' }
  })
}

export function middleware(request, event) {
  const { pathname } = request.nextUrl

  // --- Admin 路由守卫 ---
  if (pathname.startsWith('/admin')) {
    const denied = checkBasicAuth(request)
    if (denied) return denied
  }

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
  // matcher: '/writing/:path/'
  // The below solution also filters out the user navigations which is not desired:
  // See: https://github.com/vercel/next.js/discussions/37736#discussioncomment-7886601
  matcher: [
    {
      source: '/writing/:path/',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    },
    '/admin/:path*'
  ]
}
