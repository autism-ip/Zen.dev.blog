import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { NavigationLink } from '@/components/navigation-link'

const route = vi.hoisted(() => ({ pathname: '/writing/post' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
afterEach(cleanup)

it('retains nested-route selection and shortcut labels with compact markup', () => {
  render(<NavigationLink href="/writing" label="Writing" shortcutNumber={1} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/writing')
  expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByTitle('Shortcut key: 1')).toHaveTextContent('1')
})

it('does not select unrelated routes or change external link behavior', () => {
  render(
    <>
      <NavigationLink href="/journey" label="Journey" />
      <NavigationLink href="https://example.com" label="External" />
    </>
  )
  expect(screen.getByRole('link', { name: 'Journey' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute('rel', 'noopener noreferrer')
})
