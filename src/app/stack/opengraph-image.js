import { ImageResponse } from 'next/og'

import { OpenGraphImage } from '@/components/og-image'
import { getBoldFont, getRegularFont } from '@/lib/fonts'

export const alt = 'Stack — Tools used by Zen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [regular, bold] = await Promise.all([getRegularFont(), getBoldFont()])
  return new ImageResponse(<OpenGraphImage title="Stack" description="Tools used by Zen" url="stack" />, {
    ...size,
    fonts: [
      { name: 'Geist Sans', data: regular, style: 'normal', weight: 400 },
      { name: 'Geist Sans', data: bold, style: 'normal', weight: 500 }
    ]
  })
}
