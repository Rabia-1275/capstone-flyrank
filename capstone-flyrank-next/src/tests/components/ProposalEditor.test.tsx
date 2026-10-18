/**
 * Tests for ProposalEditor component.
 *
 * - Spinner only while generating (Loader2 present in Stop button)
 * - Error box with Retry on a failed fetch response
 * - Error box with Retry on an empty stream ("The AI returned no text")
 * - Autosave never fires for empty text
 * - Autosave never fires while generating
 * - Autosave fires after text changes and debounce delay (fake timers)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProposalEditor from '@/components/ProposalEditor'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// navigator.clipboard is not available in jsdom
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
})

// window.confirm – always return true so Generate doesn't stall on the dialog
vi.spyOn(window, 'confirm').mockReturnValue(true)

// Stub crypto.subtle.digest so the hash useEffect resolves immediately
// even under fake timers (it uses a Promise that depends on micro-task scheduling)
const digestStub = vi.fn().mockResolvedValue(new ArrayBuffer(32))
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: { digest: digestStub },
    getRandomValues: (arr: Uint8Array) => arr,
  },
  writable: true,
})

// ─── Test fixtures ────────────────────────────────────────────────────────────

const PROPOSAL_ID = 'test-proposal-id'

const ANALYSIS = {
  summary: 'Good job fit.',
  client_needs: ['React'],
  required_skills: ['React'],
  skill_match: { matched: ['React'], gaps: [] },
  red_flags: [],
  clarifying_questions: ['Q1?', 'Q2?', 'Q3?'],
  pricing: {
    model: 'fixed' as const,
    low: 500,
    high: 1000,
    currency: 'USD',
    timeline_days: 14,
    reasoning: 'Small scope.',
  },
}

function defaultProps(overrides: Partial<Parameters<typeof ProposalEditor>[0]> = {}) {
  return {
    proposalId: PROPOSAL_ID,
    initialText: 'Some initial proposal text.',
    analysis: ANALYSIS,
    initialTone: 'professional',
    initialLength: 'medium' as const,
    ...overrides,
  }
}

// ─── Spinner while generating ─────────────────────────────────────────────────

describe('ProposalEditor – spinner while generating', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows Stop button with spinner when generating', async () => {
    // fetch that never resolves → keeps generating=true
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    render(<ProposalEditor {...defaultProps({ initialText: '' })} />)
    const generateBtn = screen.getByRole('button', { name: /generate/i })
    await userEvent.click(generateBtn)
    // Should now show Stop button
    expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy()
  })

  it('does not show spinner when not generating', () => {
    render(<ProposalEditor {...defaultProps()} />)
    // Generate button visible, Stop button absent
    expect(screen.getByRole('button', { name: /generate/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull()
  })
})

// ─── Error box on failed response ─────────────────────────────────────────────

describe('ProposalEditor – error box on fetch failure', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error box with Retry button when API returns non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<ProposalEditor {...defaultProps({ initialText: '' })} />)
    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => expect(screen.getByText(/generation failed/i)).toBeTruthy())
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('shows rate limit error message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<ProposalEditor {...defaultProps({ initialText: '' })} />)
    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => expect(screen.getByText(/rate limit exceeded/i)).toBeTruthy())
  })
})

// ─── Error box on empty stream ────────────────────────────────────────────────
//
// jsdom doesn't have ReadableStream, so we mock res.body to be null
// (which the component handles by throwing 'No response stream available')
// OR we give res.body a reader that immediately returns done=true.
// We choose: make the component's reader.read() return {done:true, value:undefined}
// so receivedChars===0 → throws 'The AI returned no text'.

describe('ProposalEditor – error box on empty stream', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows "The AI returned no text" error when stream is empty', async () => {
    // Return a Response whose body reader immediately signals done
    const mockReader = {
      read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      cancel: vi.fn(),
    }
    const mockBody = { getReader: () => mockReader }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: mockBody,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)

    render(<ProposalEditor {...defaultProps({ initialText: '' })} />)
    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() =>
      expect(screen.getByText(/the AI returned no text/i)).toBeTruthy(),
      { timeout: 5000 }
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })
})

// ─── Autosave ─────────────────────────────────────────────────────────────────
//
// The component's autosave debounce:
//   useEffect(() => {
//     if (generating || text === savedText || text.trim() === '') return
//     const id = setTimeout(() => saveProposal(), 2000)
//     return () => clearTimeout(id)
//   }, [text, generating])
//
// Key constraint: crypto.subtle.digest (hashing effect) is stubbed above
// so it resolves immediately even under fake timers.
// We use fireEvent.change (synchronous) to set text, avoiding userEvent's
// internal timing conflicts with vi.useFakeTimers.

describe('ProposalEditor – autosave', () => {
  beforeEach(() => {
    // Timers only move when the test advances them explicitly
    vi.useFakeTimers({ shouldAdvanceTime: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not call fetch for autosave when text is empty', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )
    // initialText '' → text === savedText === '' → guard short-circuits
    render(<ProposalEditor {...defaultProps({ initialText: '' })} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    const saveCalls = fetchSpy.mock.calls.filter(c =>
      (c[0] as string).includes('/save')
    )
    expect(saveCalls).toHaveLength(0)
  })

  it('does not call fetch for autosave while generating', async () => {
    // Generate streams one chunk and then hangs, so the textarea holds
    // non-empty text that differs from savedText while generating=true.
    // Only the `generating` guard can stop the autosave in this state.
    const chunk = new TextEncoder().encode('Streaming proposal text in progress')
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: chunk })
        .mockImplementation(() => new Promise(() => {})),
      cancel: vi.fn(),
    }
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => mockReader },
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response)

    // Earlier afterEach hooks call vi.restoreAllMocks(), which removes the
    // module-level confirm stub, so re-stub it here (initialText is non-empty)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ProposalEditor {...defaultProps({ initialText: 'saved text' })} />)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    })

    // Let the first chunk land in the textarea
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      'Streaming proposal text in progress'
    )
    expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy()

    // Advance well past the 2000ms debounce window
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })

    const urls = fetchSpy.mock.calls.map(c => c[0] as string)
    expect(urls.some(u => u.includes('/generate'))).toBe(true)
    expect(urls.filter(u => u.includes('/save'))).toHaveLength(0)
  })

  it('fires autosave after 2s debounce when text changes from saved value', async () => {
    // Use real fetch mock that resolves synchronously
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    )

    render(<ProposalEditor {...defaultProps({ initialText: 'saved text' })} />)
    const textarea = screen.getByRole('textbox')

    // fireEvent.change is synchronous — sets text != savedText
    // which triggers the autosave useEffect to schedule a 2000ms timer
    act(() => {
      fireEvent.change(textarea, {
        target: { value: 'completely new proposal text that is not empty' },
      })
    })

    // Advance past the 2000ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })

    // saveProposal() should have called fetch('/api/proposals/.../save', ...)
    const saveCalls = fetchSpy.mock.calls.filter(c =>
      (c[0] as string).includes('/save')
    )
    expect(saveCalls.length).toBeGreaterThanOrEqual(1)
  })
})
