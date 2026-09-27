import Link from 'next/link'

import { FloatingHeader } from '@/components/floating-header'
import { PageTitle } from '@/components/page-title'
import { ScrollArea } from '@/components/scroll-area'

export function NotFound() {
  return (
    <ScrollArea useScrollAreaId>
      <FloatingHeader scrollTitle="Not found" />
      <div className="content-wrapper">
        <div className="content">
          <PageTitle title="Not found" />
          <p>This link might be broken, deleted, or moved. Nevertheless, there’s nothing to see here...</p>
          <p className="mt-4">
            <Link className="link" href="/">
              Home
            </Link>{' '}
            ·{' '}
            <Link className="link" href="/writing">
              Writing
            </Link>
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
