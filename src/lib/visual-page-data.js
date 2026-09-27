/**
 * [INPUT]: Cached published Cloudinary media
 * [OUTPUT]: One request-consistent media/error snapshot for page content and robots metadata
 * [POS]: Keeps the Visual shell available without indexing an upstream error as normal gallery content
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { cache } from 'react'

import { getVisualMedia } from '@/lib/visual-media'

export const getVisualPageData = cache(async () => {
  try {
    return { media: await getVisualMedia(), unavailable: false }
  } catch {
    console.error('Visual gallery temporarily unavailable')
    return { media: [], unavailable: true }
  }
})
