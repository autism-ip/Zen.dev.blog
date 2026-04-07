import { draftMode } from 'next/headers'
import { ImageResponse } from 'next/og'

import { sharedMetadata } from '@/app/shared-metadata'
import { OpenGraphImage } from '@/components/og-image'
import { getAllPageSlugs, getPageSeo } from '@/lib/contentful'
import { getBoldFont, getRegularFont } from '@/lib/fonts'

export const size = {
  width: sharedMetadata.ogImage.width,
  height: sharedMetadata.ogImage.height
}

export async function generateStaticParams() {
  const allPages = await getAllPageSlugs()

  return allPages
    .filter((page) => !page.hasCustomPage)
    .map((page) => ({
      slug: page.slug
    }))
}

export default async function OpenGraphImagePage({ params }) {
  const { isEnabled } = await draftMode()
  const { slug } = await params
  const [seoData = {}, regularFontData, boldFontData] = await Promise.all([
    getPageSeo(slug, isEnabled),
    getRegularFont(),
    getBoldFont()
  ])

  const {
    seo: { title, ogImageTitle, ogImageSubtitle }
  } = seoData

  return new ImageResponse(
    <OpenGraphImage
      title={ogImageTitle || title}
      description={ogImageSubtitle || 'by Zen'}
      url={slug}
    />,
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
