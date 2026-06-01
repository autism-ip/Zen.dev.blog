import { Suspense } from 'react'

import { FloatingHeader } from '@/components/floating-header'

// ISR 兜底：即使 webhook 失效，最多 1 小时自动刷新
export const revalidate = 3600
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { WritingListLayout } from '@/components/writing/writing-list-layout'
import { getAllPosts, getPageSeo } from '@/lib/contentful'
import { getSortedPosts } from '@/lib/utils'

async function fetchData() {
  const allPosts = await getAllPosts()
  const sortedPosts = getSortedPosts(allPosts)
  return { sortedPosts }
}

export default async function Writing() {
  const { sortedPosts } = await fetchData()

  return (
    <ScrollArea className="lg:hidden">
      <FloatingHeader title="Writing" />
      <Suspense fallback={<ScreenLoadingSpinner />}>
        <WritingListLayout list={sortedPosts} isMobile />
      </Suspense>
    </ScrollArea>
  )
}

export async function generateMetadata() {
  const seoData = await getPageSeo('writing')
  if (!seoData) return null

  const seo = seoData.seo || {}
  const { title, description } = seo
  const siteUrl = '/writing'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteUrl
    },
    alternates: {
      canonical: siteUrl
    }
  }
}
