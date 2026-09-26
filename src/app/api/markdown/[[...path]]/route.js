/**
 * [INPUT]: 依赖 @/lib/agent/http 的 markdownResponse、@/lib/agent/markdown 的文档构造、@/lib/agent/posts 的索引、@/lib/agent/site 的分区表；依赖 @/lib/contentful 与 @/lib/raindrop-with-auth 做存在性判定
 * [OUTPUT]: GET /api/markdown/[[...path]] —— 任意已知路径的 Markdown 镜像；未知路径返回 404 + Markdown 说明体
 * [POS]: middleware 内容协商的重写目标；HTML 路由的机器可读镜像，同时承担 agent 友好 404 的错误体
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { markdownResponse } from '@/lib/agent/http'
import {
  bookmarkCollectionMarkdown,
  homeMarkdown,
  notFoundMarkdown,
  pageMarkdown,
  postMarkdown,
  sectionMarkdown
} from '@/lib/agent/markdown'
import { toIndexPosts } from '@/lib/agent/posts'
import { HOME_BIO, SECTION_BY_PATH } from '@/lib/agent/site'
import { getAllPageSlugs, getAllPosts, getPage, getPost } from '@/lib/contentful'
import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'

// 与首页 ISR 同步
export const revalidate = 3600

const decodeSegment = (value) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const notFound = (pathname) => markdownResponse(notFoundMarkdown(pathname), { status: 404 })

// ---------------------------------------------------------------------------
// 存在性判定与镜像构造（顺序与 HTML 路由优先级一致）
// ---------------------------------------------------------------------------

async function writingPost(segments) {
  const post = await getPost(segments[1])
  if (!post) return null

  return postMarkdown({
    title: post.title,
    slug: post.slug || segments[1],
    date: post.date || post.sys?.firstPublishedAt || null,
    content: post.content?.json,
    links: post.content?.links
  })
}

async function bookmarkCollection(segments) {
  const collections = (await getBookmarks().catch(() => [])) ?? []
  const collection = collections.find((item) => item.slug === segments[1])
  if (!collection) return null

  const items = await getBookmarkItems(collection._id).catch(() => null)

  return bookmarkCollectionMarkdown(collection, items?.items ?? [])
}

async function contentfulPage(slug) {
  const pages = await getAllPageSlugs()
  if (!pages.some((page) => page.slug === slug && !page.hasCustomPage)) return null

  const page = await getPage(slug)
  if (!page) return null

  return pageMarkdown({
    title: page.title,
    slug: page.slug || slug,
    content: page.content?.json,
    links: page.content?.links
  })
}

// ---------------------------------------------------------------------------
// 路由
// ---------------------------------------------------------------------------

export async function GET(request, props) {
  const params = await props.params
  const segments = (params?.path ?? []).map(decodeSegment)
  const pathname = `/${segments.join('/')}`

  if (segments.length === 0) {
    return markdownResponse(homeMarkdown({ posts: toIndexPosts(await getAllPosts()), bio: HOME_BIO }))
  }

  if (segments.length === 2 && segments[0] === 'writing') {
    const markdown = await writingPost(segments)
    return markdown ? markdownResponse(markdown) : notFound(pathname)
  }

  if (segments.length === 2 && segments[0] === 'bookmarks') {
    const markdown = await bookmarkCollection(segments)
    return markdown ? markdownResponse(markdown) : notFound(pathname)
  }

  if (segments.length === 1) {
    const section = SECTION_BY_PATH[pathname]

    if (section) {
      const posts = pathname === '/writing' ? toIndexPosts(await getAllPosts()) : []
      return markdownResponse(sectionMarkdown(section, { posts }))
    }

    const markdown = await contentfulPage(segments[0])
    if (markdown) return markdownResponse(markdown)
  }

  return notFound(pathname)
}
