import Link from 'next/link'
import { Fragment, Suspense } from 'react'

import { pageMetadata } from '@/lib/seo'

// ISR 兜底：即使 webhook 失效，最多 1 小时自动刷新
export const revalidate = 3600

import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { PenflowSignature } from '@/components/penflow-signature'
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { SunnyOverlay, SunnyToggle } from '@/components/sunny-mode'
import { Button } from '@/components/ui/button'
import { WritingList } from '@/components/writing-list'
import { HOME_BIO, HOME_GUIDE } from '@/lib/agent/site'
import { getAllPosts } from '@/lib/contentful'
import { getItemsByYear, getSortedPosts } from '@/lib/utils'

async function fetchData() {
  const allPosts = await getAllPosts()
  const sortedPosts = getSortedPosts(allPosts)
  const items = getItemsByYear(sortedPosts)
  return { items }
}

export default async function Home() {
  const { items } = await fetchData()

  return (
    <ScrollArea useScrollAreaId>
      <SunnyOverlay />
      <FloatingHeader scrollTitle="Zen" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Zen (zenhungyep)" />
          <p>
            {HOME_BIO.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
          <SunnyToggle />
          {/* 开发者资源入口：公开 API、OpenAPI 规格与 agent 指南 */}
          <p className="mt-6 text-sm">
            <span className="text-gray-500">Developers &amp; agents:</span>{' '}
            <Link href="/developers" className="link">
              /developers
            </Link>
            <span className="text-gray-400"> · </span>
            <Link href="/llms.txt" className="link">
              /llms.txt
            </Link>
            <span className="text-gray-400"> · </span>
            <Link href="/openapi.json" className="link">
              /openapi.json
            </Link>
          </p>
          <Button asChild variant="link" className="inline px-0">
            <Link href="/writing">
              <h2 className="mt-8 mb-4">Writing</h2>
            </Link>
          </Button>
          <Suspense fallback={<ScreenLoadingSpinner />}>
            <WritingList items={items} header="Writing" />
          </Suspense>
          <section className="mt-8">
            <h2 className="mb-4">About this site</h2>
            {HOME_GUIDE.map((paragraph) => (
              <p key={paragraph} className="mb-4">
                {paragraph}
              </p>
            ))}
          </section>
          <PenflowSignature />
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/')
