import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { BookmarkList } from '@/components/bookmark-list'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { ScreenLoadingSpinner } from '@/components/screen-loading-spinner'
import { ScrollArea } from '@/components/scroll-area'
import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'
import { decodeRouteSlug, pageMetadata } from '@/lib/seo'
import { sortByProperty } from '@/lib/utils'

export async function generateStaticParams() {
  const bookmarks = await getBookmarks()
  if (!bookmarks) return []
  return bookmarks.map((bookmark) => ({ slug: bookmark.slug }))
}

async function fetchData(slug) {
  const bookmarks = await getBookmarks()
  if (!bookmarks || bookmarks.length === 0) notFound()

  const currentBookmark = bookmarks.find((bookmark) => bookmark.slug === slug)
  if (!currentBookmark) notFound()

  const sortedBookmarks = sortByProperty(bookmarks, 'title')

  const bookmarkItems = await getBookmarkItems(currentBookmark._id)
  if (!bookmarkItems?.result) throw new Error('Bookmark content temporarily unavailable')
  return { bookmarks: sortedBookmarks, currentBookmark, bookmarkItems }
}

export default async function CollectionPage(props) {
  const params = await props.params
  const slug = decodeRouteSlug(params.slug)
  if (!slug) notFound()
  const { bookmarks, currentBookmark, bookmarkItems } = await fetchData(slug)

  return (
    <ScrollArea className="bg-grid" useScrollAreaId>
      <FloatingHeader
        scrollTitle={currentBookmark.title}
        goBackLink="/bookmarks"
        bookmarks={bookmarks}
        currentBookmark={currentBookmark}
      />
      <div className="content-wrapper">
        <div className="content @container">
          <Breadcrumbs
            items={[
              { name: 'Bookmarks', path: '/bookmarks' },
              { name: currentBookmark.title, path: `/bookmarks/${encodeURIComponent(slug)}` }
            ]}
          />
          <PageTitle title={currentBookmark.title} />
          <Suspense fallback={<ScreenLoadingSpinner />}>
            <BookmarkList id={currentBookmark._id} initialData={bookmarkItems} collectionSlug={slug} />
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
  const bookmarks = await getBookmarks()
  const current = bookmarks?.find((bookmark) => bookmark.slug === slug)
  if (!current) notFound()
  return pageMetadata(`/bookmarks/${encodeURIComponent(slug)}`, {
    title: `${current.title} | Bookmarks`,
    description: `Handpicked ${current.title.toLowerCase()} bookmarks curated by Zen.`
  })
}
