/**
 * Tests for ProfileCompleteness (React Testing Library, real component).
 *
 * ProfileCompleteness is an async server component.  We render it by
 * awaiting the component function and passing the resulting JSX to
 * RTL's render(), which is the standard jsdom-compatible technique.
 *
 * @/utils/supabase/server is mocked via vi.mock so no real Supabase calls are made.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Supabase server mock ─────────────────────────────────────────────────────

// Mock @/utils/supabase/server with a simple stub; we override createClient in each test
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/utils/supabase/server'
import ProfileCompleteness from '@/components/ProfileCompleteness'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = { full_name: string | null; headline: string | null; skills: string[] | null }
type Project = { id: string }

// ─── Mock factory ─────────────────────────────────────────────────────────────

function makeClient(
  user: { id: string } | null,
  profile: Profile | null,
  projects: Project[]
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: projects, error: null }),
      }
    }),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderComponent() {
  const jsx = await ProfileCompleteness()
  if (jsx === null) return null
  render(jsx as React.ReactElement)
  return jsx
}

// ─── Tests: full profile ──────────────────────────────────────────────────────

describe('ProfileCompleteness – full profile (100%)', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient(
        { id: 'user-1' },
        { full_name: 'Alice', headline: 'Dev', skills: ['React', 'TS', 'Node'] },
        [{ id: 'proj-1' }]
      ) as never
    )
  })

  it('renders 100% for a complete profile', async () => {
    await renderComponent()
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('renders the "Profile Completeness" heading', async () => {
    await renderComponent()
    expect(screen.getByText(/profile completeness/i)).toBeTruthy()
  })

  it('renders the progress bar at 100% width', async () => {
    await renderComponent()
    const bars = document.querySelectorAll('[style]')
    const fullBar = Array.from(bars).find(
      (el) => (el as HTMLElement).style.width === '100%'
    )
    expect(fullBar).toBeTruthy()
  })
})

// ─── Tests: empty profile ─────────────────────────────────────────────────────

describe('ProfileCompleteness – empty profile (0%)', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient(
        { id: 'user-1' },
        { full_name: null, headline: null, skills: null },
        []
      ) as never
    )
  })

  it('renders 0% for an empty profile', async () => {
    await renderComponent()
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('renders the "Profile Completeness" heading', async () => {
    await renderComponent()
    expect(screen.getByText(/profile completeness/i)).toBeTruthy()
  })

  it('shows the progress bar at 0% width (missing-field hint)', async () => {
    await renderComponent()
    const bars = document.querySelectorAll('[style]')
    const zeroBar = Array.from(bars).find(
      (el) => (el as HTMLElement).style.width === '0%'
    )
    expect(zeroBar).toBeTruthy()
  })
})

// ─── Tests: partial profile ───────────────────────────────────────────────────

describe('ProfileCompleteness – partial profile (50%)', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient(
        { id: 'user-1' },
        { full_name: 'Alice', headline: 'Dev', skills: null },
        []
      ) as never
    )
  })

  it('renders 50% when only name and headline are set', async () => {
    await renderComponent()
    expect(screen.getByText('50%')).toBeTruthy()
  })
})

// ─── Tests: no user ───────────────────────────────────────────────────────────

describe('ProfileCompleteness – no authenticated user', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient(null, null, []) as never
    )
  })

  it('returns null when there is no authenticated user', async () => {
    const result = await ProfileCompleteness()
    expect(result).toBeNull()
  })
})
