import { expect, it, vi } from 'vitest'

import { getVisualMedia } from '@/lib/visual-media'
import { getVisualPageData } from '@/lib/visual-page-data'

vi.mock('@/lib/visual-media', () => ({ getVisualMedia: vi.fn() }))
it('preserves published gallery content', async () => {
  const media = [{ public_id: 'visual/lake' }]
  getVisualMedia.mockResolvedValueOnce(media)
  expect(await getVisualPageData()).toEqual({ media, unavailable: false })
})
it('distinguishes an outage from a legitimate empty library for noindex metadata', async () => {
  getVisualMedia.mockRejectedValueOnce(new Error('Cloudinary unavailable'))
  expect(await getVisualPageData()).toEqual({ media: [], unavailable: true })
  getVisualMedia.mockResolvedValueOnce([])
  expect(await getVisualPageData()).toEqual({ media: [], unavailable: false })
})
