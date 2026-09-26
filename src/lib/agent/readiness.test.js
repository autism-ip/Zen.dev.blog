import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { buildJsonLd } from '@/lib/agent/json-ld'
import { llmsTxt } from '@/lib/agent/markdown'
import { buildOpenApi } from '@/lib/agent/openapi'
import { HOME_BIO, HOME_GUIDE, SITE } from '@/lib/agent/site'

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
  it('keeps developer resources in the sitemap even when the CMS is unavailable', async () => {
    const { default: sitemap } = await import('@/app/sitemap')
    const urls = (await sitemap()).map((item) => item.url)
    for (const path of ['/developers', '/about', '/contact', '/privacy']) expect(urls).toContain(`${SITE.url}${path}`)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
