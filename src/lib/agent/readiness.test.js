import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { buildJsonLd } from '@/lib/agent/json-ld'
import { llmsTxt } from '@/lib/agent/markdown'
import { buildOpenApi } from '@/lib/agent/openapi'
import { HOME_BIO, HOME_GUIDE, SITE } from '@/lib/agent/site'
import { getAllPageSlugs, getAllPosts } from '@/lib/contentful'
import { getBookmarks } from '@/lib/raindrop-with-auth'

vi.mock('@/lib/contentful', () => ({
  getAllPageSlugs: vi.fn().mockRejectedValue(new Error('offline')),
  getAllPosts: vi.fn().mockResolvedValue([])
}))
vi.mock('@/lib/raindrop-with-auth', () => ({ getBookmarks: vi.fn().mockResolvedValue([]) }))

function checkSchema(schema, spec, trail = []) {
  if (schema.$ref) {
    if (trail.includes(schema.$ref)) return
    return checkSchema(
      schema.$ref
        .slice(2)
        .split('/')
        .reduce((v, k) => v[k], spec),
      spec,
      [...trail, schema.$ref]
    )
  }
  expect(schema.type).toBeTruthy()
  if (schema.type === 'object') expect(schema.properties || schema.additionalProperties).toBeTruthy()
  for (const property of Object.values(schema.properties || {})) checkSchema(property, spec, trail)
  if (schema.items) checkSchema(schema.items, spec, trail)
  if (typeof schema.additionalProperties === 'object') checkSchema(schema.additionalProperties, spec, trail)
}

describe('agent discovery', () => {
  it('publishes a versioned and fully typed contract with quota and error headers', () => {
    const spec = buildOpenApi()
    expect(spec.paths['/api/v1/posts']).toBeTruthy()
    expect(spec.info.description).toContain('Deprecation')
    for (const [path, methods] of Object.entries(spec.paths))
      for (const op of Object.values(methods)) {
        for (const response of Object.values(op.responses))
          for (const media of Object.values(response.content || {})) checkSchema(media.schema, spec)
        if (path.startsWith('/api/')) {
          expect(op.responses[429].headers['Retry-After']).toBeTruthy()
          expect(op.responses[200].headers.RateLimit).toBeTruthy()
        }
      }
  })
  it('uses a distinctive identity in metadata and resources', () => {
    expect(SITE.title).toContain('zenhungyep')
    expect(buildJsonLd()['@graph'].find((n) => n['@type'] === 'WebSite').alternateName).toContain('zenhungyep')
    expect(llmsTxt()).toContain('/api/v1/posts')
    expect(llmsTxt()).toContain('/developers#versioning')
    expect(llmsTxt()).toContain('/developers#cli')
  })
  it('provides meaningful homepage prose independently of upstream posts', () => {
    expect([...HOME_BIO, ...HOME_GUIDE].join(' ').length).toBeGreaterThan(1200)
    expect(readFileSync('src/app/page.js', 'utf8')).toContain('HOME_GUIDE')
    expect(readFileSync('src/app/layout.js', 'utf8')).toContain('[data-page-transition]')
    expect(readFileSync('src/app/template.tsx', 'utf8')).toContain('data-page-transition')
  })
  it('uses the configured canonical origin for every sitemap entry', async () => {
    const original = SITE.url
    SITE.url = 'https://custom.example'
    getAllPosts.mockResolvedValueOnce([{ slug: 'hello world', date: '2026-01-01', sys: { publishedAt: '2026-01-01' } }])
    getAllPageSlugs.mockResolvedValueOnce([{ slug: 'test-page', sys: { publishedAt: '2026-01-01' } }])
    getBookmarks.mockResolvedValueOnce([{ slug: 'test-list' }])
    try {
      const { default: sitemap } = await import('@/app/sitemap')
      const entries = await sitemap()
      expect(entries.every((entry) => new URL(entry.url).origin === SITE.url)).toBe(true)
      for (const path of ['/writing/hello%20world', '/test-page', '/bookmarks/test-list'])
        expect(entries.map((entry) => entry.url)).toContain(`${SITE.url}${path}`)
    } finally {
      SITE.url = original
    }
  })
  it('excludes private and unroutable CMS pages and does not invent lastmod', async () => {
    getAllPageSlugs.mockResolvedValueOnce([
      { slug: 'admin' },
      { slug: 'debug-og' },
      { slug: 'not-implemented', hasCustomPage: true },
      { slug: null }
    ])
    getAllPosts.mockResolvedValueOnce([{ slug: 'valid', sys: { publishedAt: 'invalid' } }, { slug: '' }, null])
    getBookmarks.mockResolvedValueOnce([{ slug: 'tools' }])
    const { default: sitemap } = await import('@/app/sitemap')
    const entries = await sitemap()
    for (const path of ['/admin', '/debug-og', '/not-implemented'])
      expect(entries.some((entry) => entry.url.endsWith(path))).toBe(false)
    expect(entries.find((entry) => entry.url.endsWith('/writing/valid')).lastModified).toBeUndefined()
    expect(entries.find((entry) => entry.url.endsWith('/bookmarks/tools')).lastModified).toBeUndefined()
  })
  it('keeps developer resources in the sitemap even when the CMS is unavailable', async () => {
    const { default: sitemap } = await import('@/app/sitemap')
    const urls = (await sitemap()).map((item) => item.url)
    for (const path of ['/developers', '/about', '/contact', '/privacy']) expect(urls).toContain(`${SITE.url}${path}`)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
