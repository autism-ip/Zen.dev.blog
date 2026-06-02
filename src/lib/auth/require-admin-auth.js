/**
 * [INPUT]: 依赖 process.env.ADMIN_SECRET
 * [OUTPUT]: 对外提供 requireAdminAuth() 函数
 * [POS]: auth 模块的 API 路由守卫，被 OAuth 相关 API route 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextResponse } from 'next/server'

/**
 * 验证 API 请求的 admin 权限。
 * ADMIN_SECRET 未设置时放行（开发兼容）；已设置时校验 Authorization header。
 * @param {Request} request
 * @returns {NextResponse|null} 返回 401 响应，或 null 表示放行
 */
export function requireAdminAuth(request) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null

  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Basic ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = atob(auth.slice(6))
    const password = decoded.slice(decoded.indexOf(':') + 1)
    if (password !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
