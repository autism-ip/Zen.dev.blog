import '@/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import classix from 'classix'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { EyeIcon } from 'lucide-react'
import localFont from 'next/font/local'
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
import { safeJsonLd } from '@/lib/seo'

const notoSerifSC = localFont({
  src: [
    { path: '../../public/fonts/noto-serif-sc-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/noto-serif-sc-700.woff2', weight: '700', style: 'normal' }
  ],
  display: 'swap',
  preload: false,
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
      <head>
        <noscript>
          <style>{'[data-page-transition] { opacity: 1 !important; transform: none !important; }'}</style>
        </noscript>
      </head>
      <body suppressHydrationWarning>
        {/* 站点级结构化数据：Person + WebSite，供 AI agent 解析身份与联系渠道 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(buildJsonLd()) }} />
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

const siteMetadata = {
  metadataBase: new URL(SITE.url),
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
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: sharedMetadata.ogImage.width,
        height: sharedMetadata.ogImage.height,
        alt: sharedMetadata.title
      }
    ]
  },
  icons: { icon: [{ url: '/icon', type: 'image/png', sizes: '96x96' }] },
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

export async function generateMetadata() {
  const { isEnabled } = await draftMode()
  return { ...siteMetadata, ...(isEnabled && { robots: { index: false, follow: false } }) }
}
