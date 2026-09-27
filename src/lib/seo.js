/**
 * [INPUT]: Canonical site identity, section registry and optional editorial metadata
 * [OUTPUT]: Page metadata, safe JSON-LD, validated dates and slugs
 * [POS]: Shared SEO contracts for pages, structured data and the sitemap
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SECTION_BY_PATH, SITE } from '@/lib/agent/site'

export function pageMetadata(path, values = {}) {
  const section = SECTION_BY_PATH[path]
  const title = values.title?.trim() || section?.title || SITE.title
  const description = values.description?.trim() || section?.description || SITE.description
  const image = values.image || '/opengraph-image'
  const socialTitle = path === '/' ? title : `${title} — ${SITE.title}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE.name,
      locale: 'en_US',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: title }]
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description, images: [image] }
  }
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function validDate(value) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function validSlug(value) {
  return typeof value === 'string' && value.trim().length > 0 && !/[/?#\\]/.test(value) && !['.', '..'].includes(value)
}

export function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: new URL(path, SITE.url).href
    }))
  }
}

// Next 15's prerendered dynamic params can contain percent-encoded segments.
export function decodeRouteSlug(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}
