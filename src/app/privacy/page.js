/**
 * [INPUT]: 依赖 @/components 的 FloatingHeader / GradientBg3 / PageTitle / ScrollArea 与 @/lib/agent/site 的 CONTACT/SITE 事实
 * [OUTPUT]: PrivacyPage 页面组件与 metadata 元数据
 * [POS]: app/privacy 的页面入口；信任锚点页之一，逐项声明本站实际采集与不采集的数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FloatingHeader } from '@/components/floating-header'
import { GradientBg3 } from '@/components/gradient-bg'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'
import { CONTACT, SITE } from '@/lib/agent/site'

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
              {SITE.url.replace(/^https?:\/\//, '')} is a personal reading site. There are no user accounts, no login,
              no newsletter, no advertising, and no tracking cookies. Nothing you read here is tied to an identity that
              is sold or shared with data brokers.
            </p>
            <p>
              <strong>View counters.</strong> Opening a writing page counts one view for that article. The counter is
              stored per article slug, not per visitor, and no identifier is written to your device for it.
            </p>
            <p>
              <strong>Aggregate analytics.</strong> The site loads Vercel Analytics and Speed Insights, which record
              aggregate page views and performance metrics, and a lightweight event tracker. These collect usage
              statistics — not the content of anything you type.
            </p>
            <p>
              <strong>Server logs.</strong> The hosting provider records standard request logs, which can include IP
              addresses, for security and abuse prevention. Submission endpoints apply short-lived, in-memory rate
              limits keyed by IP address; these entries are discarded automatically and are not used for profiling.
            </p>
            <p>
              <strong>Local storage.</strong> A single preference — whether the “sunny mode” easter egg is enabled — is
              stored in your browser’s local storage and never leaves your device.
            </p>
            <p>
              <strong>Third parties.</strong> Images are served by Cloudinary, article text by Contentful, and reading
              lists by Raindrop.io. Embedded content such as tweets is loaded from the respective platform and is
              subject to that platform’s own policies once loaded.
            </p>
            <p>
              Submissions — a bookmark suggestion or a friend link — are stored only to review them, and contain just
              what you choose to send. To ask what has been stored about you, or to request removal, open an issue at{' '}
              <a href={CONTACT.url} className="link" target="_blank" rel="noopener noreferrer">
                {CONTACT.label}
              </a>
              . Material changes to this page will be published here with a new date.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export const metadata = {
  title: 'Privacy',
  description: 'What zenhungyep.com collects, why, and what it never collects.',
  alternates: {
    canonical: '/privacy'
  }
}
