import { timingSafeEqual } from 'node:crypto'

import { getAdminSecret } from '@/lib/auth/admin-secret'

// ----------------------------------------------------------------
// L3: Admin area auth guard (layout level)
// [INPUT]: 依赖 next/headers 的 headers，依赖 @/lib/auth/admin-secret 的 getAdminSecret
// [OUTPUT]: 对外提供未认证时的 401 页面或正常 children 渲染
// [POS]: /admin 子树的统一守卫，保护 raindrop-setup 及未来所有 admin 页面，
//        密钥存 Supabase admin_secrets 表（加密），Node runtime 解密比对
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
// ----------------------------------------------------------------

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

// --- 恒定时间字符串比较 ---
// 长度不等直接返回 false（timingSafeEqual 遇长度不等会抛错，必须先判长）
function safeEqual(a, b) {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

// --- 布局守卫 ---
export default async function AdminLayout({ children }) {
  const adminSecret = await getAdminSecret()

  // 密钥缺失（DB 无记录/解密失败）时 fail-closed：生产环境拒绝；非生产放行
  if (!adminSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Admin secret not found in DB — admin access denied')
      return <UnauthorizedPage />
    }
    return <>{children}</>
  }

  const { headers } = await import('next/headers')
  const hdrs = await headers()
  const authorization = hdrs.get('authorization')

  if (!authorization || !authorization.startsWith('Basic ')) {
    return <UnauthorizedPage />
  }

  try {
    const decoded = atob(authorization.slice(6))
    const password = decoded.slice(decoded.indexOf(':') + 1)
    if (!safeEqual(password, adminSecret)) {
      return <UnauthorizedPage />
    }
  } catch {
    return <UnauthorizedPage />
  }

  return <>{children}</>
}
