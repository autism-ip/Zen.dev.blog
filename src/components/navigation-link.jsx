/**
 * [INPUT]: Route path and navigation label, icon, optional keyboard shortcut
 * [OUTPUT]: Internal selected link or safe external link with shared stylesheet classes
 * [POS]: Sidebar navigation; avoids repeating utility markup in every server-rendered link
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
'use client'

import { ArrowUpRightIcon, AtSignIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'

export const NavigationLink = memo(({ href, label, icon, shortcutNumber }) => {
  const pathname = usePathname()
  const iconCmp = useMemo(() => icon ?? <AtSignIcon size={16} />, [icon])

  const isInternal = href.startsWith('/')
  if (!isInternal) {
    return (
      <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="navigation-external">
        <span className="navigation-external-label">
          {iconCmp} {label}
        </span>
        <ArrowUpRightIcon size={16} />
      </a>
    )
  }

  let isActive = false
  if (pathname?.length > 0) {
    const splittedPathname = pathname.split('/')
    const currentPathname = splittedPathname[1] ?? ''
    isActive = currentPathname === href.split('/')[1]
  }

  return (
    <Link key={href} href={href} className="navigation-link" aria-current={isActive ? 'page' : undefined}>
      <span className="navigation-label">
        {iconCmp}
        <span className="navigation-label-text">{label}</span>
      </span>
      {shortcutNumber && (
        <span className="navigation-shortcut" title={`Shortcut key: ${shortcutNumber}`}>
          {shortcutNumber}
        </span>
      )}
    </Link>
  )
})
NavigationLink.displayName = 'NavigationLink'
