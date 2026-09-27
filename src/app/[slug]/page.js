import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { RichText } from '@/components/contentful/rich-text'
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { getAllPageSlugs, getPage } from '@/lib/contentful'
import { decodeRouteSlug, pageMetadata } from '@/lib/seo'
import { isDevelopment } from '@/lib/utils'

export async function generateStaticParams() {
  const allPages = await getAllPageSlugs()

  // 排除已有静态页面的路径，防止路由冲突
  const excludedPaths = [
    'stack',
    'workspace',
    'journey',
    'writing',
    'bookmarks',
    'visual',
    'musings',
    'friends',
    'about',
    'contact',
    'privacy',
    'developers'
  ]

  return allPages
    .filter((page) => !page.hasCustomPage) // filter out pages that have custom pages, e.g. /journey
    .filter((page) => !excludedPaths.includes(page.slug)) // 排除静态路径，防止冲突
    .map((page) => ({
      slug: page.slug
    }))
}

async function fetchData(slug) {
  const { isEnabled } = await draftMode()
  const page = await getPage(slug, isDevelopment || isEnabled)
  if (!page) notFound()
  return { page }
}

export default async function PageSlug(props) {
  const params = await props.params
  const slug = decodeRouteSlug(params.slug)
  const {
    page: { title, content }
  } = await fetchData(slug)

  return (
    <ScrollArea useScrollAreaId>
      <GradientBg />
      <FloatingHeader scrollTitle={title} />
      <div className="content-wrapper">
        <div className="content">
          <Breadcrumbs items={[{ name: title, path: `/${encodeURIComponent(slug)}` }]} />
          <PageTitle title={title} />
          <Suspense fallback={<ScreenLoadingSpinner />}>
            <RichText content={content} />
          </Suspense>
        </div>
      </div>
    </ScrollArea>
  )
}

export async function generateMetadata(props) {
  const { slug: rawSlug } = await props.params
  const slug = decodeRouteSlug(rawSlug)
  if (!slug) notFound()
  const { page } = await fetchData(slug)
  return pageMetadata(`/${encodeURIComponent(slug)}`, {
    ...page.seo,
    title: page.seo?.title || page.title,
    image: `/${encodeURIComponent(slug)}/opengraph-image`
  })
}
