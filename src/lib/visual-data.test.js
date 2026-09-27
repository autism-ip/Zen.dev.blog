import { describe, expect, it } from 'vitest'

import { toVisualData } from '@/lib/visual-data'

describe('server gallery hydration data', () => {
  it('preserves published titles, image dimensions and alt descriptions', () => {
    const media = {
      public_id: 'visual/sunrise',
      url: 'https://example.com/photo.jpg',
      mediaType: 'image',
      sourceType: 'photography',
      title: 'Sunrise',
      description: 'Sunrise over a lake',
      aspect_ratio: 1.5,
      width: 900,
      height: 600
    }
    expect(toVisualData([media])[0]).toMatchObject({
      title: 'Sunrise',
      description: 'Sunrise over a lake',
      cloudinaryId: 'visual/sunrise',
      aspectRatio: 1.5,
      originalResource: media
    })
  })
  it('represents an empty published library as empty content, and distinguishes videos', () => {
    expect(toVisualData([])).toEqual([])
    expect(
      toVisualData([
        { public_id: 'video', mediaType: 'video', sourceType: 'aigc', url: 'https://example.com/video.mp4' }
      ])[0]
    ).toMatchObject({ title: 'AI Video 1', videoUrl: 'https://example.com/video.mp4' })
  })
})
