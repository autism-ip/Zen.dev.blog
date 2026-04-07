/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useSunnyMode } from './use-sunny-mode'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

// Mock CustomEvent
global.CustomEvent = jest.fn()

describe('useSunnyMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    global.localStorage = localStorageMock
  })

  describe('initial state', () => {
    it('should return active as false when localStorage has no value', () => {
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(false)
    })

    it('should return active as true when localStorage has "true"', () => {
      localStorageMock.getItem.mockReturnValue('true')
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(true)
    })

    it('should return active as false when localStorage has "false"', () => {
      localStorageMock.getItem.mockReturnValue('false')
      const { result } = renderHook(() => useSunnyMode())
      expect(result.current.active).toBe(false)
    })
  })

  describe('toggle', () => {
    it('should toggle from false to true', () => {
      localStorageMock.getItem.mockReturnValue('false')
      const { result } = renderHook(() => useSunnyMode())

      expect(result.current.active).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.active).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sunny-mode', 'true')
    })

    it('should toggle from true to false', () => {
      localStorageMock.getItem.mockReturnValue('true')
      const { result } = renderHook(() => useSunnyMode())

      expect(result.current.active).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.active).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sunny-mode', 'false')
    })
  })

  describe('persistence', () => {
    it('should save state to localStorage on toggle', () => {
      localStorageMock.getItem.mockReturnValue('false')
      const { result } = renderHook(() => useSunnyMode())

      act(() => {
        result.current.toggle()
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sunny-mode', 'true')
    })
  })

  describe('cross-tab sync via CustomEvent', () => {
    it('should dispatch CustomEvent when toggling', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { result, unmount } = renderHook(() => useSunnyMode())

      // Check that event listener is registered
      expect(addEventListenerSpy).toHaveBeenCalledWith('sunny-mode-storage', expect.any(Function))

      act(() => {
        result.current.toggle()
      })

      // CustomEvent should be dispatched
      expect(CustomEvent).toHaveBeenCalledWith('sunny-mode-storage', expect.any(Object))

      unmount()

      // Check that event listener is removed on unmount
      expect(removeEventListenerSpy).toHaveBeenCalledWith('sunny-mode-storage', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})
