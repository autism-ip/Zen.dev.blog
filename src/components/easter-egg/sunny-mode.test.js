/**
 * [INPUT]: 依赖 sunny-mode 组件、useSunnyMode mock、Audio API mock
 * [OUTPUT]: 验证 SunnyToggle 与 SunnyOverlay 的可访问性、视觉结构、音频生命周期
 * [POS]: components/easter-egg 的组件契约测试，隔离 hook 后只检查渲染和交互
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSunnyMode } from '@/hooks/use-sunny-mode'
import { SunnyToggle, SunnyOverlay } from './sunny-mode'

vi.mock('@/hooks/use-sunny-mode', () => ({
  useSunnyMode: vi.fn()
}))

// Mock audio
const audioMock = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  loop: false,
  volume: 0
}
globalThis.Audio = vi.fn(() => audioMock)

describe('SunnyToggle', () => {
  const toggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useSunnyMode.mockReturnValue({ active: false, toggle })
  })

  describe('rendering', () => {
    it('should render toggle switch with role="switch"', () => {
      render(createElement(SunnyToggle))
      const toggle = screen.getByRole('switch')
      expect(toggle).toBeInTheDocument()
    })

    it('should render hint text when off', () => {
      render(createElement(SunnyToggle))
      expect(screen.getByText('← psst… try flipping this')).toBeInTheDocument()
    })

    it('should render sunny hint text when on', () => {
      useSunnyMode.mockReturnValue({ active: true, toggle })
      render(createElement(SunnyToggle))
      expect(screen.getByText('the sun is peeking through ☀')).toBeInTheDocument()
    })
  })

  describe('OFF state styling', () => {
    it('should have gray background when off', () => {
      render(createElement(SunnyToggle))
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveClass('bg-gray-200')
      expect(toggle).not.toHaveClass('bg-amber-500')
    })
  })

  describe('ON state styling', () => {
    it('should have amber background when on', () => {
      useSunnyMode.mockReturnValue({ active: true, toggle })
      render(createElement(SunnyToggle))
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveClass('bg-amber-500')
      expect(toggle).not.toHaveClass('bg-gray-200')
    })
  })

  describe('user interaction', () => {
    it('should call onToggle when clicked', () => {
      render(createElement(SunnyToggle))
      fireEvent.click(screen.getByRole('switch'))
      expect(toggle).toHaveBeenCalledTimes(1)
    })

    it('should be accessible with proper role', () => {
      useSunnyMode.mockReturnValue({ active: true, toggle })
      render(createElement(SunnyToggle))
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    it('should have aria-checked false when off', () => {
      render(createElement(SunnyToggle))
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })
  })
})

describe('SunnyOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    audioMock.volume = 0
    audioMock.loop = false
    useSunnyMode.mockReturnValue({ active: true, toggle: vi.fn() })
  })

  describe('rendering', () => {
    it('should render overlay when active', () => {
      const { container } = render(createElement(SunnyOverlay))
      expect(container.querySelector('div[aria-hidden="true"]')).toBeInTheDocument()
    })

    it('should not render children when inactive', () => {
      useSunnyMode.mockReturnValue({ active: false, toggle: vi.fn() })
      const { container } = render(createElement(SunnyOverlay))
      expect(container.firstChild).toBeNull()
    })
  })

  describe('structure', () => {
    it('should have fixed positioning with z-40', () => {
      const { container } = render(createElement(SunnyOverlay))
      const overlay = container.querySelector('div[aria-hidden="true"]')
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-40')
    })

    it('should have pointer-events-none', () => {
      const { container } = render(createElement(SunnyOverlay))
      const overlay = container.querySelector('div[aria-hidden="true"]')
      expect(overlay).toHaveClass('pointer-events-none')
    })
  })

  describe('blinds effect', () => {
    it('should render 23 horizontal blinds', () => {
      const { container } = render(createElement(SunnyOverlay))
      const blinds = container.querySelectorAll('.sunny-blind')
      expect(blinds.length).toBe(23)
    })

    it('each blind should use the 40px height utility', () => {
      const { container } = render(createElement(SunnyOverlay))
      const blind = container.querySelector('.sunny-blind')
      expect(blind).toHaveClass('h-10')
    })

    it('blinds should use the dark background utility', () => {
      const { container } = render(createElement(SunnyOverlay))
      const blind = container.querySelector('.sunny-blind')
      expect(blind).toHaveClass('bg-gray-900')
    })
  })

  describe('animation', () => {
    it('should have matrix3d transform for 3D shutter effect', () => {
      const { container } = render(createElement(SunnyOverlay))
      const panel = Array.from(container.querySelectorAll('div')).find((node) =>
        (node.getAttribute('style') || '').includes('matrix3d')
      )
      expect(panel).toBeInTheDocument()
    })

    it('should have perspective for 3D effect', () => {
      const { container } = render(createElement(SunnyOverlay))
      const overlay = container.querySelector('div[aria-hidden="true"]')
      const style = overlay.getAttribute('style') || ''
      expect(style).toContain('perspective')
    })
  })

  describe('opacity transitions', () => {
    it('should have opacity 0.07 when active', () => {
      const { container } = render(createElement(SunnyOverlay))
      const panel = Array.from(container.querySelectorAll('div')).find((node) =>
        (node.getAttribute('style') || '').includes('opacity')
      )
      expect(panel).toHaveStyle({ opacity: '0.07' })
    })

    it('should have opacity 0 when inactive', () => {
      useSunnyMode.mockReturnValue({ active: false, toggle: vi.fn() })
      const { container } = render(createElement(SunnyOverlay))
      // When inactive, component returns null
      expect(container.firstChild).toBeNull()
    })
  })

  describe('audio', () => {
    it('should create audio element with loop', () => {
      render(createElement(SunnyOverlay))
      expect(global.Audio).toHaveBeenCalledWith('/assets/sunny-bgm.mp3')
      expect(audioMock.loop).toBe(true)
    })

    it('should set volume to 0.4', () => {
      render(createElement(SunnyOverlay))
      expect(audioMock.volume).toBe(0.4)
    })

    it('should play audio when active', () => {
      render(createElement(SunnyOverlay))
      expect(audioMock.play).toHaveBeenCalled()
    })

    it('should pause audio when unmounting', () => {
      const { unmount } = render(createElement(SunnyOverlay))
      unmount()
      expect(audioMock.pause).toHaveBeenCalled()
    })
  })

  describe('SVG filter', () => {
    it('should render SVG with wind animation filter', () => {
      const { container } = render(createElement(SunnyOverlay))
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
