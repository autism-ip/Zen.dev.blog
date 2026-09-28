/**
 * [INPUT]: Public site identity and canonical URL
 * [OUTPUT]: Concise AboutPage, ProfilePage schema and metadata
 * [POS]: app/about public identity page without infrastructure details
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FloatingHeader } from '@/components/floating-header'
import { GradientBg } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { SITE } from '@/lib/agent/site'
import { pageMetadata, safeJsonLd } from '@/lib/seo'

export default function AboutPage() {
  return (
    <ScrollArea useScrollAreaId>
      <GradientBg />
      <FloatingHeader scrollTitle="About" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title={`About ${SITE.displayName}`} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd({
                '@context': 'https://schema.org',
                '@type': 'ProfilePage',
                '@id': `${SITE.url}/about#profile`,
                url: `${SITE.url}/about`,
                name: `About ${SITE.displayName}`,
                mainEntity: { '@id': `${SITE.url}/#person` }
              })
            }}
          />
          <div className="flex flex-col gap-4 leading-relaxed text-gray-600">
            <p>
              {SITE.displayName}, also known as Zen, writes about mathematics, AI, and open-source software. This
              personal site brings together published essays, curated links, photographs, and notes from ongoing work.
            </p>
            <p>
              The writing reflects personal interests and experience. It is shared so readers can follow the ideas, find
              the original articles, and explore the public collections at their own pace.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = pageMetadata('/about')
