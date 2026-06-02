import { Suspense } from 'react'

import RaindropSetupContent from './RaindropSetupContent'

// ----------------------------------------------------------------
// L3: Admin page auth guard
// [INPUT]: 依赖 next/headers 的 headers，依赖环境变量 ADMIN_SECRET
// [OUTPUT]: 对外提供未认证时的 401 页面或正常页面渲染
// [POS]: admin/raindrop-setup 的守卫逻辑，被 Next.js App Router 自动调用
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
// ----------------------------------------------------------------

export const metadata = {
  title: 'Raindrop Setup - Admin',
  description: 'Configure Raindrop.io OAuth authentication'
}

// --- 未授权页面 ---
function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">401 - Unauthorized</h1>
        <p className="text-gray-600">需要认证才能访问此页面</p>
      </div>
    </div>
  )
}

// --- 页面守卫 ---
export default async function RaindropSetupPage() {
  const adminSecret = process.env.ADMIN_SECRET

  // ADMIN_SECRET 未设置 → 开发环境向后兼容，直接放行
  if (adminSecret) {
    const { headers } = await import('next/headers')
    const hdrs = await headers()
    const authorization = hdrs.get('authorization')

    if (!authorization || !authorization.startsWith('Basic ')) {
      return <UnauthorizedPage />
    }

    try {
      const decoded = atob(authorization.slice(6))
      const password = decoded.slice(decoded.indexOf(':') + 1)
      if (password !== adminSecret) {
        return <UnauthorizedPage />
      }
    } catch {
      return <UnauthorizedPage />
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
