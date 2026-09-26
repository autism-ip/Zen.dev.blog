/**
 * [INPUT]: 依赖 @/lib/agent/markdown 的 llmsTxt、@/lib/agent/posts 的 toIndexPosts、@/lib/contentful 的 getAllPosts
 * [OUTPUT]: GET /llms.txt —— 面向 agent 的纯文本指南（含 when-to-use 与如何调用）
 * [POS]: app/llms.txt 的发布路由，与 robots.js / sitemap.js 并列的机器可读发现入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { llmsTxt } from '@/lib/agent/markdown'
import { toIndexPosts } from '@/lib/agent/posts'
import { getAllPosts } from '@/lib/contentful'

// 与首页 ISR 同步：Contentful 数据变化最多 1 小时反映到 llms.txt
export const revalidate = 3600

export async function GET() {
  const posts = toIndexPosts(await getAllPosts())

  return new Response(llmsTxt({ posts }), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
