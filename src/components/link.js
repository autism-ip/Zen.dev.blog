import NextLink from 'next/link'

import { SITE } from '@/lib/agent/site'
import { isExternalLink } from '@/lib/utils'

// 外链归宿标记使用站点自身的 host，避免把废弃域带到外链
const REF_HOST = SITE.url.replace(/^https?:\/\//, '')

export const Link = ({ href = '#', ...rest }) => {
  const isExternal = isExternalLink(href)
  if (isExternal) {
    return (
      <a
        href={`${href}?ref=${REF_HOST}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link break-words after:content-['_↗']"
        {...rest}
      />
    )
  }

  return <NextLink href={href} className="link" {...rest} />
}
