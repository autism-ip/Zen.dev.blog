/**
 * [INPUT]: 依赖 vitest 与 @/lib/agent 的 markdown / rich-text / posts / json-ld / site
 * [OUTPUT]: 文档层行为测试：首页与 404 的 Markdown 镜像、llms.txt 的 when-to-use、富文本转换、索引排序不可变、JSON-LD 完整性
 * [POS]: lib/agent 的文档与结构化数据测试；守护 audit 要求的关键契约（500+ 字符首页、20+ 字符 404 说明、Organization 联系与地址）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { describe, expect, it } from 'vitest'

import { buildJsonLd } from '@/lib/agent/json-ld'
import { homeMarkdown, llmsTxt, notFoundMarkdown, postMarkdown } from '@/lib/agent/markdown'
import { toIndexPosts } from '@/lib/agent/posts'
import { richTextToMarkdown } from '@/lib/agent/rich-text'
import { HOME_BIO, SECTIONS } from '@/lib/agent/site'

const POSTS = [
  { title: 'Agent 的新变革在于人类注意力的重新分配', slug: 'agent-新变革', date: '2026-05-24' },
  { title: 'Understanding React Memo', slug: 'understanding-react-memo', date: '2022-01-08' }
]

describe('homeMarkdown', () => {
  it('serves substantial content with a single H1 and the full bio', () => {
    const markdown = homeMarkdown({ posts: POSTS, bio: HOME_BIO })

    expect(markdown.startsWith('# Zen')).toBe(true)
    expect(markdown.length).toBeGreaterThan(500)
    for (const line of HOME_BIO) expect(markdown).toContain(line)
  })

  it('lists posts as absolute links and points to the machine-readable files', () => {
    const markdown = homeMarkdown({ posts: POSTS, bio: HOME_BIO })

    expect(markdown).toContain(`https://www.zenhungyep.com/writing/${encodeURIComponent('agent-新变革')}`)
    expect(markdown).toContain('https://www.zenhungyep.com/llms.txt')
    expect(markdown).toContain('https://www.zenhungyep.com/openapi.json')
    expect(markdown).toContain('https://www.zenhungyep.com/sitemap.xml')
  })

  it('stays useful when the post index is unavailable', () => {
    const markdown = homeMarkdown({ posts: [], bio: HOME_BIO })

    expect(markdown).toContain('# Zen')
    expect(markdown).toContain('## Sections')
  })
})

describe('notFoundMarkdown', () => {
  it('explains the error and points agents at the sitemap and llms.txt', () => {
    const markdown = notFoundMarkdown('/no-such-page')

    expect(markdown).toContain('404')
    expect(markdown).toContain('/no-such-page')
    expect(markdown.length).toBeGreaterThan(200)
    expect(markdown).toContain('https://www.zenhungyep.com/sitemap.xml')
    expect(markdown).toContain('https://www.zenhungyep.com/llms.txt')
  })
})

describe('llmsTxt', () => {
  it('follows the llmstxt.org shape with an explicit when-to-use section', () => {
    const text = llmsTxt({ posts: POSTS })

    expect(text.startsWith('# Zen')).toBe(true)
    expect(text).toContain('## When to use this site')
    expect(text).toContain('## How to call it')
    expect(text).toContain('Accept: text/markdown')
    expect(text).toContain('Do **not** use it')
  })

  it('lists every section with an absolute URL', () => {
    const text = llmsTxt({ posts: POSTS })

    for (const section of SECTIONS) {
      expect(text).toContain(`https://www.zenhungyep.com${section.path}`)
    }
  })
})

describe('postMarkdown', () => {
  it('renders the post body as Markdown with a source link', () => {
    const markdown = postMarkdown({
      title: 'Hello',
      slug: 'hello',
      date: '2026-01-01',
      content: {
        nodeType: 'document',
        content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Body text', marks: [] }] }]
      }
    })

    expect(markdown).toContain('# Hello')
    expect(markdown).toContain('Body text')
    expect(markdown).toContain('https://www.zenhungyep.com/writing/hello')
  })
})

describe('richTextToMarkdown', () => {
  it('converts headings, marks, links, lists and code blocks', () => {
    const markdown = richTextToMarkdown({
      nodeType: 'document',
      content: [
        { nodeType: 'heading-2', content: [{ nodeType: 'text', value: 'Title', marks: [] }] },
        {
          nodeType: 'paragraph',
          content: [
            { nodeType: 'text', value: 'bold', marks: [{ type: 'bold' }] },
            { nodeType: 'text', value: ' and ' },
            {
              nodeType: 'hyperlink',
              data: { uri: 'https://example.com' },
              content: [{ nodeType: 'text', value: 'link' }]
            }
          ]
        },
        {
          nodeType: 'unordered-list',
          content: [
            {
              nodeType: 'list-item',
              content: [{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'one' }] }]
            }
          ]
        },
        { nodeType: 'code', content: [{ nodeType: 'text', value: 'const a = 1' }] }
      ]
    })

    expect(markdown).toContain('## Title')
    expect(markdown).toContain('**bold**')
    expect(markdown).toContain('[link](https://example.com)')
    expect(markdown).toContain('- one')
    expect(markdown).toContain('```\nconst a = 1\n```')
  })

  it('resolves embedded assets through the links map and escapes markdown characters', () => {
    const markdown = richTextToMarkdown(
      {
        nodeType: 'document',
        content: [
          { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'a * b' }] },
          { nodeType: 'embedded-asset-block', data: { target: { sys: { id: 'asset-1' } } } }
        ]
      },
      { assets: { block: [{ sys: { id: 'asset-1' }, url: 'https://cdn.example.com/x.jpg', title: 'Photo' }] } }
    )

    expect(markdown).toContain('a \\* b')
    expect(markdown).toContain('![Photo](https://cdn.example.com/x.jpg)')
  })

  it('returns an empty string for missing content', () => {
    expect(richTextToMarkdown(null)).toBe('')
    expect(richTextToMarkdown({ nodeType: 'document' })).toBe('')
  })
})

describe('toIndexPosts', () => {
  it('sorts newest first without mutating the input array', () => {
    const input = [
      { title: 'Older', slug: 'older', date: '2020-01-01', sys: { firstPublishedAt: '2020-01-01' } },
      { title: 'Newer', slug: 'newer', date: '2026-01-01', sys: { firstPublishedAt: '2026-01-01' } }
    ]
    const snapshot = [...input]

    const indexed = toIndexPosts(input)

    expect(indexed.map((post) => post.slug)).toEqual(['newer', 'older'])
    expect(input).toEqual(snapshot)
    expect(indexed[0].url).toBe('https://www.zenhungyep.com/writing/newer')
  })

  it('falls back to sys.firstPublishedAt and tolerates missing dates', () => {
    const indexed = toIndexPosts([{ title: 'A', slug: 'a', sys: { firstPublishedAt: '2026-02-02' } }])

    expect(indexed[0].date).toBe('2026-02-02')
    expect(toIndexPosts([{ title: 'B', slug: 'b' }])[0].date).toBeNull()
  })
})

describe('buildJsonLd', () => {
  const graph = buildJsonLd()['@graph']
  const organization = graph.find((node) => node['@type'] === 'Organization')
  const person = graph.find((node) => node['@type'] === 'Person')
  const website = graph.find((node) => node['@type'] === 'WebSite')

  it('describes the organization with a contact point and a postal address', () => {
    expect(organization.name).toBe('Zen')
    expect(organization.contactPoint.contactType).toBeTruthy()
    expect(organization.contactPoint.url).toContain('github.com')
    expect(organization.address.addressLocality).toBe('Paris')
    expect(organization.address.addressCountry).toBe('FR')
  })

  it('describes the person and the website, cross-linked by @id', () => {
    expect(person.sameAs).toContain('https://github.com/autism-ip')
    expect(person.alternateName).toContain('叶振幸')
    expect(website.publisher['@id']).toBe(organization['@id'])
    expect(website.author['@id']).toBe(person['@id'])
  })
})
