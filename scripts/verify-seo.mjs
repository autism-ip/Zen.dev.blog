/** Crawl production HTML without executing JS. Usage: node scripts/verify-seo.mjs http://localhost:3000 */
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const base = process.argv[2] || 'http://localhost:3000'
const canonicalOrigin = 'https://zenhungyep.com'
const reports = []
const failures = []
const assets = new Set()
const internalLinks = new Set()
async function get(path) {
  return fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(60000) })
}
function check(condition, message) {
  if (!condition) failures.push(message)
}
const sitemapResponse = await get('/sitemap.xml')
assert.equal(sitemapResponse.status, 200)
const xml = new JSDOM(await sitemapResponse.text(), { contentType: 'text/xml' }).window.document
const urls = [...xml.querySelectorAll('loc')].map((node) => node.textContent)
check(new Set(urls).size === urls.length, 'Duplicate sitemap URLs')
for (const path of ['', '/about', '/contact', '/privacy', '/developers', '/musings', '/writing', '/bookmarks'])
  check(urls.includes(`${canonicalOrigin}${path}`), `Sitemap missing ${path || '/'}`)
for (const url of urls) {
  check(new URL(url).origin === canonicalOrigin, `Wrong sitemap origin ${url}`)
  const path = new URL(url).pathname
  const response = await get(path)
  const html = await response.text()
  const doc = new JSDOM(html).window.document
  const canonical = doc.querySelector('link[rel="canonical"]')?.href
  const description = doc.querySelector('meta[name="description"]')?.content
  const robots = [...doc.querySelectorAll('meta[name="robots"]')].map((n) => n.content).join(',')
  const h1 = [...doc.querySelectorAll('h1')].map((n) => n.textContent)
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')]
  const schema = scripts.flatMap((script) => {
    try { const value = JSON.parse(script.textContent); return value['@graph'] || [value] }
    catch { failures.push(`Invalid JSON-LD on ${path}`); return [] }
  })
  const content = doc.querySelector('main')?.cloneNode(true)
  content?.querySelectorAll('script,style,nav,aside').forEach((n) => n.remove())
  const text = content?.textContent?.trim() || ''
  check(response.status === 200, `${path}: HTTP ${response.status}`)
  check(doc.title.length > 0 && doc.title.includes('Zen'), `${path}: missing branded title`)
  check(Boolean(description), `${path}: missing description`)
  check(canonical && new URL(canonical).href === new URL(url).href, `${path}: canonical ${canonical}, expected ${url}`)
  check(!robots.includes('noindex') && !response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: noindex`)
  check(h1.length === 1, `${path}: expected one H1, found ${h1.length}`)
  check(text.length > 40, `${path}: no meaningful SSR content`)
  check(!/Application error:|Oops! Something went wrong/.test(html), `${path}: runtime error or CSR bailout`)
  check(schema.some((node) => node['@type'] === 'WebSite'), `${path}: no WebSite schema`)
  check(schema.some((node) => node['@type'] === 'Person'), `${path}: no Person schema`)
  if (path === '/about') check(schema.some((node) => node['@type'] === 'ProfilePage' && node.mainEntity?.['@id']), 'Missing ProfilePage')
  if (path.startsWith('/writing/')) {
    const article = schema.find((node) => node['@type'] === 'BlogPosting')
    check(article?.headline && article?.author?.url, `${path}: incomplete article schema`)
    check(schema.some((node) => node['@type'] === 'BreadcrumbList' && node.itemListElement.length >= 2), `${path}: no breadcrumbs`)
  }
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) check(doc.querySelector(`meta[property="${property}"]`)?.content, `${path}: missing ${property}`)
  check(new URL(doc.querySelector('meta[property="og:url"]')?.content || '/', canonicalOrigin).href === new URL(canonical || '/', canonicalOrigin).href, `${path}: OG URL differs from canonical`)
  for (const name of ['twitter:title', 'twitter:description', 'twitter:card', 'twitter:image']) check(doc.querySelector(`meta[name="${name}"]`)?.content, `${path}: missing ${name}`)
  for (const node of doc.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]')) assets.add(new URL(node.content, canonicalOrigin).pathname)
  for (const node of doc.querySelectorAll('a[href]')) {
    const target = new URL(node.getAttribute('href'), url)
    if (target.origin === canonicalOrigin && !target.pathname.startsWith('/api/')) internalLinks.add(target.pathname)
  }
  reports.push({path,status:response.status,title:doc.title,canonical,description,h1,ssrCharacters:text.length,schema:schema.map((node)=>node['@type'])})
}
const robots = await (await get('/robots.txt')).text()
check(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`), 'Invalid robots sitemap')
for (const path of ['/seo-missing-page-2026', '/writing/seo-missing-post-2026', '/bookmarks/seo-missing-collection-2026', '/debug-og']) {
  const response = await get(path)
  const html = await response.text()
  check(response.status === 404, `${path}: expected real 404, got ${response.status}`)
  check(/noindex/.test(html) || response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: missing noindex`)
  reports.push({path,status:response.status})
}
const admin = await get('/admin/raindrop-setup')
check(admin.headers.get('x-robots-tag')?.includes('noindex'), 'Admin missing noindex header')
const icon = await get('/icon')
check(icon.status === 200 && icon.headers.get('content-type')?.startsWith('image/'), 'Invalid favicon')
for (const path of assets) {
  const response = await get(path)
  check(response.status === 200 && response.headers.get('content-type')?.startsWith('image/'), `Broken social image ${path}: ${response.status}`)
}
for (const path of internalLinks) {
  if (urls.some((url) => new URL(url).pathname === path)) continue
  const response = await get(path)
  check(response.status < 400, `Broken internal link ${path}: ${response.status}`)
}
const output = {base,checkedAt:new Date().toISOString(),pages:reports,images:[...assets],internalLinks:internalLinks.size,failures}
if (process.env.SEO_REPORT) await writeFile(process.env.SEO_REPORT,JSON.stringify(output,null,2)+'\n')
console.log(JSON.stringify(output,null,2))
process.exitCode = failures.length ? 1 : 0
