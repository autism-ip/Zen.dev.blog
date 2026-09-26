/**
 * [INPUT]: 依赖 @/lib/agent/http 的 apiError、@/lib/agent/posts 的 toIndexPosts、@/lib/contentful 的 getAllPosts
 * [OUTPUT]: GET /api/posts —— 公开只读 JSON：全部写作文章的索引（含绝对 URL）
 * [POS]: app/api/posts 的公开读端点；补齐既有 API 只有书签与媒体、缺少文章索引的空洞，供 CLI 与 agent 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiError } from '@/lib/agent/http'
import { toIndexPosts } from '@/lib/agent/posts'
import { getAllPosts } from '@/lib/contentful'

export const revalidate = 3600

export async function GET() {
  try {
    const posts = toIndexPosts(await getAllPosts())

    return Response.json(
      { ok: true, posts },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
        }
      }
    )
  } catch (error) {
    console.error('Posts API error:', error)

    return apiError({
      code: 'upstream_unavailable',
      message: 'Failed to load posts',
      hint: 'Retry shortly, or read the RSS feed at /writing.xml',
      status: 500
    })
  }
}
