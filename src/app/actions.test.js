// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getBookmarkItemsByPageIndex } from '@/app/actions'
import { COLLECTION_IDS } from '@/lib/constants'
import { getBookmarkItems } from '@/lib/raindrop-with-auth'

vi.mock('@/lib/constants', () => ({ COLLECTION_IDS: [65582294] }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/raindrop-with-auth', () => ({ getBookmarkItems: vi.fn() }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Server actions must not loop through public HTTP quotas')
    })
  )
})
afterEach(() => vi.unstubAllGlobals())
describe('bookmark pagination server action', () => {
  it('reads the provider directly and preserves items and counts', async () => {
    getBookmarkItems.mockResolvedValue({ items: [{ _id: 1 }, { _id: 2 }] })
    expect(await getBookmarkItemsByPageIndex(COLLECTION_IDS[0], 2)).toEqual({
      result: true,
      items: [{ _id: 1 }, { _id: 2 }],
      count: 2
    })
    expect(getBookmarkItems).toHaveBeenCalledWith(COLLECTION_IDS[0], 2)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('rejects private collections and invalid pages before accessing the provider', async () => {
    for (const [id, page] of [
      [-1, 0],
      [COLLECTION_IDS[0], -1],
      [COLLECTION_IDS[0], 201],
      [COLLECTION_IDS[0], 1.5]
    ]) {
      expect(await getBookmarkItemsByPageIndex(id, page)).toEqual({ result: false, items: [], count: 0 })
    }
    expect(getBookmarkItems).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('preserves failed and empty results', async () => {
    getBookmarkItems
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ items: [] })
      .mockRejectedValueOnce(new Error('offline'))
    expect(await getBookmarkItemsByPageIndex(COLLECTION_IDS[0], 0)).toEqual({ result: false, items: [] })
    expect(await getBookmarkItemsByPageIndex(COLLECTION_IDS[0], 0)).toEqual({ result: true, items: [], count: 0 })
    expect(await getBookmarkItemsByPageIndex(COLLECTION_IDS[0], 0)).toEqual({ result: false, items: [] })
  })
})
