import { headers } from 'next/headers'
import { Suspense } from 'react'

import RaindropSetupContent from './RaindropSetupContent'

// ----------------------------------------------------------------
// L3: Admin page auth guard
// [INPUT]: 依赖 next/headers 的 headers，依赖环境变量 ADMIN_SECRET
// [OUTPUT]: 对外提供未认证时的 401 Response 或正常页面渲染
// [POS]: admin/raindrop-setup 的守卫逻辑，被 Next.js App Router 自动调用
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
// ----------------------------------------------------------------

export const metadata = {
  title: 'Raindrop Setup - Admin',
  description: 'Configure Raindrop.io OAuth authentication'
}

// --- Basic Auth 验证 ---
function verifyBasicAuth(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Basic ')) {
    return false
  }

  try {
    const decoded = atob(authorizationHeader.slice(6))
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) return false

    const password = decoded.slice(colonIndex + 1)
    return password === process.env.ADMIN_SECRET
  } catch {
    return false
  }
}

// --- 401 响应 ---
function unauthorizedResponse() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area", charset="UTF-8"'
    }
  })
}

// --- 页面守卫 ---
export default async function RaindropSetupPage() {
  const adminSecret = process.env.ADMIN_SECRET

  // ADMIN_SECRET 未设置 → 开发环境向后兼容，直接放行
  if (adminSecret) {
    const hdrs = await headers()
    const authorization = hdrs.get('authorization')

    if (!verifyBasicAuth(authorization)) {
      return unauthorizedResponse()
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <RaindropSetupContent />
      </Suspense>
    </div>
  )
}
