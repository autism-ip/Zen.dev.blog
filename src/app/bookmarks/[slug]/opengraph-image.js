import { ImageResponse } from 'next/og'

import { sharedMetadata } from '@/app/shared-metadata'
import { OpenGraphImage } from '@/components/og-image'
import { getBoldFont, getRegularFont } from '@/lib/fonts'
import { getBookmarks } from '@/lib/raindrop-with-auth'

export const size = {
  width: sharedMetadata.ogImage.width,
  height: sharedMetadata.ogImage.height
}
export const contentType = sharedMetadata.ogImage.type
export const alt = 'Bookmark'

export async function generateImageMetadata() {
  const bookmarks = await getBookmarks()
  if (!bookmarks || bookmarks.length === 0) {
    return [
      {
        slug: 'default',
        size: { width: 1200, height: 630 },
        contentType: 'image/png'
      }
    ]
  }
  return bookmarks.map((bookmark) => ({
    slug: bookmark.slug,
    size: { width: 1200, height: 630 },
    contentType: 'image/png'
  }))
}

export default async function Image({ params }) {
  const { slug } = await params
  const [bookmarks, regularFontData, boldFontData] = await Promise.all([
    getBookmarks(),
    getRegularFont(),
    getBoldFont()
  ])

  let currentBookmark = null
  if (bookmarks && bookmarks.length > 0) {
    currentBookmark = bookmarks.find((b) => b.slug === slug)
  }

  const title = currentBookmark?.title || 'Bookmarks'
  const description = currentBookmark
    ? `A curated selection of handpicked ${currentBookmark.title.toLowerCase()} bookmarks by Zen`
    : 'A curated selection of bookmarks by Zen'

  return new ImageResponse(
    (
      <OpenGraphImage
        title={title}
        description={description}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        }
        url="bookmarks"
      />
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist Sans', data: regularFontData, style: 'normal', weight: 400 },
        { name: 'Geist Sans', data: boldFontData, style: 'normal', weight: 500 }
      ]
    }
  )
}
