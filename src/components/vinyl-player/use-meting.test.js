import { renderHook } from '@testing-library/react'
import { useMeting } from './use-meting'

describe('useMeting', () => {
  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useMeting())

    expect(result.current.isReady).toBe(false)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTrack).toBe(null)
    expect(result.current.containerRef.current).toBe(null)
  })

  it('exposes toggle, next, prev as functions', () => {
    const { result } = renderHook(() => useMeting())

    expect(typeof result.current.toggle).toBe('function')
    expect(typeof result.current.next).toBe('function')
    expect(typeof result.current.prev).toBe('function')
  })

  it('exposes containerRef as an object with current property', () => {
    const { result } = renderHook(() => useMeting())

    expect(result.current.containerRef).toHaveProperty('current')
  })
})