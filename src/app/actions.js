'use server'

import { COLLECTION_IDS } from '@/lib/constants'

// id 必须是数字或数字字符串, 且属于公开收藏夹白名单 (防止客户端篡改越权读取)
function isWhitelistedCollectionId(value) {
  return /^\d+$/.test(String(value)) && COLLECTION_IDS.includes(Number(value))
}

export async function getBookmarkItemsByPageIndex(id, pageIndex) {
  // 服务端白名单校验: 不合法直接失败, 不抛错以保持调用方兼容
  if (!isWhitelistedCollectionId(id)) {
    console.warn('Blocked bookmarks request with non-whitelisted collection id:', id)
    return { result: false, items: [], count: 0 }
  }

  // 分页参数校验: 必须是 0-200 之间的整数
  if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex > 200) {
    console.warn('Blocked bookmarks request with invalid page index:', pageIndex)
    return { result: false, items: [], count: 0 }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bookmarks?collection=${id}&page=${pageIndex}`,
      {
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch bookmarks:', response.status)
      return { result: false, items: [] }
    }

    const data = await response.json()

    // 兼容原有数据格式
    return {
      result: true,
      items: data || [],
      count: data.length || 0
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return { result: false, items: [] }
  }
}
