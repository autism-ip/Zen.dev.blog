/**
 * [INPUT]: Ordered page names and canonical paths
 * [OUTPUT]: Visible breadcrumb links and matching BreadcrumbList JSON-LD
 * [POS]: Server-rendered navigation for content detail pages
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import Link from 'next/link'

import { breadcrumbs, safeJsonLd } from '@/lib/seo'

export function Breadcrumbs({ items }) {
  const all = [{ name: 'Home', path: '/' }, ...items]
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap gap-2">
          {all.map((item, index) => (
            <li key={item.path}>
              {index > 0 && (
                <span aria-hidden="true" className="mr-2">
                  /
                </span>
              )}
              {index === all.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.path}>{item.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs(items)) }} />
    </>
  )
}
