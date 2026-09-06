import { NextResponse } from 'next/server'

// Edge runtime 无 timingSafeEqual：
// 对两侧字符串做 SHA-256 摘要（摘要恒为 32 字节，天然规避长度差异），
// 再逐字节 XOR 累计后判定，比较耗时与内容无关
async function constantTimeEqual(a, b) {
  const digest = async (value) => {
    const data = new TextEncoder().encode(value)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return new Uint8Array(hash)
  }

  const hashA = await digest(a)
  const hashB = await digest(b)

  let diff = 0
  for (let i = 0; i < hashA.length; i++) {
    diff |= hashA[i] ^ hashB[i]
  }
  return diff === 0
}

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"' }
  })
}

async function checkBasicAuth(request) {
  const secret = process.env.ADMIN_SECRET

  // ADMIN_SECRET 缺失时 fail-closed：
  // 生产环境直接拒绝；非生产环境放行，方便本地调试
  if (!secret) {
    return process.env.NODE_ENV === 'production' ? unauthorized() : null
  }

  const auth = request.headers.get('authorization')
  if (auth && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6))
      const password = decoded.slice(decoded.indexOf(':') + 1)
      if (await constantTimeEqual(password, secret)) return null
    } catch {
      /* malformed auth header */
    }
  }

  return unauthorized()
}

export async function middleware(request, event) {
  const { pathname } = request.nextUrl

  // --- Admin 路由守卫 ---
  if (pathname.startsWith('/admin')) {
    const denied = await checkBasicAuth(request)
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
    },
    '/admin/:path*',
    '/api/auth/raindrop/:path((?!callback$).*)'
  ]
}
