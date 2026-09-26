/**
 * [INPUT]: 无外部依赖；消费 Contentful Rich Text JSON（nodeType / content / value / marks / data）与 links 映射
 * [OUTPUT]: 对外提供 richTextToMarkdown(content, links) —— 把 Contentful 富文本转成 Markdown 文本
 * [POS]: lib/agent 的转换层；被 markdown.js 用于把文章正文转成 agent 可读的 Markdown，与 components/contentful/rich-text.js（转 JSX）方向相反
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ---------------------------------------------------------------------------
// 内联文本与标记
// ---------------------------------------------------------------------------

// 转义会破坏 Markdown 结构的字符，保留正文可读性
function escapeText(value) {
  return String(value ?? '').replace(/([\\*_`[\]])/g, '\\$1')
}

const MARK_WRAPPERS = {
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  underline: (text) => `<u>${text}</u>`,
  code: (text) => `\`${text}\``,
  strikethrough: (text) => `~~${text}~~`,
  superscript: (text) => `<sup>${text}</sup>`,
  subscript: (text) => `<sub>${text}</sub>`
}

function applyMarks(text, marks = []) {
  return marks.reduce((acc, mark) => {
    const wrap = MARK_WRAPPERS[mark.type]
    return wrap ? wrap(acc) : acc
  }, text)
}

// ---------------------------------------------------------------------------
// 链接索引
// ---------------------------------------------------------------------------

function indexLinks(links) {
  const assets = new Map()
  const entries = new Map()

  for (const asset of links?.assets?.block ?? []) assets.set(asset.sys?.id, asset)
  for (const entry of links?.entries?.block ?? []) entries.set(entry.sys?.id, entry)

  return { assets, entries }
}

function renderEntry(entry) {
  if (!entry) return ''

  if (entry.code) return `\`\`\`\n${entry.code}\n\`\`\``
  if (entry.embedUrl) return `[${escapeText(entry.title || entry.embedUrl)}](${entry.embedUrl})`
  if (entry.id) return `[Tweet](https://x.com/i/status/${entry.id})`
  if (entry.imagesCollection?.items?.length) {
    return entry.imagesCollection.items.map((image) => `![${escapeText(image.title || '')}](${image.url})`).join('\n')
  }
  if (entry.description || entry.title) return escapeText(entry.description || entry.title)

  return ''
}

// ---------------------------------------------------------------------------
// 块级节点
// ---------------------------------------------------------------------------

function renderChildren(node, context) {
  return (node.content ?? []).map((child) => renderNode(child, context)).join('')
}

function inlineText(node, context) {
  return renderChildren(node, context).trim()
}

const BLOCK_RENDERERS = {
  document: (node, context) => renderChildren(node, context),

  paragraph: (node, context) => `${inlineText(node, context)}\n\n`,

  'heading-1': (node, context) => `# ${inlineText(node, context)}\n\n`,
  'heading-2': (node, context) => `## ${inlineText(node, context)}\n\n`,
  'heading-3': (node, context) => `### ${inlineText(node, context)}\n\n`,
  'heading-4': (node, context) => `#### ${inlineText(node, context)}\n\n`,
  'heading-5': (node, context) => `##### ${inlineText(node, context)}\n\n`,
  'heading-6': (node, context) => `###### ${inlineText(node, context)}\n\n`,

  'unordered-list': (node, context) =>
    `${(node.content ?? []).map((item) => `- ${inlineText(item, context)}`).join('\n')}\n\n`,

  'ordered-list': (node, context) =>
    `${(node.content ?? []).map((item, index) => `${index + 1}. ${inlineText(item, context)}`).join('\n')}\n\n`,

  'list-item': (node, context) => inlineText(node, context),

  blockquote: (node, context) =>
    `${inlineText(node, context)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}\n\n`,

  hr: () => '---\n\n',

  code: (node) => `\`\`\`\n${renderChildren(node, {})}\n\`\`\`\n\n`,

  text: (node) => applyMarks(escapeText(node.value), node.marks),

  hyperlink: (node, context) => `[${inlineText(node, context)}](${node.data?.uri ?? ''})`,

  'entry-hyperlink': (node, context) => {
    const entry = context.entries.get(node.data?.target?.sys?.id)
    const label = inlineText(node, context) || escapeText(entry?.title || '')
    return entry?.slug ? `[${label}](${entry.slug})` : label
  },

  'asset-hyperlink': (node, context) => {
    const asset = context.assets.get(node.data?.target?.sys?.id)
    const label = inlineText(node, context) || escapeText(asset?.title || '')
    return asset?.url ? `[${label}](${asset.url})` : label
  },

  'embedded-asset-block': (node, context) => {
    const asset = context.assets.get(node.data?.target?.sys?.id)
    if (!asset?.url) return ''
    return `![${escapeText(asset.title || asset.description || '')}](${asset.url})\n\n`
  },

  'embedded-entry-block': (node, context) => {
    const rendered = renderEntry(context.entries.get(node.data?.target?.sys?.id))
    return rendered ? `${rendered}\n\n` : ''
  },

  'embedded-entry-inline': (node, context) => renderEntry(context.entries.get(node.data?.target?.sys?.id))
}

// 未知节点类型：递归渲染子节点，保证内容不丢失
function renderNode(node, context) {
  if (!node) return ''
  const renderer = BLOCK_RENDERERS[node.nodeType]
  return renderer ? renderer(node, context) : renderChildren(node, context)
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

export function richTextToMarkdown(content, links) {
  if (!content || !Array.isArray(content.content)) return ''

  const context = indexLinks(links)

  return content.content
    .map((node) => renderNode(node, context))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
