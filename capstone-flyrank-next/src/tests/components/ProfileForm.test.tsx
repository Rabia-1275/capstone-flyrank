/**
 * Tests for ProfileForm component.
 * Tests skills tag input (Enter adds, dedupes, max 20, remove)
 * and portfolio link validation.
 *
 * saveProfile action is mocked to avoid server-action dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileForm from '@/components/ProfileForm'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the server action
vi.mock('@/app/profile/actions', () => ({
  saveProfile: vi.fn().mockResolvedValue({ error: null }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultProfile = {
  full_name: 'Jane Doe',
  headline: 'Frontend dev',
  skills: [] as string[],
  portfolio_links: [] as string[],
  tone: 'professional',
}

function setup(profileOverrides: Partial<typeof defaultProfile> = {}) {
  const user = userEvent.setup()
  const profile = { ...defaultProfile, ...profileOverrides }
  const utils = render(<ProfileForm initialData={profile} />)
  const skillInput = screen.getByPlaceholderText(/type a skill/i)
  const linkInput = screen.getByPlaceholderText(/https:\/\//i)
  return { user, skillInput, linkInput, ...utils }
}

// ─── Skills tag input ─────────────────────────────────────────────────────────

describe('ProfileForm – skills tag input', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a skill when Enter is pressed', async () => {
    const { user, skillInput } = setup()
    await user.click(skillInput)
    await user.type(skillInput, 'React')
    await user.keyboard('{Enter}')
    expect(screen.getByText('React')).toBeTruthy()
  })

  it('adds a skill when comma is pressed', async () => {
    const { user, skillInput } = setup()
    await user.click(skillInput)
    await user.type(skillInput, 'TypeScript')
    fireEvent.keyDown(skillInput, { key: ',', code: 'Comma' })
    expect(screen.getByText('TypeScript')).toBeTruthy()
  })

  it('clears the input after adding a skill', async () => {
    const { user, skillInput } = setup()
    await user.click(skillInput)
    await user.type(skillInput, 'React')
    await user.keyboard('{Enter}')
    expect(skillInput).toHaveValue('')
  })

  it('does not add a duplicate skill', async () => {
    const { user, skillInput } = setup({ skills: ['React'] })
    await user.click(skillInput)
    await user.type(skillInput, 'React')
    await user.keyboard('{Enter}')
    const tags = screen.getAllByText('React')
    // Only 1 tag should exist
    expect(tags).toHaveLength(1)
  })

  it('does not add more than 20 skills', async () => {
    const twentySkills = Array.from({ length: 20 }, (_, i) => `Skill${i + 1}`)
    const { user, skillInput } = setup({ skills: twentySkills })
    // Input should be disabled at 20 skills
    expect(skillInput).toBeDisabled()
    await user.click(skillInput).catch(() => {}) // might throw if disabled
    // Attempt to add a 21st skill via keyboard
    fireEvent.keyDown(skillInput, { key: 'Enter', code: 'Enter' })
    // Still 20 tags
    const tags = screen.getAllByRole('button', { name: /remove skill/i })
    expect(tags.length).toBeLessThanOrEqual(20)
  })

  it('removes a skill when × button is clicked', async () => {
    const { user } = setup({ skills: ['React', 'Vue'] })
    // Find the remove button for 'React'
    const tags = screen.getAllByText('React')
    expect(tags.length).toBeGreaterThan(0)
    // Each skill tag has a × button labelled "Remove skill <name>"
    await user.click(screen.getByRole('button', { name: 'Remove skill React' }))
    // React should be gone
    expect(screen.queryByText('React')).toBeNull()
  })

  it('renders initial skills as tags', () => {
    setup({ skills: ['JavaScript', 'Python'] })
    expect(screen.getByText('JavaScript')).toBeTruthy()
    expect(screen.getByText('Python')).toBeTruthy()
  })
})

describe('ProfileForm – accessible labels', () => {
  it('associates Full Name and Tone with getByLabelText', () => {
    setup()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Doe')
    expect(screen.getByLabelText(/^tone$/i)).toHaveValue('professional')
  })
})

// ─── Portfolio link validation ────────────────────────────────────────────────

describe('ProfileForm – portfolio link validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a valid https:// URL when Enter is pressed', async () => {
    const { user, linkInput } = setup()
    await user.click(linkInput)
    await user.type(linkInput, 'https://example.com')
    await user.keyboard('{Enter}')
    expect(screen.getByText('https://example.com')).toBeTruthy()
  })

  it('adds a valid http:// URL', async () => {
    const { user, linkInput } = setup()
    await user.click(linkInput)
    await user.type(linkInput, 'http://portfolio.dev')
    await user.keyboard('{Enter}')
    expect(screen.getByText('http://portfolio.dev')).toBeTruthy()
  })

  it('rejects a URL without http(s) scheme and shows error', async () => {
    const { user, linkInput } = setup()
    await user.click(linkInput)
    await user.type(linkInput, 'portfolio.dev')
    await user.keyboard('{Enter}')
    // Error message should appear
    expect(screen.getByText(/must be a valid http/i)).toBeTruthy()
  })

  it('does not add an invalid URL to the list', async () => {
    const { user, linkInput } = setup()
    await user.click(linkInput)
    await user.type(linkInput, 'not-a-url')
    await user.keyboard('{Enter}')
    // The input value should remain since it wasn't added
    expect(screen.queryByText('not-a-url')).toBeNull()
  })

  it('removes a portfolio link when × button is clicked', async () => {
    const { user } = setup({ portfolio_links: ['https://mysite.com'] })
    const link = screen.getByText('https://mysite.com')
    expect(link).toBeTruthy()
    const removeBtn = screen.getByRole('button', { name: 'Remove link https://mysite.com' })
    await user.click(removeBtn)
    expect(screen.queryByText('https://mysite.com')).toBeNull()
  })
})
