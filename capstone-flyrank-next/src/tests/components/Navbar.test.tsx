/**
 * Tests for Navbar (React Testing Library, real component).
 *
 * Navbar is an async server component.  We render it by awaiting the
 * component function and passing the resolved JSX to RTL's render().
 *
 * Mocks:
 *   - @/utils/supabase/server  (via vi.mock + module-level variable)
 *   - @/app/auth/actions       (signout stub)
 *   - next/link                (plain <a>)
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

// ─── Mock next/link ───────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// ─── Mock auth actions ────────────────────────────────────────────────────────

vi.mock('@/app/auth/actions', () => ({
  signout: vi.fn(),
}))

// ─── Supabase server mock ─────────────────────────────────────────────────────

let _user: { id: string; email: string } | null = null

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: _user }, error: null })),
      },
    })
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderNavbar() {
  const jsx = await Navbar()
  render(jsx as React.ReactElement)
}

// ─── Tests: unauthenticated ───────────────────────────────────────────────────

describe('Navbar – unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _user = null
  })

  it('renders the "ProposalAI" brand link', async () => {
    await renderNavbar()
    expect(screen.getByText('ProposalAI')).toBeTruthy()
  })

  it('renders the Home link', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
  })

  it('renders the Health link', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Health' })).toBeTruthy()
  })

  it('does NOT render protected links when logged out', async () => {
    await renderNavbar()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Profile' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Proposals' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull()
  })

  it('renders a Login link when logged out', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Login' })).toBeTruthy()
  })

  it('does NOT render a Sign out button when logged out', async () => {
    await renderNavbar()
    expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull()
  })
})

// ─── Tests: authenticated ─────────────────────────────────────────────────────

describe('Navbar – authenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _user = { id: 'user-1', email: 'alice@example.com' }
  })

  it('renders the "ProposalAI" brand link', async () => {
    await renderNavbar()
    expect(screen.getByText('ProposalAI')).toBeTruthy()
  })

  it('renders the Home and Health public links', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Health' })).toBeTruthy()
  })

  it('renders the Dashboard link when logged in', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy()
  })

  it('renders the Profile link when logged in', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeTruthy()
  })

  it('renders the Proposals link when logged in', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Proposals' })).toBeTruthy()
  })

  it('renders the Settings link when logged in', async () => {
    await renderNavbar()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy()
  })

  it('renders the user email', async () => {
    await renderNavbar()
    expect(screen.getByText('alice@example.com')).toBeTruthy()
  })

  it('renders a Sign out button when logged in', async () => {
    await renderNavbar()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy()
  })

  it('does NOT render a Login link when logged in', async () => {
    await renderNavbar()
    expect(screen.queryByRole('link', { name: 'Login' })).toBeNull()
  })
})
