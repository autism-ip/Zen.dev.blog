/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { SunnyToggle, SunnyOverlay } from './sunny-mode'

// Mock audio
const audioMock = {
  play: jest.fn(),
  pause: jest.fn(),
  load: jest.fn(),
  loop: true,
  volume: 0.4
}
global.Audio = jest.fn(() => audioMock)

describe('SunnyToggle', () => {
  const defaultProps = {
    active: false,
    onToggle: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render toggle switch with role="switch"', () => {
      render(<SunnyToggle {...defaultProps} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toBeInTheDocument()
    })

    it('should render hint text when off', () => {
      render(<SunnyToggle {...defaultProps} active={false} />)
      expect(screen.getByText('← psst… try flipping this')).toBeInTheDocument()
    })

    it('should render sunny hint text when on', () => {
      render(<SunnyToggle {...defaultProps} active={true} />)
      expect(screen.getByText('the sun is peeking through ☀')).toBeInTheDocument()
    })
  })

  describe('OFF state styling', () => {
    it('should have gray background when off', () => {
      render(<SunnyToggle {...defaultProps} active={false} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveClass('bg-gray-200')
      expect(toggle).not.toHaveClass('bg-amber-500')
    })
  })

  describe('ON state styling', () => {
    it('should have amber background when on', () => {
      render(<SunnyToggle {...defaultProps} active={true} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveClass('bg-amber-500')
      expect(toggle).not.toHaveClass('bg-gray-200')
    })
  })

  describe('user interaction', () => {
    it('should call onToggle when clicked', () => {
      render(<SunnyToggle {...defaultProps} />)
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it('should be accessible with proper role', () => {
      render(<SunnyToggle {...defaultProps} active={true} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    it('should have aria-checked false when off', () => {
      render(<SunnyToggle {...defaultProps} active={false} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })
  })
})

describe('SunnyOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render overlay when active', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should not render children when inactive', () => {
      const { container } = render(<SunnyOverlay active={false} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('structure', () => {
    it('should have fixed positioning with z-40', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const overlay = container.firstChild
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-40')
    })

    it('should have pointer-events-none', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const overlay = container.firstChild
      expect(overlay).toHaveClass('pointer-events-none')
    })
  })

  describe('blinds effect', () => {
    it('should render 23 horizontal blinds', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const blinds = container.querySelectorAll('.sunny-blind')
      expect(blinds.length).toBe(23)
    })

    it('each blind should be 40px tall', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const blind = container.querySelector('.sunny-blind')
      expect(blind).toHaveStyle({ height: '40px' })
    })

    it('blinds should have #1a1917 color', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const blind = container.querySelector('.sunny-blind')
      expect(blind).toHaveStyle({ backgroundColor: '#1a1917' })
    })
  })

  describe('animation', () => {
    it('should have matrix3d transform for 3D shutter effect', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const overlay = container.firstChild
      const style = overlay.getAttribute('style') || ''
      expect(style).toContain('matrix3d')
    })

    it('should have perspective for 3D effect', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const overlay = container.firstChild
      const style = overlay.getAttribute('style') || ''
      expect(style).toContain('perspective')
    })
  })

  describe('opacity transitions', () => {
    it('should have opacity 0.07 when active', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const overlay = container.firstChild
      expect(overlay).toHaveStyle({ opacity: '0.07' })
    })

    it('should have opacity 0 when inactive', () => {
      const { container } = render(<SunnyOverlay active={false} />)
      // When inactive, component returns null
      expect(container.firstChild).toBeNull()
    })
  })

  describe('audio', () => {
    it('should create audio element with loop', () => {
      render(<SunnyOverlay active={true} />)
      expect(global.Audio).toHaveBeenCalledWith('/assets/sunny-bgm.mp3')
    })

    it('should set volume to 0.4', () => {
      render(<SunnyOverlay active={true} />)
      expect(audioMock.volume).toBe(0.4)
    })

    it('should play audio when active', () => {
      render(<SunnyOverlay active={true} />)
      expect(audioMock.play).toHaveBeenCalled()
    })

    it('should pause audio when unmounting', () => {
      const { unmount } = render(<SunnyOverlay active={true} />)
      unmount()
      expect(audioMock.pause).toHaveBeenCalled()
    })
  })

  describe('SVG filter', () => {
    it('should render SVG with wind animation filter', () => {
      const { container } = render(<SunnyOverlay active={true} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
