import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getTokenManager } from '@/lib/auth/get-token-manager'

export async function GET() {
  // 验证请求来源 (Vercel Cron 或开发环境)
  const authHeader = headers().get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.info('Starting daily scheduled token refresh check...')

    const tokenManager = getTokenManager()
    const tokenInfo = await tokenManager.getStoredTokenInfo()

    if (!tokenInfo) {
      console.info('No tokens found, skipping refresh')
      return NextResponse.json({
        success: true,
        message: 'No tokens to refresh'
      })
    }

    // 检查是否需要刷新 (提前12小时刷新，因为只有每日检查)
    const shouldRefresh = tokenInfo.accessExpiresAt < Date.now() + 12 * 60 * 60 * 1000

    if (shouldRefresh) {
      console.info('Token expires soon, refreshing...')
      await tokenManager.refreshAccessToken(tokenInfo.refreshToken)

      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
        refreshed: true
      })
    } else {
      console.info('Token still valid, no refresh needed')
      return NextResponse.json({
        success: true,
        message: 'Token still valid',
        refreshed: false,
        expiresAt: tokenInfo.accessExpiresAt
      })
    }
  } catch (error) {
    // ── 错误分类 ──────────────────────────────────────────────
    // needs_reauth: refresh_token 本身失效，需用户重新授权
    // refresh_failed: 临时性故障（网络、限流等），下次 cron 可自动恢复
    const msg = error.message || ''
    const needsReauth = msg.includes('401') || msg.includes('invalid_grant')

    const errorType = needsReauth ? 'needs_reauth' : 'refresh_failed'
    console.error(`[cron] Token refresh error [${errorType}]:`, msg)

    return NextResponse.json(
      {
        success: false,
        needs_reauth: needsReauth,
        error: msg
      },
      { status: needsReauth ? 401 : 500 }
    )
  }
}
