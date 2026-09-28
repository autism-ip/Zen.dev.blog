import Link from 'next/link'
import { Suspense } from 'react'

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
import { HOME_BIO, SITE } from '@/lib/agent/site'
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
      <FloatingHeader scrollTitle={SITE.displayName} />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title={SITE.displayName} />
          <div className="mb-6 flex max-w-[65ch] flex-col gap-4 text-base leading-7 text-gray-600">
            {[HOME_BIO[0], HOME_BIO.slice(1, 3).join(' '), HOME_BIO.slice(3).join(' ')].map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? 'mb-0 font-medium text-gray-900' : 'mb-0'}>
                {paragraph}
              </p>
            ))}
          </div>
          <SunnyToggle />
          <Button asChild variant="link" className="inline px-0">
            <Link href="/writing">
              <h2 className="mt-8 mb-4">Writing</h2>
            </Link>
          </Button>
          <Suspense fallback={<ScreenLoadingSpinner />}>
            <WritingList items={items} header="Writing" />
          </Suspense>
          <PenflowSignature text={SITE.displayName} />
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/')
