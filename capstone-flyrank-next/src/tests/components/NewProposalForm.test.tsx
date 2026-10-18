/**
 * Tests for NewProposalForm component.
 *
 * Component details:
 *   - Submit button text: "Analyze Job" (loading: "Analyzing...")
 *   - Submit disabled when jobText.length < 50 OR > 8000 OR loading
 *   - Textarea placeholder: "Paste the job description here..."
 *   - Error displayed in red div above the button
 *   - On success: renders analysis.summary on screen
 *   - emptyProfile=true shows "Your profile is mostly empty!" banner
 */
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewProposalForm from '@/components/NewProposalForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
})

// ─── Constants ────────────────────────────────────────────────────────────────

const SHORT_JOB = 'Too short.'
// Exactly 50 chars of valid text
const VALID_JOB =
  'We need a skilled React developer to build dashboa'
// Long enough to be sure
const FULL_JOB =
  'We need a skilled React developer to build a modern dashboard application with data visualisation.'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(emptyProfile = false) {
  const user = userEvent.setup()
  render(<NewProposalForm emptyProfile={emptyProfile} />)
  const textarea = screen.getByPlaceholderText('Paste the job description here...')
  const submitBtn = () => screen.getByRole('button', { name: /analyze job/i })
  return { user, textarea, submitBtn }
}

// ─── Initial state ────────────────────────────────────────────────────────────

describe('NewProposalForm – initial state', () => {
  it('renders a disabled submit button when textarea is empty', () => {
    const { submitBtn } = setup()
    expect(submitBtn()).toBeDisabled()
  })

  it('shows profile warning when emptyProfile=true', () => {
    setup(true)
    expect(screen.getByText(/your profile is mostly empty/i)).toBeTruthy()
  })

  it('does not show profile warning when emptyProfile=false', () => {
    setup(false)
    expect(screen.queryByText(/your profile is mostly empty/i)).toBeNull()
  })

  it('associates the Platform select with an accessible name', () => {
    setup()
    expect(screen.getByLabelText(/^platform$/i)).toHaveValue('upwork')
  })
})

// ─── Minimum 50-char validation ───────────────────────────────────────────────

describe('NewProposalForm – min 50 chars', () => {
  afterEach(() => vi.restoreAllMocks())

  it('keeps button disabled for text shorter than 50 chars', async () => {
    const { user, textarea, submitBtn } = setup()
    await user.type(textarea, SHORT_JOB)
    expect(submitBtn()).toBeDisabled()
  })

  it('enables button when text is exactly 50 chars', async () => {
    const { user, textarea, submitBtn } = setup()
    await user.click(textarea)
    await user.paste(VALID_JOB)
    expect(submitBtn()).not.toBeDisabled()
  })
})

// ─── Loading state ────────────────────────────────────────────────────────────

describe('NewProposalForm – loading state', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows "Analyzing..." and is disabled while fetch is pending', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    const { user, textarea } = setup()
    await user.click(textarea)
    await user.paste(FULL_JOB)
    await user.click(screen.getByRole('button', { name: /analyze job/i }))
    const btn = screen.getByRole('button', { name: /analyzing/i })
    expect(btn).toBeDisabled()
  })
})

// ─── API errors ───────────────────────────────────────────────────────────────

describe('NewProposalForm – API errors', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows API error message when response is not ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const { user, textarea } = setup()
    await user.click(textarea)
    await user.paste(FULL_JOB)
    await user.click(screen.getByRole('button', { name: /analyze job/i }))
    await waitFor(() =>
      expect(screen.getByText(/rate limit exceeded/i)).toBeTruthy()
    )
  })

  it('shows generic error when response has no error field', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const { user, textarea } = setup()
    await user.click(textarea)
    await user.paste(FULL_JOB)
    await user.click(screen.getByRole('button', { name: /analyze job/i }))
    await waitFor(() =>
      expect(screen.getByText(/failed to analyze job/i)).toBeTruthy()
    )
  })
})

// ─── Successful response ──────────────────────────────────────────────────────

describe('NewProposalForm – success', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders analysis summary on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'prop-123',
          analysis: {
            summary: 'Great match for this role.',
            client_needs: ['React'],
            required_skills: ['React'],
            skill_match: { matched: ['React'], gaps: [] },
            red_flags: [],
            clarifying_questions: ['Q1?'],
            pricing: {
              model: 'fixed',
              low: 500,
              high: 1000,
              currency: 'USD',
              timeline_days: 14,
              reasoning: 'Small scope.',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const { user, textarea } = setup()
    await user.click(textarea)
    await user.paste(FULL_JOB)
    await user.click(screen.getByRole('button', { name: /analyze job/i }))
    await waitFor(() =>
      expect(screen.getByText('Great match for this role.')).toBeTruthy()
    )
  })
})
