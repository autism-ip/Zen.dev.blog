/**
 * [INPUT]: 依赖 @/lib/agent/site 的 SITE.url
 * [OUTPUT]: 对外提供 toIndexPosts(posts) —— 不可变地按发布时间倒序映射为索引条目（title/slug/url/date/updatedAt）
 * [POS]: lib/agent 的数据整形层；被 llms.txt、api/posts 与 markdown 路由共用，避免三处重复映射逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { SITE } from '@/lib/agent/site'

const publishedAt = (post) => post?.date || post?.sys?.firstPublishedAt || null

export function toIndexPosts(posts = []) {
  return [...posts]
    .sort((a, b) => new Date(publishedAt(b) || 0) - new Date(publishedAt(a) || 0))
    .map((post) => ({
      title: post.title || 'Untitled',
      slug: post.slug,
      url: `${SITE.url}/writing/${encodeURIComponent(post.slug)}`,
      date: publishedAt(post),
      updatedAt: post?.sys?.publishedAt || null
    }))
}
