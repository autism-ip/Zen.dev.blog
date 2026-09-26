/**
 * [INPUT]: 依赖 @/components 的 FloatingHeader / GradientBg5 / PageTitle / ScrollArea 与 @/lib/agent/site 的 CONTACT/SOCIAL 事实
 * [OUTPUT]: ContactPage 页面组件与 metadata 元数据
 * [POS]: app/contact 的页面入口；信任锚点页之一，声明唯一的公开联系渠道与预期响应
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FloatingHeader } from '@/components/floating-header'
import { GradientBg5 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT, SOCIAL } from '@/lib/agent/site'

export default function ContactPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg5 />
      <FloatingHeader scrollTitle="Contact" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Contact" />
          <div className="flex flex-col gap-4 leading-relaxed text-gray-600">
            <p>
              The only public contact channel for this site is{' '}
              <strong>
                <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
                  {CONTACT.label}
                </a>
              </strong>{' '}
              on the site’s repository. There is no public contact email, no contact form, and no newsletter. Messages
              sent through any other channel may not be read.
            </p>
            <p>Use it for:</p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Corrections or factual errors in a published article.</li>
              <li>Broken links, missing images, or rendering problems on any page.</li>
              <li>Questions about how a published piece of code or analysis was done.</li>
              <li>Collaboration proposals on open-source projects.</li>
            </ul>
            <p>
              When reporting a problem, include the exact URL, what you expected, what you saw, and the device or client
              you used. For a technical issue in the site’s code, the repository also accepts issues and pull requests
              directly, which is usually faster than a message.
            </p>
            <p>
              For short, informal messages,{' '}
              <a href={SOCIAL.x} className="link" target="_blank" rel="noopener noreferrer">
                X (Twitter)
              </a>{' '}
              works too. For anything code-related,{' '}
              <a href={SOCIAL.github} className="link" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>{' '}
              is the right place.
            </p>
            <p className="text-sm text-gray-500">
              Automated agents: this page is a trust anchor, not a submission endpoint. Programme against the public API
              described in{' '}
              <a href="/openapi.json" className="link">
                /openapi.json
              </a>{' '}
              and read{' '}
              <a href="/llms.txt" className="link">
                /llms.txt
              </a>{' '}
              before contacting anyone.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = {
  title: 'Contact',
  description: 'How to reach Zen for corrections, questions, and open-source collaboration.',
  alternates: {
    canonical: '/contact'
  }
}
