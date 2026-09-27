import { ImageResponse } from 'next/og'

import { sharedMetadata } from '@/app/shared-metadata'
import { OpenGraphImage } from '@/components/og-image'
import { SECTION_BY_PATH } from '@/lib/agent/site'
import { getOptionalPageSeo } from '@/lib/contentful'
import { getBoldFont, getRegularFont } from '@/lib/fonts'

export const alt = 'Workspace'
export const size = {
  width: sharedMetadata.ogImage.width,
  height: sharedMetadata.ogImage.height
}
export const contentType = sharedMetadata.ogImage.type

export default async function Image() {
  const [seoData = {}, regularFontData, boldFontData] = await Promise.all([
    getOptionalPageSeo('workspace'),
    getRegularFont(),
    getBoldFont()
  ])

  // Safely extract seo data with proper fallbacks
  const seo = seoData?.seo || {}
  const { title, description, ogImageTitle, ogImageSubtitle } = seo

  return new ImageResponse(
    (
      <OpenGraphImage
        title={ogImageTitle || title || SECTION_BY_PATH['/workspace'].title}
        description={ogImageSubtitle || description || SECTION_BY_PATH['/workspace'].description}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="84"
            height="84"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
            <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
            <path d="M5 18v2" />
            <path d="M19 18v2" />
          </svg>
        }
        url="workspace"
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
