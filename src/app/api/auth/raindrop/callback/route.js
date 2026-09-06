/**
 * [INPUT]: 依赖 next/server 的 NextResponse、next/headers 的 cookies、@/lib/auth/get-token-manager 的 getTokenManager
 * [OUTPUT]: 对外提供 GET 处理器：校验 CSRF state 后交换授权码、存储令牌、重定向 setup 成功页
 * [POS]: auth/raindrop 的回调端点，被 Raindrop 授权页重定向调用，与兄弟 route.js（授权起点）配对构成 OAuth 闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getTokenManager } from '@/lib/auth/get-token-manager'

const RAINDROP_API_URL = 'https://api.raindrop.io/rest/v1'
const STATE_COOKIE = 'raindrop_oauth_state'

export async function GET(request) {
  console.info('=== OAuth Callback Started ===')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  console.info('URL Parameters:', {
    hasCode: !!code,
    hasError: !!error,
    codeLength: code?.length || 0,
    error: error || 'none'
  })

  // CSRF 防护：state 必须与 cookie 中签发值一致，缺失/不匹配一律拒绝，不执行 token 交换
  const cookieStore = await cookies()
  const storedState = cookieStore.get(STATE_COOKIE)?.value
  if (!storedState || !state || storedState !== state) {
    console.error('OAuth state validation failed:', {
      hasStoredState: !!storedState,
      hasState: !!state
    })
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })
  }

  // state 一次性使用，验证通过即销毁，防止重放
  cookieStore.delete(STATE_COOKIE)

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.json({ error: 'OAuth authorization failed' }, { status: 400 })
  }

  if (!code) {
    console.error('No authorization code found in callback')
    return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 })
  }

  try {
    console.info('=== Starting token exchange process ===')

    const clientId = process.env.RAINDROP_CLIENT_ID
    const clientSecret = process.env.RAINDROP_CLIENT_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // 只记录存在性与长度，绝不打印 client id / secret / 环境变量名
    console.info('Environment check:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      baseUrl
    })

    if (!clientId || !clientSecret) {
      console.error('Missing Raindrop credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      })
      throw new Error('Missing RAINDROP_CLIENT_ID or RAINDROP_CLIENT_SECRET')
    }

    // 交换授权码获取访问令牌
    const tokenRequest = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${baseUrl}/api/auth/raindrop/callback`
    }

    const tokenResponse = await fetch('https://raindrop.io/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenRequest)
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      })
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    // 只记录脱敏信息，绝不打印 token 值
    console.info('Token response received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token
    })

    // Check if response contains an error (handle both OAuth standard and Raindrop.io format)
    if (tokenData.error) {
      console.error('OAuth error in token response:', {
        error: tokenData.error,
        errorDescription: tokenData.error_description || 'Unknown error'
      })
      throw new Error(`OAuth error: ${tokenData.error} - ${tokenData.error_description || 'Unknown error'}`)
    }

    // Check for Raindrop.io specific error format
    if (tokenData.result === false) {
      console.error('Raindrop.io API error:', {
        errorMessage: tokenData.errorMessage || 'Unknown error',
        status: tokenData.status
      })
      throw new Error(
        `Raindrop.io API error: ${tokenData.errorMessage || 'Unknown error'} (status: ${tokenData.status})`
      )
    }

    // Validate required tokens
    if (!tokenData.access_token) {
      console.error('Missing access_token in response:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token
      })
      throw new Error('Missing access_token in response')
    }

    if (!tokenData.refresh_token) {
      console.error('Missing refresh_token in response:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token
      })
      throw new Error('Missing refresh_token in response')
    }

    // 存储令牌
    const tokenManager = getTokenManager()
    await tokenManager.storeInitialTokens(
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in || 1209600 // 默认14天
    )
    console.info('Initial tokens stored successfully')

    // 验证令牌是否工作
    const testResponse = await fetch(`${RAINDROP_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    if (!testResponse.ok) {
      throw new Error('Token validation failed')
    }

    const userInfo = await testResponse.json()
    console.info('OAuth setup completed for user:', userInfo.user?.fullName)

    // 重定向到成功页面
    return NextResponse.redirect(`${baseUrl}/admin/raindrop-setup?success=true`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ error: 'Failed to complete OAuth setup', details: error.message }, { status: 500 })
  }
}
