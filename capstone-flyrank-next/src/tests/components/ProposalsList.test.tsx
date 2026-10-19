/**
 * Tests for ProposalsList filters and search.
 *
 * The component renders:
 *   <label htmlFor="filter-status">  Status:  </label>  (label text has icon + "Status:")
 *   <label htmlFor="filter-platform">  Platform:  </label>
 *   <input placeholder="Search by job description snippet..." />
 *
 * We query by htmlFor id to avoid ambiguity with the ProposalStatusSelect
 * comboboxes that are rendered inside each row.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProposalsList from '@/components/ProposalsList'
import type { ProposalItem } from '@/components/ProposalsList'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Build a chainable Supabase mock that resolves with the given proposals
function makeSupabaseMock(proposals: ProposalItem[]) {
  const orderResult = { data: proposals, error: null }
  const selectBuilder: Record<string, unknown> = {}
  selectBuilder.order = vi.fn().mockResolvedValue(orderResult)
  selectBuilder.eq = vi.fn().mockReturnValue(selectBuilder)

  const deleteEq = vi.fn().mockResolvedValue({ error: null })
  const updateEq = vi.fn().mockResolvedValue({ error: null })

  const fromBuilder = {
    select: vi.fn().mockReturnValue(selectBuilder),
    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
    update: vi.fn().mockReturnValue({ eq: updateEq }),
  }

  const authBuilder = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    }),
  }

  return {
    from: vi.fn().mockReturnValue(fromBuilder),
    auth: authBuilder,
  }
}

const TEST_PROPOSALS: ProposalItem[] = [
  {
    id: 'p1',
    user_id: 'user-1',
    platform: 'upwork',
    job_text: 'React developer needed for dashboard project',
    status: 'sent',
    proposal_text: 'My proposal',
    score: 75,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    user_id: 'user-1',
    platform: 'fiverr',
    job_text: 'Python backend API development',
    status: 'draft',
    proposal_text: null,
    score: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p3',
    user_id: 'user-1',
    platform: 'upwork',
    job_text: 'Vue.js frontend specialist for e-commerce',
    status: 'won',
    proposal_text: 'Won proposal',
    score: 90,
    created_at: new Date().toISOString(),
  },
]

let mockSupabase: ReturnType<typeof makeSupabaseMock>

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// Also stub ProposalStatusSelect to avoid its own Supabase calls interfering
vi.mock('@/components/ProposalStatusSelect', () => ({
  default: ({ currentStatus }: { currentStatus: string }) => (
    <span data-testid="status-badge">{currentStatus}</span>
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderAndWait() {
  const user = userEvent.setup()
  render(<ProposalsList />)
  // Wait for the loading state to clear (skeleton has aria-label="Loading proposals")
  await waitFor(
    () => expect(screen.queryByLabelText('Loading proposals')).toBeNull(),
    { timeout: 5000 }
  )
  return { user }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProposalsList – filters and search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = makeSupabaseMock(TEST_PROPOSALS)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows all proposals by default', async () => {
    await renderAndWait()
    await waitFor(() => {
      expect(screen.getByText(/react developer needed/i)).toBeTruthy()
      expect(screen.getByText(/python backend/i)).toBeTruthy()
      expect(screen.getByText(/vue\.js frontend/i)).toBeTruthy()
    })
  })

  it('filters by status using #filter-status select', async () => {
    const { user } = await renderAndWait()
    // Query by the exact element id to avoid matching row-level status selects
    const statusSelect = document.getElementById('filter-status') as HTMLSelectElement
    await user.selectOptions(statusSelect, 'sent')
    await waitFor(() => {
      expect(screen.getByText(/react developer needed/i)).toBeTruthy()
      expect(screen.queryByText(/python backend/i)).toBeNull()
      expect(screen.queryByText(/vue\.js frontend/i)).toBeNull()
    })
  })

  it('filters by platform using #filter-platform select', async () => {
    const { user } = await renderAndWait()
    const platformSelect = document.getElementById('filter-platform') as HTMLSelectElement
    await user.selectOptions(platformSelect, 'fiverr')
    await waitFor(() => {
      expect(screen.queryByText(/react developer needed/i)).toBeNull()
      expect(screen.getByText(/python backend/i)).toBeTruthy()
    })
  })

  it('searches proposals by job text', async () => {
    const { user } = await renderAndWait()
    // Exact placeholder from the component
    const searchInput = screen.getByPlaceholderText('Search by job description snippet...')
    await user.type(searchInput, 'python')
    await waitFor(() => {
      expect(screen.queryByText(/react developer needed/i)).toBeNull()
      expect(screen.getByText(/python backend/i)).toBeTruthy()
    })
  })

  it('shows no proposals when filter matches nothing', async () => {
    const { user } = await renderAndWait()
    const statusSelect = document.getElementById('filter-status') as HTMLSelectElement
    await user.selectOptions(statusSelect, 'lost')
    await waitFor(() => {
      expect(screen.queryByText(/react developer needed/i)).toBeNull()
      expect(screen.queryByText(/python backend/i)).toBeNull()
      expect(screen.queryByText(/vue\.js frontend/i)).toBeNull()
    })
  })

  it('resets search when input is cleared', async () => {
    const { user } = await renderAndWait()
    const searchInput = screen.getByPlaceholderText('Search by job description snippet...')
    await user.type(searchInput, 'python')
    await waitFor(() => expect(screen.queryByText(/react developer needed/i)).toBeNull())
    await user.clear(searchInput)
    await waitFor(() =>
      expect(screen.getByText(/react developer needed/i)).toBeTruthy()
    )
  })
})
