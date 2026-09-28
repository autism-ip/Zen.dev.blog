import { expect, it } from 'vitest'

import { buildJsonLd } from '@/lib/agent/json-ld'
import { homeMarkdown, llmsTxt } from '@/lib/agent/markdown'
import { HOME_BIO, SITE } from '@/lib/agent/site'

it('uses the distinctive existing site title as its primary name across discovery surfaces', () => {
  expect(SITE.name).toBe('Zen (zenhungyep)')
  const website = buildJsonLd()['@graph'].find((node) => node['@type'] === 'WebSite')
  expect(website.name).toBe(SITE.name)
  expect(website.alternateName).toContain('Zen')
  expect(llmsTxt()).toContain('/tools.json')
})

it('keeps meaningful personal biography in the shared homepage content without restoring the removed section', () => {
  expect(HOME_BIO.join(' ').length).toBeGreaterThanOrEqual(600)
  expect(HOME_BIO).toHaveLength(5)
  expect(HOME_BIO.join(' ')).toContain(SITE.displayName)
  const markdown = homeMarkdown({ bio: HOME_BIO })
  for (const line of HOME_BIO) expect(markdown).toContain(line)
  expect(markdown).not.toContain('About this site')
})
