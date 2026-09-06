/**
 * [INPUT]: 依赖 next/server 的 NextResponse、next/headers 的 cookies、node:crypto 的 randomBytes
 * [OUTPUT]: 对外提供 GET 处理器：生成 CSRF state、签发 httpOnly cookie、重定向 Raindrop 授权页
 * [POS]: auth/raindrop 的授权起点，被管理后台「连接 Raindrop」入口调用，与 callback/route.js 配对构成 OAuth 闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { randomBytes } from 'node:crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const STATE_COOKIE = 'raindrop_oauth_state'
const STATE_MAX_AGE = 600 // 10 分钟，缩短 CSRF 攻击窗口

export async function GET() {
  const clientId = process.env.RAINDROP_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!clientId) {
    return NextResponse.json({ error: 'Missing RAINDROP_CLIENT_ID' }, { status: 500 })
  }

  // CSRF 防护：生成一次性 state，写入 httpOnly cookie，回调时比对
  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_MAX_AGE
  })

  // 构建 OAuth2 授权 URL - 使用 v2 API
  const authUrl = new URL('https://api.raindrop.io/v2/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/raindrop/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
