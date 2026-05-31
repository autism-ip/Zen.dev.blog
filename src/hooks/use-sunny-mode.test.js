/**
 * [INPUT]: 依赖 useSunnyMode hook、Vitest mock、Testing Library renderHook
 * [OUTPUT]: 验证阳光模式的初始状态、切换持久化、同页事件广播
 * [POS]: hooks/ 的状态契约测试，锁定 localStorage 与 CustomEvent 行为
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSunnyMode } from './use-sunny-mode'

// Mock localStorage with real-like behavior
const store = {}
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => {
    store[key] = value
  }),
  removeItem: vi.fn((key) => {
    delete store[key]
  })
}

describe('useSunnyMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(store).forEach((key) => delete store[key])
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true
    })
  })

  describe('initial state', () => {
    it('should return active as false when localStorage has no value', () => {
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(false)
    })

    it('should return active as true when localStorage has "true"', () => {
      store['sunny-mode'] = 'true'
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(true)
    })

    it('should return active as false when localStorage has "false"', () => {
      store['sunny-mode'] = 'false'
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(false)
    })
  })

  describe('toggle', () => {
    it('should toggle from false to true', () => {
      store['sunny-mode'] = 'false'
      const { result } = renderHook(() => useSunnyMode())

      expect(result.current.active).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.active).toBe(true)
      expect(store['sunny-mode']).toBe('true')
    })

    it('should toggle from true to false', () => {
      store['sunny-mode'] = 'true'
      const { result } = renderHook(() => useSunnyMode())

      expect(result.current.active).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.active).toBe(false)
      expect(store['sunny-mode']).toBe('false')
    })
  })

  describe('persistence', () => {
    it('should save state to localStorage on toggle', () => {
      store['sunny-mode'] = 'false'
      const { result } = renderHook(() => useSunnyMode())

      act(() => {
        result.current.toggle()
      })

      expect(store['sunny-mode']).toBe('true')
    })
  })

  describe('cross-tab sync via CustomEvent', () => {
    it('should dispatch CustomEvent when toggling', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

      const { result, unmount } = renderHook(() => useSunnyMode())

      // Check that event listener is registered
      expect(addEventListenerSpy).toHaveBeenCalledWith('sunny-mode-storage', expect.any(Function))

      act(() => {
        result.current.toggle()
      })

      // CustomEvent should be dispatched
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'sunny-mode-storage' }))

      unmount()

      // Check that event listener is removed on unmount
      expect(removeEventListenerSpy).toHaveBeenCalledWith('sunny-mode-storage', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
      dispatchEventSpy.mockRestore()
    })
  })
})
