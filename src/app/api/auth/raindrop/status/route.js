import { NextResponse } from 'next/server'

import { getTokenManager } from '@/lib/auth/get-token-manager'

export async function GET() {
  try {
    console.info('=== Token Status Check ===')
    const tokenManager = getTokenManager()

    // 检查是否有存储的token信息
    let tokenInfo = null
    try {
      // 尝试获取存储的token信息
      if (tokenManager.getTokenInfo) {
        tokenInfo = await tokenManager.getTokenInfo()
      } else if (tokenManager.getStoredTokenInfo) {
        // env-token-manager 使用不同的方法名
        const storedInfo = await tokenManager.getStoredTokenInfo()
        if (storedInfo) {
          tokenInfo = {
            hasTokens: true,
            expiresAt: new Date(storedInfo.accessExpiresAt).toISOString(),
            lastRefreshed: new Date(storedInfo.updatedAt).toISOString(),
            isExpired: storedInfo.accessExpiresAt < Date.now()
          }
        }
      }
    } catch (tokenError) {
      console.warn('Could not retrieve token info:', tokenError.message)
    }

    console.info('Token status result:', { hasTokens: !!tokenInfo })

    if (!tokenInfo) {
      return NextResponse.json({ hasTokens: false })
    }

    return NextResponse.json(tokenInfo)
  } catch (error) {
    console.error('Failed to get token status:', error)
    return NextResponse.json({ error: 'Failed to get token status' }, { status: 500 })
  }
}
