import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { CONTENT_TYPES } from '@/lib/constants'

export const dynamic = 'auto' // https://www.reddit.com/r/nextjs/comments/14iu6td/revalidatepath_not_updating_generatestaticparams/

const secret = `${process.env.NEXT_REVALIDATE_SECRET}`

// Contentful webhook topics
const TOPIC_UNPUBLISH = 'ContentManagement.Entry.unpublish'
const TOPIC_DELETE = 'ContentManagement.Entry.delete'

/**
 * 重新验证文章相关的所有路径
 * 包括详情页、列表页、首页、RSS、Sitemap
 */
function revalidatePostPaths(slug) {
  if (slug) {
    revalidatePath(`/writing/${slug}`)
  }
  revalidatePath('/writing')
  revalidatePath('/')
  revalidatePath('/writing.xml')
  revalidatePath('/sitemap.xml')
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const manualSecret = searchParams.get('secret')
    const path = searchParams.get('path')

    // 如果是手动重新验证特定路径（如 /musings）
    if (manualSecret || path) {
      // 验证密钥（可选，增加安全性）
      if (process.env.REVALIDATE_SECRET && manualSecret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
      }

      const pathToRevalidate = path || '/musings'
      revalidatePath(pathToRevalidate)

      return NextResponse.json({
        message: `Path ${pathToRevalidate} revalidated successfully`,
        timestamp: new Date().toISOString()
      })
    }

    // Contentful webhook 处理
    const payload = await request.json()
    const requestHeaders = new Headers(request.headers)
    const revalidateSecret = requestHeaders.get('x-revalidate-secret')
    const topic = requestHeaders.get('x-contentful-topic')

    if (revalidateSecret !== secret) {
      return Response.json(
        {
          revalidated: false,
          now: Date.now(),
          message: 'Invalid secret'
        },
        { status: 401 }
      )
    }

    // 解析 contentTypeId 和 slug
    let contentTypeId, slug

    if (payload.contentTypeId) {
      contentTypeId = payload.contentTypeId
      slug = payload.slug
    } else if (payload.sys && payload.sys.contentType) {
      contentTypeId = payload.sys.contentType.sys.id
      slug = payload.fields?.slug?.['en-US'] || payload.fields?.slug
    } else {
      return Response.json(
        {
          revalidated: false,
          now: Date.now(),
          message: 'Invalid payload format'
        },
        { status: 400 }
      )
    }

    const isUnpublish = topic === TOPIC_UNPUBLISH || topic === TOPIC_DELETE

    // unpublish/delete 事件：无论 slug 是否存在，都执行全量 revalidation
    // 因为 unpublish payload 可能不携带完整 fields
    if (isUnpublish) {
      switch (contentTypeId) {
        case CONTENT_TYPES.POST:
          revalidatePostPaths(slug)
          break
        case CONTENT_TYPES.PAGE:
          if (slug) revalidatePath(`/${slug}`)
          revalidatePath('/sitemap.xml')
          break
        case CONTENT_TYPES.LOGBOOK:
          revalidatePath('/journey')
          revalidatePath('/sitemap.xml')
          break
        default:
          revalidatePath('/')
          revalidatePath('/sitemap.xml')
      }

      return Response.json({
        revalidated: true,
        now: Date.now(),
        event: 'unpublish',
        contentTypeId,
        slug: slug || null
      })
    }

    // publish 事件：正常处理
    switch (contentTypeId) {
      case CONTENT_TYPES.PAGE:
        if (slug) {
          revalidatePath(`/${slug}`)
        } else {
          return Response.json(
            {
              revalidated: false,
              now: Date.now(),
              message: 'Missing page slug to revalidate'
            },
            { status: 400 }
          )
        }
        break
      case CONTENT_TYPES.POST:
        if (slug) {
          revalidatePostPaths(slug)
        } else {
          return Response.json(
            {
              revalidated: false,
              now: Date.now(),
              message: 'Missing writing slug to revalidate'
            },
            { status: 400 }
          )
        }
        break
      case CONTENT_TYPES.LOGBOOK:
        revalidatePath('/journey')
        break
      default:
        return Response.json(
          {
            revalidated: false,
            now: Date.now(),
            message: 'Invalid content type'
          },
          { status: 400 }
        )
    }

    return Response.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ message: 'Error revalidating', error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to revalidate',
    examples: ['POST /api/revalidate?path=/musings', 'POST /api/revalidate (with Contentful webhook payload)']
  })
}
