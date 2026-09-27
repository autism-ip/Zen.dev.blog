import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { RichText } from '@/components/contentful/rich-text'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { WritingViews } from '@/components/writing-views'
import { SITE } from '@/lib/agent/site'
import { getAllPostSlugs, getPost } from '@/lib/contentful'
import { contentDescription, decodeRouteSlug, pageMetadata, safeJsonLd, validDate } from '@/lib/seo'
import { getDateTimeFormat, isDevelopment } from '@/lib/utils'

export async function generateStaticParams() {
  const allPosts = await getAllPostSlugs()
  if (!allPosts || allPosts.length === 0) {
    return []
  }

  return allPosts.filter((post) => post && post.slug).map((post) => ({ slug: post.slug }))
}

async function fetchData(slug) {
  const { isEnabled } = await draftMode()
  const data = await getPost(slug, isDevelopment ? true : isEnabled)
  if (!data) notFound()

  // Ensure required data structure exists with comprehensive fallbacks
  const title = data.title || 'Untitled'
  const safeData = {
    title,
    date: data.date || null,
    seo: data.seo || { title, description: '', ogImageTitle: title, ogImageSubtitle: '' },
    content: data.content || { json: null },
    sys: data.sys || {
      firstPublishedAt: undefined,
      publishedAt: undefined
    }
  }

  return {
    data: safeData
  }
}

export default async function WritingSlug(props) {
  const params = await props.params
  const slug = decodeRouteSlug(params.slug)
  const { data } = await fetchData(slug)

  const { title, date, seo = {}, content, sys = {} } = data

  const { firstPublishedAt, publishedAt: updatedAt } = sys
  const { title: seoTitle, description: seoDescription } = seo

  const postDate = date || firstPublishedAt
  const dateString = validDate(postDate) ? getDateTimeFormat(postDate) : null
  const datePublished = validDate(postDate)
  const dateModified = validDate(updatedAt)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: seoTitle || title,
    description: seoDescription || contentDescription(content, `An article by ${SITE.author}.`),
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      '@id': `${SITE.url}/#person`,
      name: SITE.author,
      url: `${SITE.url}/about`
    },
    url: `${SITE.url}/writing/${encodeURIComponent(slug)}`,
    mainEntityOfPage: `${SITE.url}/writing/${encodeURIComponent(slug)}`,
    image: `${SITE.url}/opengraph-image`
  }

  return (
    <>
      <ScrollArea className="bg-white" useScrollAreaId>
        <FloatingHeader scrollTitle={title} goBackLink="/writing">
          <WritingViews slug={slug} />
        </FloatingHeader>
        <div className="content-wrapper @container/writing">
          <article className="content">
            <Breadcrumbs
              items={[
                { name: 'Writing', path: '/writing' },
                { name: title, path: `/writing/${encodeURIComponent(slug)}` }
              ]}
            />
            <PageTitle
              title={title}
              subtitle={
                <time dateTime={datePublished} className="text-gray-400">
                  {dateString}
                </time>
              }
              className="mb-6 flex flex-col gap-2"
            />
            <RichText content={content} />
          </article>
        </div>
      </ScrollArea>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  )
}

export async function generateMetadata(props) {
  const { slug: rawSlug } = await props.params
  const slug = decodeRouteSlug(rawSlug)
  if (!slug) notFound()
  const { data } = await fetchData(slug)
  const meta = pageMetadata(`/writing/${encodeURIComponent(slug)}`, {
    title: data.seo?.title || data.title,
    description:
      data.seo?.description || contentDescription(data.content, `Read ${data.title}, an article by ${SITE.author}.`)
  })
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: validDate(data.date || data.sys?.firstPublishedAt),
      modifiedTime: validDate(data.sys?.publishedAt),
      authors: [`${SITE.url}/about`]
    }
  }
}
