/**
 * Tests for ProposalStatusSelect component.
 *
 * Component details:
 *  - label text: "Proposal Status" (sr-only), htmlFor="proposal-status-select-<proposalId>"
 *  - select id:  "proposal-status-select-<proposalId>"
 *  - On change: optimistic update â†’ Supabase update â†’ rollback on error
 *  - Error shown in a <span> below the select
 *  - Disabled while isUpdating (Supabase call pending) or disabled prop is true
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProposalStatusSelect from '@/components/ProposalStatusSelect'

// â”€â”€â”€ Supabase mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

function setupSupabaseMock(error: { message: string } | null = null) {
  mockEq.mockResolvedValue({ error })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ update: mockUpdate })
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function setup(initialStatus = 'draft', disabled = false) {
  const onStatusChange = vi.fn()
  const user = userEvent.setup()
  render(
    <ProposalStatusSelect
      proposalId="test-proposal-id"
      currentStatus={initialStatus}
      onStatusChange={onStatusChange}
      disabled={disabled}
    />
  )
  // The select is labelled "Proposal Status" via sr-only label
  const select = screen.getByRole('combobox', { name: /proposal status/i })
  return { user, select, onStatusChange }
}

// â”€â”€â”€ Optimistic update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ProposalStatusSelect â€“ optimistic update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSupabaseMock(null) // success
  })

  it('renders with the initial status', () => {
    const { select } = setup('draft')
    expect(select).toHaveValue('draft')
  })

  it('immediately shows the new value after selection (optimistic)', async () => {
    const { user, select } = setup('draft')
    await user.selectOptions(select, 'sent')
    expect(select).toHaveValue('sent')
  })

  it('calls onStatusChange immediately with the new status', async () => {
    const { user, select, onStatusChange } = setup('draft')
    await user.selectOptions(select, 'replied')
    expect(onStatusChange).toHaveBeenCalledWith('replied')
  })

  it('retains the new status after successful Supabase update', async () => {
    const { user, select } = setup('draft')
    await user.selectOptions(select, 'won')
    await waitFor(() => expect(mockEq).toHaveBeenCalled())
    expect(select).toHaveValue('won')
  })

  it('calls Supabase update with the correct arguments', async () => {
    const { user, select } = setup('draft')
    await user.selectOptions(select, 'sent')
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ status: 'sent' }))
    expect(mockEq).toHaveBeenCalledWith('id', 'test-proposal-id')
  })
})

// â”€â”€â”€ Rollback on error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ProposalStatusSelect â€“ rollback on error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSupabaseMock({ message: 'Update failed' })
  })

  it('rolls back to the previous status when Supabase update fails', async () => {
    const { user, select } = setup('draft')
    await user.selectOptions(select, 'sent')
    await waitFor(() => expect(mockEq).toHaveBeenCalled())
    await waitFor(() => expect(select).toHaveValue('draft'))
  })

  it('calls onStatusChange with the rolled-back status on error', async () => {
    const { user, select, onStatusChange } = setup('draft')
    await user.selectOptions(select, 'sent')
    await waitFor(() => expect(mockEq).toHaveBeenCalled())
    // called twice: first optimistic ('sent'), then rollback ('draft')
    await waitFor(() =>
      expect(onStatusChange).toHaveBeenCalledWith('draft')
    )
  })

  it('shows the error message when update fails', async () => {
    const { user, select } = setup('draft')
    await user.selectOptions(select, 'lost')
    await waitFor(() => expect(mockEq).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/update failed/i)).toBeTruthy())
  })
})

// â”€â”€â”€ Disabled state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ProposalStatusSelect â€“ disabled prop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupSupabaseMock(null)
  })

  it('renders as disabled when disabled prop is true', () => {
    const { select } = setup('sent', true)
    expect(select).toBeDisabled()
  })

  it('is not disabled when disabled prop is false', () => {
    const { select } = setup('draft', false)
    expect(select).not.toBeDisabled()
  })
})
