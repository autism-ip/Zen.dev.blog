import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VinylPlayer } from './'

describe('VinylPlayer', () => {
  it('renders Music button', () => {
    render(<VinylPlayer />)
    expect(screen.getByText('Music')).toBeInTheDocument()
  })
})
