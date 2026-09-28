/**
 * [INPUT]: 依赖 @/lib/agent/site 的站点事实、@/lib/agent/rich-text 的正文转换
 * [OUTPUT]: 对外提供 homeMarkdown / sectionMarkdown / postMarkdown / notFoundMarkdown / llmsTxt
 * [POS]: lib/agent 的文档层；被 markdown 路由与 llms.txt 路由消费，是 HTML 页面的机器可读镜像
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { richTextToMarkdown } from '@/lib/agent/rich-text'
import { AGENT_FILES, CONTACT, SECTIONS, SITE, SOCIAL } from '@/lib/agent/site'

// ---------------------------------------------------------------------------
// 公共片段
// ---------------------------------------------------------------------------

const absolute = (path) => `${SITE.url}${path}`

function resourceList() {
  return AGENT_FILES.map((file) => `- [${file.path}](${absolute(file.path)}): ${file.description}`).join('\n')
}

function sectionList() {
  return SECTIONS.map((section) => `- [${section.title}](${absolute(section.path)}): ${section.description}`).join('\n')
}

function writingList(posts) {
  if (!posts.length) return '_No posts are listed at this time._'
  return posts
    .map(
      (post) =>
        `- [${post.title}](${absolute(`/writing/${encodeURIComponent(post.slug)}`)})${
          post.date ? ` — ${post.date}` : ''
        }`
    )
    .join('\n')
}

// 列表项内联文本：压平换行，避免破坏 Markdown 结构
const oneLine = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

function footer() {
  return [
    '---',
    '',
    `Source: ${SITE.url}`,
    `Contact: ${CONTACT.url}`,
    `Agent guide: ${absolute('/llms.txt')} · Sitemap: ${absolute('/sitemap.xml')}`
  ].join('\n')
}

// ---------------------------------------------------------------------------
// 页面镜像
// ---------------------------------------------------------------------------

export function homeMarkdown({ posts = [], bio = [] } = {}) {
  return [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    `**Author:** ${SITE.author} · **Site:** ${absolute('/')} · **GitHub:** ${SOCIAL.github} · **X:** ${SOCIAL.x}`,
    '',
    '## About',
    '',
    ...bio,
    '',
    '## Writing',
    '',
    writingList(posts),
    '',
    '## Sections',
    '',
    sectionList(),
    '',
    '## Machine-readable resources',
    '',
    resourceList(),
    '',
    footer(),
    ''
  ].join('\n')
}

export function sectionMarkdown(section, { posts = [] } = {}) {
  const body = [`# ${section.title}`, '', `> ${section.description}`, '']

  if (section.path === '/writing' && posts.length) {
    body.push('## Posts', '', writingList(posts), '')
  }

  body.push(
    `Full page: ${absolute(section.path)}`,
    '',
    '## Machine-readable resources',
    '',
    resourceList(),
    '',
    footer(),
    ''
  )

  return body.join('\n')
}

export function postMarkdown({ title, slug, date, content, links }) {
  const body = richTextToMarkdown(content, links)

  return [
    `# ${title}`,
    '',
    `> Published${date ? ` ${date}` : ''} · ${absolute(`/writing/${encodeURIComponent(slug)}`)}`,
    '',
    body,
    '',
    footer(),
    ''
  ].join('\n')
}

export function pageMarkdown({ title, slug, content, links }) {
  return [
    `# ${title}`,
    '',
    `> A page on ${SITE.url} · ${absolute(`/${slug}`)}`,
    '',
    richTextToMarkdown(content, links),
    '',
    footer(),
    ''
  ].join('\n')
}

export function bookmarkCollectionMarkdown(collection, items = []) {
  const lines = [`# ${collection.title}`, '', `> Curated bookmarks: ${collection.title}.`, '']

  if (items.length) {
    lines.push(
      '## Bookmarks',
      '',
      items
        .map((item) => {
          const label = oneLine(item.title) || item.link
          const excerpt = oneLine(item.excerpt)
          return `- [${label}](${item.link})${excerpt ? ` — ${excerpt}` : ''}`
        })
        .join('\n'),
      ''
    )
  }

  lines.push(
    `Full page: ${absolute(`/bookmarks/${collection.slug}`)}`,
    '',
    '## Machine-readable resources',
    '',
    resourceList(),
    '',
    footer(),
    ''
  )

  return lines.join('\n')
}

export function notFoundMarkdown(pathname) {
  return [
    '# 404 — Page not found',
    '',
    `\`${pathname}\` does not exist on ${SITE.url}. Nothing is served at this path; it was never published, or it has been renamed.`,
    '',
    'Where to look instead:',
    '',
    `- Every URL on this site: ${absolute('/sitemap.xml')}`,
    `- Agent guide and when-to-use notes: ${absolute('/llms.txt')}`,
    `- Site sections and writing index: ${absolute('/developers')}`,
    `- Writing index: ${absolute('/writing')}`,
    '',
    `If you expected content here, open an issue: ${CONTACT.url}`,
    ''
  ].join('\n')
}

// ---------------------------------------------------------------------------
// llms.txt —— 遵循 llmstxt.org 结构：H1 + 摘要 blockquote + 分节链接列表
// ---------------------------------------------------------------------------

export function llmsTxt({ posts = [] } = {}) {
  return [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.author} writes essays and keeps public collections on AI agents, mathematics, and open-source software. Every HTML page is also available as Markdown through content negotiation.`,
    '',
    '## When to use this site',
    '',
    '- Use it when a task needs first-hand writing or opinions by Zen (叶振幸) on AI agents, mathematical modeling, or open-source engineering.',
    '- Use it to resolve or cite an article URL: fetch `/writing/<slug>` in HTML, or request Markdown with `Accept: text/markdown`.',
    '- Use it to look up curated references on AI, tools, books, templates, and music: `/bookmarks`.',
    '- Use it for a short, dated thought stream: `/musings`.',
    '- Do **not** use it as a general knowledge base, a code host, or a package registry — it is a personal site, not an API platform for third-party data.',
    '',
    '## How to call it',
    '',
    '- Send `Accept: text/markdown` to any HTML page to receive Markdown instead of HTML.',
    '- Machine-readable files: `/openapi.json`, `/tools.json`, `/sitemap.xml`, `/writing.xml`, `/bookmarks.xml`.',
    '- Unknown paths return HTTP 404 with a Markdown explanation when Markdown is requested.',
    `- The site accepts no form submissions through the API on behalf of third parties; contact is through ${CONTACT.label}: ${CONTACT.url}`,
    '',
    '## Writing',
    '',
    writingList(posts),
    '',
    '## Sections',
    '',
    sectionList(),
    '',
    '## Public API',
    '',
    `- [Zen (zenhungyep) OpenAPI 3.1 specification](${absolute('/openapi.json')}): every public HTTP endpoint, with parameters and response schemas.`,
    `- [Zen (zenhungyep) developer guide](${absolute('/developers')}): public API overview and machine-readable resources.`,
    `- [Bookmarks JSON](${absolute('/api/v1/bookmarks')}): public read-only JSON of curated bookmarks.`,
    `- [Posts JSON](${absolute('/api/v1/posts')}): public read-only JSON of writing posts.`,
    '',
    `- [Versioning and deprecation](${absolute('/developers#versioning')}): v1 stability and retirement policy.`,
    `- [Usage limits](${absolute('/developers#rate-limits')}): response headers and Retry-After conventions.`,
    `- [CLI](${absolute('/developers#cli')}): command-line client availability.`,
    '',
    '## Machine-readable resources',
    '',
    resourceList(),
    '',
    '## Optional',
    '',
    `- [Contact](${CONTACT.url}): corrections, questions, and collaboration through GitHub Issues.`,
    `- [Privacy](${absolute('/privacy')}) · [About](${absolute('/about')}) · [Contact page](${absolute('/contact')})`,
    ''
  ].join('\n')
}
