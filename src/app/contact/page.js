/**
 * [INPUT]: Public GitHub contact URL
 * [OUTPUT]: Minimal ContactPage and metadata without an email address
 * [POS]: app/contact public contact page
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg5 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT } from '@/lib/agent/site'
import { pageMetadata } from '@/lib/seo'

export default function ContactPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg5 />
      <FloatingHeader scrollTitle="Contact" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Contact" />
          <p className="leading-relaxed text-gray-600">
            For corrections, questions, or collaboration related to published work, open an issue on{' '}
            <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            . Please include the relevant page URL and a short description. There is no public email address or contact
            form on this site.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/contact')
