import { describe, expect, it } from 'vitest'

import { contentDescription, decodeRouteSlug, pageMetadata, safeJsonLd, validDate, validSlug } from '@/lib/seo'

describe('SEO contracts', () => {
  it('gives every section its own canonical and matching social metadata without CMS', () => {
    const meta = pageMetadata('/musings')
    expect(meta.alternates.canonical).toBe('/musings')
    expect(meta.title).toBe('Musings')
    expect(meta.description).toBeTruthy()
    expect(meta.openGraph.url).toBe('/musings')
    expect(meta.twitter.title).toBe(meta.openGraph.title)
    expect(meta.openGraph.images[0].url).toBe('/opengraph-image')
  })
  it('preserves editorial metadata and safely serializes untrusted CMS JSON-LD', () => {
    expect(pageMetadata('/writing/hello', { title: 'Hello', description: 'An essay' }).title).toBe('Hello')
    const value = { headline: '</script><script>alert(1)</script>' }
    expect(safeJsonLd(value)).not.toContain('<')
    expect(JSON.parse(safeJsonLd(value))).toEqual(value)
  })
  it('omits invalid dates instead of throwing or inventing modification times', () => {
    for (const value of [undefined, null, '', 'not-a-date']) expect(validDate(value)).toBeUndefined()
    expect(validDate('2026-09-27')).toBe('2026-09-27T00:00:00.000Z')
  })
  it('accepts Unicode slugs but rejects missing or ambiguous path segments', () => {
    expect(validSlug('Agent 的新变革')).toBe(true)
    for (const slug of [null, '', '.', '..', 'a/b', 'a?b', 'a#b']) expect(validSlug(slug)).toBe(false)
  })
})

it('decodes Next prerendered Unicode slugs once without throwing on malformed input', () => {
  expect(decodeRouteSlug(encodeURIComponent('Agent 的新变革'))).toBe('Agent 的新变革')
  expect(decodeRouteSlug('invalid%')).toBeNull()
  expect(decodeRouteSlug('100%25')).toBe('100%')
})

it('derives a real article snippet from the first paragraph when SEO is absent', () => {
  expect(
    contentDescription(
      {
        json: {
          content: [
            { nodeType: 'paragraph', content: [{ nodeType: 'text', value: '' }] },
            { nodeType: 'heading-1', content: [{ nodeType: 'text', value: 'Heading' }] },
            {
              nodeType: 'paragraph',
              content: [
                { nodeType: 'text', value: 'A useful ' },
                { nodeType: 'hyperlink', content: [{ nodeType: 'text', value: 'article summary.' }] }
              ]
            }
          ]
        }
      },
      'Fallback'
    )
  ).toBe('A useful article summary.')
  expect(contentDescription(null, 'Fallback')).toBe('Fallback')
})

it('matches the live CMS heading-6 paragraphs used by the article renderer', () => {
  expect(
    contentDescription(
      {
        json: {
          content: [{ nodeType: 'heading-6', content: [{ nodeType: 'text', value: 'Actual opening paragraph.' }] }]
        }
      },
      'Fallback'
    )
  ).toBe('Actual opening paragraph.')
})

it('advertises page-specific sharing images and retains the root image for plain sections', () => {
  for (const path of [
    '/visual',
    '/stack',
    '/workspace',
    '/journey',
    '/writing',
    '/bookmarks',
    '/writing/hello',
    '/bookmarks/ai'
  ]) {
    const meta = pageMetadata(path)
    expect(meta.openGraph.images[0].url).toBe(`${path}/opengraph-image`)
    expect(meta.twitter.images[0]).toBe(`${path}/opengraph-image`)
  }
  expect(pageMetadata('/about').openGraph.images[0].url).toBe('/opengraph-image')
  expect(pageMetadata('/custom', { image: '/custom/opengraph-image' }).twitter.images[0]).toBe(
    '/custom/opengraph-image'
  )
})
