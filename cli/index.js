#!/usr/bin/env node
/**
 * [INPUT]: 无外部依赖；使用 Node 18+ 内置 fetch，调用 zenhungyep.com 的公开端点（含 Accept: text/markdown 协商）
 * [OUTPUT]: 可执行 CLI —— posts / post / bookmarks / markdown / openapi / llms 子命令，--base 可切换部署
 * [POS]: cli 包的唯一入口；把 /openapi.json 描述的公开 API 封装为脚本化命令，供开发者与 agent 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const DEFAULT_BASE = 'https://zenhungyep.com'

// CLI 的产物就是 stdout：用 process.stdout.write 而非 console.log（仓库 no-console 规则）
const print = (text) => process.stdout.write(`${text}\n`)

const USAGE = `zenhungyep — read zenhungyep.com from the command line

Usage
  zenhungyep <command> [options]

Commands
  posts                     List writing posts (use --json for raw JSON)
  post <slug>               Print one post as Markdown
  bookmarks                 List curated bookmarks (use --json for raw JSON)
  markdown <path>           Print any page as Markdown (e.g. markdown /writing)
  openapi                   Print the OpenAPI 3.1 specification
  llms                      Print the agent guide (llms.txt)
  help                      Show this message

Options
  --base <url>              Target a different deployment (default ${DEFAULT_BASE})
  --json                    Emit raw JSON instead of a formatted list
  -h, --help                Show this message

Examples
  zenhungyep posts
  zenhungyep post what-i-have-learned-from-working-with-html5-video-over-a-month
  zenhungyep markdown /about
  zenhungyep openapi > openapi.json
`

function parseArgs(argv) {
  const options = { base: DEFAULT_BASE, json: false, command: null, args: [] }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--base') {
      options.base = String(argv[index + 1] ?? '').replace(/\/$/, '')
      index += 1
    } else if (token === '--json') {
      options.json = true
    } else if (token === '-h' || token === '--help') {
      options.command = 'help'
    } else if (!options.command) {
      options.command = token
    } else {
      options.args.push(token)
    }
  }

  return options
}

async function request(options, path, { accept } = {}) {
  const response = await fetch(`${options.base}${path}`, {
    headers: accept ? { Accept: accept } : {}
  })

  const body = await response.text()

  if (!response.ok) {
    let message = body
    try {
      message = JSON.parse(body)?.error ?? body
    } catch {
      // 非 JSON 错误体（如网关页面）直接使用原文
    }
    throw new Error(`GET ${path} → HTTP ${response.status}: ${message.trim()}`)
  }

  return body
}

async function fetchJson(options, path) {
  return JSON.parse(await request(options, path))
}

// 接受 slug、/writing/<slug> 或完整 URL，统一归一化为 slug（非法百分号编码时原样返回）
function toSlug(input) {
  const withoutOrigin = String(input).replace(/^https?:\/\/[^/]+/, '')
  const withoutPrefix = withoutOrigin.replace(/^\/?writing\//, '').replace(/^\//, '')

  try {
    return decodeURIComponent(withoutPrefix)
  } catch {
    return withoutPrefix
  }
}

function printPosts(posts, asJson) {
  if (asJson) return print(JSON.stringify(posts, null, 2))
  if (!posts.length) return print('No posts found.')

  for (const post of posts) {
    const date = post.date ? String(post.date).slice(0, 10) : '          '
    print(`${date}  ${post.title}\n            ${post.url}`)
  }
}

async function run(options) {
  const { command, args } = options

  switch (command) {
    case 'help':
    case null:
      return print(USAGE)

    case 'posts': {
      const { posts } = await fetchJson(options, '/api/posts')
      return printPosts(posts ?? [], options.json)
    }

    case 'post': {
      const input = args[0]
      if (!input) throw new Error('Usage: zenhungyep post <slug|path|url>')
      return print(await request(options, `/writing/${encodeURIComponent(toSlug(input))}`, { accept: 'text/markdown' }))
    }

    case 'bookmarks': {
      const bookmarks = await fetchJson(options, '/api/bookmarks')
      if (options.json) return print(JSON.stringify(bookmarks, null, 2))

      for (const bookmark of bookmarks) {
        print(`${bookmark.title}\n  ${bookmark.link}`)
      }
      return undefined
    }

    case 'markdown': {
      const path = args[0] ?? '/'
      const normalized = path.startsWith('/') ? path : `/${path}`
      return print(await request(options, normalized, { accept: 'text/markdown' }))
    }

    case 'openapi':
      return print(JSON.stringify(JSON.parse(await request(options, '/openapi.json')), null, 2))

    case 'llms':
      return print(await request(options, '/llms.txt'))

    default:
      throw new Error(`Unknown command: ${command}. Run "zenhungyep help".`)
  }
}

const options = parseArgs(process.argv.slice(2))

run(options).catch((error) => {
  console.error(error.message)
  process.exit(1)
})
