import '@/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import classix from 'classix'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { EyeIcon } from 'lucide-react'
import { Noto_Serif_SC as NotoSerifSC } from 'next/font/google'
import { draftMode } from 'next/headers'
import Script from 'next/script'
import { Suspense } from 'react'

import { sharedMetadata } from '@/app/shared-metadata'
import { MenuContent } from '@/components/menu-content'
import { DialogStateProvider } from '@/components/quick-post-button'
import { SideMenu } from '@/components/side-menu'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Toaster } from '@/components/ui/sonner'
import { buildJsonLd } from '@/lib/agent/json-ld'
import { SITE } from '@/lib/agent/site'
import { PROFILES } from '@/lib/constants'
import { preloadGetAllPosts } from '@/lib/contentful'

const notoSerifSC = NotoSerifSC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif-sc'
})

export const fetchCache = 'default-cache'

export default async function RootLayout({ children }) {
  const { isEnabled } = await draftMode()
  preloadGetAllPosts(isEnabled)

  return (
    <html
      lang="en"
      data-theme="light"
      className={classix(GeistSans.variable, GeistMono.variable, notoSerifSC.variable)}
      suppressHydrationWarning
    >
      <head />
      <body suppressHydrationWarning>
        {/* 站点级结构化数据：Organization + Person + WebSite，供 AI agent 解析身份与联系渠道 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }} />
        <ErrorBoundary>
          <DialogStateProvider>
            {}
            <main vaul-drawer-wrapper="" className="min-h-screen bg-white">
              {isEnabled && (
                <div className="absolute inset-x-0 bottom-0 z-50 flex h-12 w-full items-center justify-center bg-green-500 text-center text-sm font-medium text-white">
                  <div className="flex items-center gap-2">
                    <EyeIcon size={16} />
                    <span>Draft mode is enabled</span>
                  </div>
                </div>
              )}
              <div className="lg:flex">
                <SideMenu className="relative hidden lg:flex">
                  <MenuContent />
                </SideMenu>
                <div className="flex flex-1">{children}</div>
              </div>
            </main>
            <Toaster />
            <TailwindIndicator />
          </DialogStateProvider>
        </ErrorBoundary>
        {/* Vercel analytics 内部调用 useSearchParams()（无 Suspense 包裹）会触发静态预渲染
            BAILOUT_TO_CLIENT_SIDE_RENDERING，把整棵应用树推到客户端。
            显式 Suspense 边界把 bailout 限制在这两个埋点自身的子树内，保证页面内容 SSR 可爬取。 */}
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
        <Script
          src="https://unpkg.com/@tinybirdco/flock.js"
          data-host={process.env.NEXT_PUBLIC_TINYBIRD_TRACKER_HOST}
          data-token={process.env.NEXT_PUBLIC_TINYBIRD_TOKEN}
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}

export const metadata = {
  metadataBase: new URL(SITE.url),
  robots: {
    index: true,
    follow: true
  },
  title: {
    default: sharedMetadata.title,
    template: `%s — ${sharedMetadata.title}`
  },
  description: sharedMetadata.description,
  keywords: ['Zen', 'zenhungyep.com'],
  openGraph: {
    title: {
      default: sharedMetadata.title,
      template: `%s — ${sharedMetadata.title}`
    },
    description: sharedMetadata.description,
    alt: sharedMetadata.title,
    type: 'website',
    url: SITE.url,
    siteName: sharedMetadata.title,
    locale: 'en_IE',
    images: [
      {
        url: '/opengraph-image',
        width: sharedMetadata.ogImage.width,
        height: sharedMetadata.ogImage.height,
        alt: sharedMetadata.title
      }
    ]
  },
  alternates: {
    canonical: '/'
  },
  twitter: {
    card: 'summary_large_image',
    site: `@${PROFILES.twitter.username}`,
    creator: `@${PROFILES.twitter.username}`,
    images: ['/opengraph-image']
  },
  other: {
    pinterest: 'nopin'
  }
}

export const viewport = {
  themeColor: 'white',
  colorScheme: 'only light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}
