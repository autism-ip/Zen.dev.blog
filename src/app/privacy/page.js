/**
 * [INPUT]: Public contact URL
 * [OUTPUT]: Concise privacy notice and metadata without infrastructure details
 * [POS]: app/privacy public notice of data practices
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg3 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT } from '@/lib/agent/site'
import { pageMetadata } from '@/lib/seo'

export default function PrivacyPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg3 />
      <FloatingHeader scrollTitle="Privacy" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Privacy" />
          <div className="flex flex-col gap-4 leading-relaxed text-gray-600">
            <p>
              This site does not offer visitor accounts or a newsletter. It uses aggregate analytics and article view
              counts to understand which pages are read and whether the site is working well.
            </p>
            <p>
              Standard request logs may contain IP addresses and are used for site operation and abuse prevention. Some
              content is delivered by external services, and embedded content may be subject to their policies. A local
              browser preference remembers whether sunny mode is enabled.
            </p>
            <p>
              If you have a privacy question or a removal request, open an issue on{' '}
              <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/privacy')
