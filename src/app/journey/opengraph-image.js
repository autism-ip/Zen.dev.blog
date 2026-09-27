import { ImageResponse } from 'next/og'

import { sharedMetadata } from '@/app/shared-metadata'
import { OpenGraphImage } from '@/components/og-image'
import { SECTION_BY_PATH } from '@/lib/agent/site'
import { getOptionalPageSeo } from '@/lib/contentful'
import { getBoldFont, getRegularFont } from '@/lib/fonts'

export const alt = 'Journey'
export const size = {
  width: sharedMetadata.ogImage.width,
  height: sharedMetadata.ogImage.height
}
export const contentType = sharedMetadata.ogImage.type

export default async function Image() {
  const [seoData = {}, regularFontData, boldFontData] = await Promise.all([
    getOptionalPageSeo('journey'),
    getRegularFont(),
    getBoldFont()
  ])

  // Safely extract seo data with proper fallbacks
  const seo = seoData?.seo || {}
  const { title, description, ogImageTitle, ogImageSubtitle } = seo

  return new ImageResponse(
    (
      <OpenGraphImage
        title={ogImageTitle || title || SECTION_BY_PATH['/journey'].title}
        description={ogImageSubtitle || description || SECTION_BY_PATH['/journey'].description}
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
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        }
        url="journey"
      />
    ),
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
