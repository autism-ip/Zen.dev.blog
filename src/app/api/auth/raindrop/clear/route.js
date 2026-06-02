import { NextResponse } from 'next/server'

import { getTokenManager } from '@/lib/auth/get-token-manager'

export async function POST() {
  try {
    const tokenManager = getTokenManager()

    // 不同的token manager可能有不同的清除方法
    if (tokenManager.clearTokens) {
      await tokenManager.clearTokens()
    } else {
      console.warn('Token manager does not support clearing tokens')
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens cleared successfully'
    })
  } catch (error) {
    console.error('Failed to clear tokens:', error)
    return NextResponse.json({ error: 'Failed to clear tokens' }, { status: 500 })
  }
}
