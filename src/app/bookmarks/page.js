import Link from 'next/link'
import { Suspense } from 'react'

import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { getOptionalPageSeo } from '@/lib/contentful'
import { getBookmarks } from '@/lib/raindrop-with-auth'
import { pageMetadata } from '@/lib/seo'
import { sortByProperty } from '@/lib/utils'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'

async function fetchData() {
  const bookmarks = await getBookmarks()
  const sortedBookmarks = sortByProperty(bookmarks, 'title')
  return { bookmarks: sortedBookmarks }
}

export default async function Writing() {
  const { bookmarks } = await fetchData()

  return (
    <ScrollArea>
      <FloatingHeader title="Bookmarks" bookmarks={bookmarks} />
      <div className="px-4 pt-6">
        <PageTitle title="Bookmarks" />
      </div>
      <Suspense fallback={<ScreenLoadingSpinner />}>
        {bookmarks?.map((bookmark) => {
          return (
            <Link
              key={bookmark._id}
              href={`/bookmarks/${bookmark.slug}`}
              className="flex flex-col gap-1 border-b px-4 py-3 text-sm hover:bg-gray-100"
            >
              <span className="font-medium">{bookmark.title}</span>
              <span className="text-slate-500">{bookmark.count} bookmarks</span>
            </Link>
          )
        })}
      </Suspense>
    </ScrollArea>
  )
}

export async function generateMetadata() {
  const data = await getOptionalPageSeo('bookmarks')
  return pageMetadata('/bookmarks', data?.seo)
}
