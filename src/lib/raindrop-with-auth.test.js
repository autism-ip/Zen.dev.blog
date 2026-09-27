// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

import { getTokenManager } from '@/lib/auth/get-token-manager'
import { getBookmarkItems, getBookmarks } from '@/lib/raindrop-with-auth'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/constants', () => ({ COLLECTION_IDS: [123] }))
vi.mock('@/lib/auth/get-token-manager', () => ({ getTokenManager: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
it('propagates upstream errors instead of turning real collections into missing pages', async () => {
  getTokenManager.mockReturnValue({ getValidAccessToken: async () => 'test-token' })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
  await expect(getBookmarks()).rejects.toThrow('503')
  await expect(getBookmarkItems(123)).rejects.toThrow('503')
})
it('distinguishes credential-free CI from an outage of configured authentication', async () => {
  getTokenManager.mockReturnValue({
    getValidAccessToken: async () => {
      throw new Error('unavailable')
    }
  })
  vi.stubEnv('RAINDROP_CLIENT_ID', '')
  vi.stubEnv('RAINDROP_CLIENT_SECRET', '')
  expect(await getBookmarks()).toEqual([])
  vi.stubEnv('RAINDROP_CLIENT_ID', 'configured')
  vi.stubEnv('RAINDROP_CLIENT_SECRET', 'configured')
  await expect(getBookmarks()).rejects.toThrow('temporarily unavailable')
})
