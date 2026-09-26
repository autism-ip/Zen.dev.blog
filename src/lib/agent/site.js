/**
 * [INPUT]: 无外部依赖；仅读取 NEXT_PUBLIC_SITE_URL 环境变量
 * [OUTPUT]: 对外提供 SITE / SOCIAL / CONTACT / AGENT_FILES / SECTIONS / SECTION_BY_PATH
 * [POS]: lib/agent 的事实层与唯一真相源；llms.txt、JSON-LD、OpenAPI、markdown 路由与 /developers 均从此处取站点身份，避免多处硬编码漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ---------------------------------------------------------------------------
// 站点身份
// ---------------------------------------------------------------------------

// 规范主机为 apex：Vercel 生产域名、robots.js 的 Host 与 NEXT_PUBLIC_BASE_URL 均指向它。
// www 变体由 next.config.mjs 的 host 条件 308 重定向到此处，避免双主机同内容。
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zenhungyep.com'

export const SITE = {
  name: 'Zen',
  author: '叶振幸 (Zen)',
  url: RAW_SITE_URL.replace(/\/$/, ''),
  title: 'Zen',
  description:
    "Paris-based AI Product Manager & vibecoder, shipping AI products and open-source projects with a maker's spirit.",
  language: 'en',
  // 取自站点自身公开描述，用于 Organization JSON-LD 的 PostalAddress
  address: { addressLocality: 'Paris', addressCountry: 'FR' }
}

export const SOCIAL = {
  github: 'https://github.com/autism-ip',
  x: 'https://x.com/autism539937'
}

// 首页自我介绍（首页 hero 与 Markdown 镜像的唯一事实源）
export const HOME_BIO = [
  'Hi, I am Zen(叶振幸).',
  'Open Source Intern , Mathematics & Applied Math Student 👋',
  'Bridging Mathematics & AI—Python & Deep Learning frameworks (MindSpore/PyTorch).',
  'From Mathematical Modeling to AI-driven diagnostics.',
  "Exploring Open Source × Deep Learning; Passionate about building open source projects—let's chat!"
]

// 公开联系渠道：邮箱 + GitHub Issues（联系邮箱由站点所有者确认公开）
export const CONTACT = {
  email: 'y1327514070@gmail.com',
  url: `${SOCIAL.github}/Zen.dev.blog/issues`,
  contactType: 'technical support',
  label: 'GitHub Issues'
}

// ---------------------------------------------------------------------------
// agent 可发现的机器可读文件
// ---------------------------------------------------------------------------

export const AGENT_FILES = [
  {
    path: '/llms.txt',
    contentType: 'text/plain; charset=utf-8',
    description: 'Agent guide: what this site is, when to use it, and which endpoints to call.'
  },
  {
    path: '/openapi.json',
    contentType: 'application/json; charset=utf-8',
    description: 'OpenAPI 3.1 specification of the public HTTP API.'
  },
  {
    path: '/sitemap.xml',
    contentType: 'application/xml',
    description: 'Every indexable URL on the site.'
  },
  {
    path: '/writing.xml',
    contentType: 'application/rss+xml',
    description: 'RSS feed of writing posts.'
  },
  {
    path: '/bookmarks.xml',
    contentType: 'application/rss+xml',
    description: 'RSS feed of bookmarks.'
  }
]

// ---------------------------------------------------------------------------
// 站点分区
// ---------------------------------------------------------------------------

export const SECTIONS = [
  {
    path: '/writing',
    title: 'Writing',
    description: 'Long-form essays on AI agents, mathematics, and software engineering.'
  },
  {
    path: '/journey',
    title: 'Journey',
    description: 'Timeline of milestones and experiences.'
  },
  {
    path: '/stack',
    title: 'Stack',
    description: 'Tools, software, and hardware used daily.'
  },
  {
    path: '/workspace',
    title: 'Workspace',
    description: 'Current projects, hardware inventory, and a public work log.'
  },
  {
    path: '/visual',
    title: 'Visual',
    description: 'Photography and AI-generated imagery.'
  },
  {
    path: '/bookmarks',
    title: 'Bookmarks',
    description: 'Curated links on AI, tools, books, templates, and music.'
  },
  {
    path: '/musings',
    title: 'Musings',
    description: 'Short thoughts and reflections, published via GitHub Issues.'
  },
  {
    path: '/friends',
    title: 'Friends',
    description: 'Blogroll of people writing and building in the open.'
  },
  {
    path: '/about',
    title: 'About',
    description: 'Who Zen is, what this site publishes, and how it is built.'
  },
  {
    path: '/contact',
    title: 'Contact',
    description: 'How to reach Zen for collaboration, corrections, or questions.'
  },
  {
    path: '/privacy',
    title: 'Privacy',
    description: 'What data this site collects, why, and how it is stored.'
  },
  {
    path: '/developers',
    title: 'Developers',
    description: 'Public API, OpenAPI spec, and agent integration guide.'
  }
]

export const SECTION_BY_PATH = Object.fromEntries(SECTIONS.map((section) => [section.path, section]))
