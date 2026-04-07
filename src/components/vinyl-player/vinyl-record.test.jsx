import { render, screen, fireEvent } from '@testing-library/react'
import { VinylRecord } from './vinyl-record.jsx'

describe('VinylRecord', () => {
  it('renders without crashing', () => {
    const { container } = render(<VinylRecord isPlaying={false} />)
    expect(container.querySelector('[class*="record"]')).toBeInTheDocument()
  })

  it('has spinning animation when playing', () => {
    const { container } = render(<VinylRecord isPlaying={true} />)
    const record = container.querySelector('[class*="record"]')
    expect(record.className).toMatch(/spinning/)
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<VinylRecord isPlaying={false} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has aria-label for accessibility', () => {
    render(<VinylRecord isPlaying={false} onClick={() => {}} />)
    expect(screen.getByRole('button', { name: /播放音乐/i })).toBeInTheDocument()
  })
})
