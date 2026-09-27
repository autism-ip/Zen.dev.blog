import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'

import { sharedMetadata } from '@/app/shared-metadata'
import { OpenGraphImage } from '@/components/og-image'
import { getAllPostSlugs, getWritingSeo } from '@/lib/contentful'
import { getBoldFont, getRegularFont } from '@/lib/fonts'
import { decodeRouteSlug } from '@/lib/seo'
import { isDevelopment } from '@/lib/utils'

export const size = {
  width: sharedMetadata.ogImage.width,
  height: sharedMetadata.ogImage.height
}

export async function generateStaticParams() {
  const allPosts = await getAllPostSlugs()
  return allPosts.map((post) => ({ slug: post.slug }))
}

export default async function OpenGraphImagePage({ params }) {
  const { isEnabled } = await draftMode()
  const slug = decodeRouteSlug((await params).slug)
  if (!slug) notFound()
  const [seoData, regularFontData, boldFontData] = await Promise.all([
    getWritingSeo(slug, isDevelopment ? true : isEnabled),
    getRegularFont(),
    getBoldFont()
  ])

  if (!seoData) notFound()
  const { title, ogImageTitle, ogImageSubtitle } = seoData.seo || {}

  return new ImageResponse(
    <OpenGraphImage title={ogImageTitle || title} description={ogImageSubtitle || 'by Zen'} url="writing" />,
    {
      ...size,
      fonts: [
        {
          name: 'Geist Sans',
          data: regularFontData,
          style: 'normal',
          weight: 400
        },
        {
          name: 'Geist Sans',
          data: boldFontData,
          style: 'normal',
          weight: 500
        }
      ]
    }
  )
}
