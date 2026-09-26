/**
 * [INPUT]: 依赖 @/components 的 FloatingHeader / GradientBg / PageTitle / ScrollArea 与 @/lib/agent/site 的站点事实
 * [OUTPUT]: AboutPage 页面组件与 metadata 元数据
 * [POS]: app/about 的页面入口；信任锚点页之一，向人与 agent 说明站点主体、发布内容与技术构成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FloatingHeader } from '@/components/floating-header'
import { GradientBg } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT, SITE, SOCIAL } from '@/lib/agent/site'

export default function AboutPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg />
      <FloatingHeader scrollTitle="About" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="About" />
          <div className="flex flex-col gap-4 leading-relaxed text-gray-600">
            <p>
              {SITE.author} — known online as <strong>Zen</strong> — is an AI Product Manager and vibecoder based in
              Paris. This site, <strong>zenhungyep.com</strong>, is his personal website: a place to publish long-form
              writing, keep public collections of links, and document the tools, projects, and photographs that make up
              his work.
            </p>
            <p>
              The writing here focuses on AI agents, mathematical modeling, deep learning frameworks such as MindSpore
              and PyTorch, and the practice of building open-source software. Everything published is written by Zen
              himself; the site accepts no sponsored posts, no guest posts, and no advertising. When a page references
              another product or project, it is because it was genuinely used or read — not because of a commercial
              arrangement.
            </p>
            <p>
              The site is built with Next.js and React, with writing stored in Contentful, reading lists curated with
              Raindrop.io, view counters kept in Supabase, media hosted on Cloudinary, and deployment on Vercel.
              Structured data, an OpenAPI description, and a Markdown mirror of every page are published so that both
              people and automated agents can read the content without reverse-engineering the markup.
            </p>
            <p className="text-sm text-gray-500">
              Corrections, questions, and collaboration requests are welcome — open an issue at{' '}
              <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
                {CONTACT.label}
              </a>
              . You can also find Zen on{' '}
              <a href={SOCIAL.github} className="link" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>{' '}
              and{' '}
              <a href={SOCIAL.x} className="link" target="_blank" rel="noopener noreferrer">
                X
              </a>
              . For the machine-readable version of this page, request it with{' '}
              <code className="inline-code">Accept: text/markdown</code>.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = {
  title: 'About',
  description: `Who ${SITE.author} is, what zenhungyep.com publishes, and how the site is built.`,
  alternates: {
    canonical: '/about'
  }
}
