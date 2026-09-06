import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const CACHE_KEY = 'raindrop:bookmarks:cache'

export async function POST(request) {
  // 鉴权: 仅允许持有 CRON_SECRET 的调用方, 防止匿名触发缓存清空与全量回源
  const expectedSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 清除缓存
    await kv.del(CACHE_KEY)

    console.info('Bookmarks cache cleared')

    return NextResponse.json({
      success: true,
      message: 'Cache cleared. Next request will fetch fresh data.'
    })
  } catch (error) {
    console.error('Failed to clear bookmarks cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}
