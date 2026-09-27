import { SITE } from '@/lib/agent/site'

export default function robots() {
  // Keep errors/admin crawlable so crawlers can see 404 and noindex responses.
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE.url}/sitemap.xml`, host: SITE.url }
}
