import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useKeyPress } from './use-key-press'

describe('useKeyPress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls callback when correct key is pressed', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress(callback, ['KeyA']))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('does not call callback when shift key is pressed', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress(callback, ['KeyA']))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', shiftKey: true }))
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores keys not in keyCodes array', () => {
    const callback = vi.fn()
    renderHook(() => useKeyPress(callback, ['KeyA']))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' }))
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('returns cleanup function that removes listener on unmount', () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useKeyPress(callback, ['KeyA']))

    unmount()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
    })

    expect(callback).not.toHaveBeenCalled()
  })
})
