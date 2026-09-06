import { NextResponse } from 'next/server'

import { getTokenManager } from '@/lib/auth/get-token-manager'
import { COLLECTION_IDS } from '@/lib/constants'

// 动态获取存储方案 (仅 KV 有存储层)
function getStorage() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = require('@vercel/kv')
    return kv
  }
  return null
}

const RAINDROP_API_URL = 'https://api.raindrop.io/rest/v1'
const CACHE_KEY = 'raindrop:bookmarks:cache'
const CACHE_TTL = 2 * 24 * 60 * 60 * 1000 // 2天缓存

// collectionId 必须是数字字符串, 且属于公开收藏夹白名单 (防止越权读取私有收藏夹)
function isWhitelistedCollectionId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && COLLECTION_IDS.includes(Number(value))
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('collection')
    const page = parseInt(searchParams.get('page') || '0')

    // 如果指定了收藏夹ID，返回该收藏夹的分页数据
    if (collectionId) {
      // 白名单校验: 拒绝白名单外的 id, 防止越权读取私有收藏夹
      if (!isWhitelistedCollectionId(collectionId)) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
      }
      // 分页参数校验: 防止恶意大页码拖垮回源
      if (!Number.isInteger(page) || page < 0 || page > 200) {
        return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
      }
      return await getCollectionBookmarks(collectionId, page)
    }

    // 否则返回所有书签 (保持兼容性)
    const storage = getStorage()
    const tokenManager = getTokenManager()

    // 如果有存储可用，使用缓存
    if (storage) {
      const cachedData = await storage.get(CACHE_KEY)
      if (cachedData && cachedData.cached_at + CACHE_TTL > Date.now()) {
        console.info('Returning cached bookmarks')
        return NextResponse.json(cachedData.data)
      }
    }

    // 获取有效的访问令牌
    const accessToken = await tokenManager.getValidAccessToken()

    // 获取所有收藏夹的书签
    const allBookmarks = await fetchAllBookmarks(accessToken)

    // 如果有存储可用，缓存结果
    if (storage) {
      await storage.set(CACHE_KEY, {
        data: allBookmarks,
        cached_at: Date.now()
      })
    }

    console.info(`Fetched ${allBookmarks.length} bookmarks`)
    return NextResponse.json(allBookmarks)
  } catch (error) {
    console.error('Bookmarks API error:', error)

    // 尝试返回缓存的数据作为降级方案
    const storage = getStorage()
    if (storage) {
      const cachedData = await storage.get(CACHE_KEY)
      if (cachedData) {
        console.info('Returning stale cached data due to error')
        return NextResponse.json(cachedData.data)
      }
    }

    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}

async function getCollectionBookmarks(collectionId, page = 0) {
  const cacheKey = `raindrop:collection:${collectionId}:page:${page}`
  const storage = getStorage()
  const tokenManager = getTokenManager()

  try {
    // 如果有存储可用，检查分页缓存
    if (storage) {
      const cachedData = await storage.get(cacheKey)
      if (cachedData && cachedData.cached_at + CACHE_TTL > Date.now()) {
        return NextResponse.json(cachedData.data)
      }
    }

    const accessToken = await tokenManager.getValidAccessToken()
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }

    const url = `${RAINDROP_API_URL}/raindrops/${collectionId}?page=${page}&perpage=50`
    const response = await fetch(url, options)

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - token may be expired')
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const items = data.items || []

    // 如果有存储可用，缓存分页结果
    if (storage) {
      await storage.set(cacheKey, {
        data: items,
        cached_at: Date.now()
      })
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error(`Error fetching collection ${collectionId} page ${page}:`, error)

    // 尝试返回缓存数据
    if (storage) {
      const cachedData = await storage.get(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData.data)
      }
    }

    return NextResponse.json({ error: 'Failed to fetch collection bookmarks' }, { status: 500 })
  }
}

async function fetchAllBookmarks(accessToken) {
  const allBookmarks = []
  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  for (const collectionId of COLLECTION_IDS) {
    try {
      let page = 0
      let hasMore = true

      while (hasMore) {
        const url = `${RAINDROP_API_URL}/raindrops/${collectionId}?page=${page}&perpage=50`
        const response = await fetch(url, options)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - token may be expired')
          }
          break
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          // 添加收藏夹信息到每个书签
          const itemsWithCollection = data.items.map((item) => ({
            ...item,
            collectionId: collectionId
          }))
          allBookmarks.push(...itemsWithCollection)
          page++
        } else {
          hasMore = false
        }

        // 避免API限制
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`Error fetching collection ${collectionId}:`, error)
      // 继续处理其他收藏夹
    }
  }

  return allBookmarks
}
