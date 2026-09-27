import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development'
    }
  },
  trailingSlash: false,
  // Runtime image functions need font assets even when static tracing misses fs reads.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./src/assets/fonts/Geist-*.otf'],
    '/**/opengraph-image': ['./src/assets/fonts/Geist-*.otf']
  },
  // Resolve metadata/notFound before flushing HTML, including ordinary crawler UAs.
  htmlLimitedBots: /.*/,
  images: {
    deviceSizes: [390, 435, 768, 1024, 1280],
    formats: ['image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**'
      }
    ]
  },
  async redirects() {
    return [
      // www 与 apex 此前同时直接返回 200（重复主机、信号分散）。
      // 统一 308 到 apex：规范主机与 Vercel 生产域名、robots.js 的 Host、NEXT_PUBLIC_BASE_URL 一致。
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.zenhungyep.com' }],
        destination: 'https://zenhungyep.com/:path*',
        permanent: true
      },
      {
        source: '/turkiyeden-gitmek-berline-uzanan-bir-goc-hikayesi-bolum-1-nedenler',
        destination: '/writing/bir-yazilimci-olarak-turkiyeden-gitmek',
        permanent: true
      },
      {
        source: '/writing/bir-yazilimci-olarak-turkiyeden-gitmek-bolum-1-nedenler',
        destination: '/writing/bir-yazilimci-olarak-turkiyeden-gitmek',
        permanent: true
      },
      {
        source: '/what-i-have-learned-from-working-with-html5-video-over-a-month',
        destination: '/writing/what-i-have-learned-from-working-with-html5-video-over-a-month',
        permanent: true
      },
      {
        source: '/useFetch-react-hook',
        destination: '/writing/useFetch-react-hook',
        permanent: true
      },
      {
        source: '/understanding-react-memo',
        destination: '/writing/understanding-react-memo',
        permanent: true
      },
      {
        source: '/blog/:slug',
        destination: '/writing/:slug',
        permanent: true
      },
      {
        source: '/bookmarks/18259129',
        destination: '/bookmarks/apps-and-tools',
        permanent: true
      },
      {
        source: '/bookmarks/15968768',
        destination: '/bookmarks/design',
        permanent: true
      },
      {
        source: '/bookmarks/23598938',
        destination: '/bookmarks/fonts',
        permanent: true
      },
      {
        source: '/bookmarks/16949672',
        destination: '/bookmarks/frontend',
        permanent: true
      },
      {
        source: '/bookmarks/15807896',
        destination: '/bookmarks/portfolio',
        permanent: true
      },
      {
        source: '/bookmarks/15807897',
        destination: '/bookmarks/reading',
        permanent: true
      },
      {
        source: '/bookmarks/15896982',
        destination: '/bookmarks/tweets',
        permanent: true
      },
      {
        source: '/bookmarks/15969648',
        destination: '/bookmarks/vs-code',
        permanent: true
      },
      {
        source: '/bookmarks/25589709',
        destination: '/bookmarks/wallpapers',
        permanent: true
      },
      {
        source: '/bookmarks/16338467',
        destination: '/bookmarks/websites',
        permanent: true
      }
    ]
  },
  // 安全响应头应用于全部路径（不加完整 CSP，避免破坏 Next.js 内联脚本与 RSC payload）
  async headers() {
    return [
      ...['/admin/:path*', '/debug-og', '/api/:path*', '/test-musings.json'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      })),
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ]
  },
  experimental: {
    optimizePackageImports: ['framer-motion', '@supabase/supabase-js', 'react-tweet'],
    webVitalsAttribution: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ['geist'],
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src')
    return config
  }
}

// Force cache invalidation - 2025-01-07 14:20
export default nextConfig
