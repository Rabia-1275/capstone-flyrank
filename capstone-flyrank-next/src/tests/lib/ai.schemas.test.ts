/**
 * Tests for src/lib/ai.ts – Zod schemas only (no Groq calls).
 * analysisSchema and proposalScoreSchema are pure validators.
 */
import { describe, it, expect } from 'vitest'
import { analysisSchema, proposalScoreSchema, scoreBreakdownItemSchema } from '@/lib/ai'

// ─── analysisSchema ───────────────────────────────────────────────────────────

const validAnalysis = {
  summary: 'Good fit for React dev.',
  client_needs: ['React', 'TypeScript'],
  required_skills: ['React', 'Node.js'],
  skill_match: { matched: ['React'], gaps: ['Node.js'] },
  red_flags: [],
  clarifying_questions: ['Q1', 'Q2', 'Q3'],
  pricing: {
    model: 'fixed' as const,
    low: 500,
    high: 1000,
    currency: 'USD' as const,
    timeline_days: 14,
    reasoning: 'Small project.',
  },
}

describe('analysisSchema', () => {
  it('accepts a valid analysis object', () => {
    const result = analysisSchema.parse(validAnalysis)
    expect(result.summary).toBe('Good fit for React dev.')
    expect(result.pricing.model).toBe('fixed')
    expect(result.clarifying_questions).toHaveLength(3)
  })

  it('accepts hourly pricing model', () => {
    const hourly = { ...validAnalysis, pricing: { ...validAnalysis.pricing, model: 'hourly' as const } }
    const result = analysisSchema.parse(hourly)
    expect(result.pricing.model).toBe('hourly')
  })

  it('rejects when clarifying_questions has fewer than 3 items', () => {
    expect(() =>
      analysisSchema.parse({ ...validAnalysis, clarifying_questions: ['Q1', 'Q2'] })
    ).toThrow()
  })

  it('rejects when clarifying_questions has more than 3 items', () => {
    expect(() =>
      analysisSchema.parse({ ...validAnalysis, clarifying_questions: ['Q1', 'Q2', 'Q3', 'Q4'] })
    ).toThrow()
  })

  it('rejects invalid pricing model', () => {
    expect(() =>
      analysisSchema.parse({ ...validAnalysis, pricing: { ...validAnalysis.pricing, model: 'monthly' } })
    ).toThrow()
  })

  it('rejects non-USD currency', () => {
    expect(() =>
      analysisSchema.parse({ ...validAnalysis, pricing: { ...validAnalysis.pricing, currency: 'EUR' } })
    ).toThrow()
  })

  it('rejects missing required field summary', () => {
    const { summary: _s, ...rest } = validAnalysis
    expect(() => analysisSchema.parse(rest)).toThrow()
  })

  it('accepts empty arrays for red_flags and skill_match.gaps', () => {
    const result = analysisSchema.parse({
      ...validAnalysis,
      red_flags: [],
      skill_match: { matched: ['React'], gaps: [] },
    })
    expect(result.red_flags).toHaveLength(0)
    expect(result.skill_match.gaps).toHaveLength(0)
  })
})

// ─── scoreBreakdownItemSchema ─────────────────────────────────────────────────

describe('scoreBreakdownItemSchema', () => {
  it('accepts a valid breakdown item', () => {
    const result = scoreBreakdownItemSchema.parse({ score: 7, feedback: 'Good hook.' })
    expect(result.score).toBe(7)
  })

  it('rejects score below 0', () => {
    expect(() => scoreBreakdownItemSchema.parse({ score: -1, feedback: 'bad' })).toThrow()
  })

  it('rejects score above 10', () => {
    expect(() => scoreBreakdownItemSchema.parse({ score: 11, feedback: 'bad' })).toThrow()
  })
})

// ─── proposalScoreSchema ──────────────────────────────────────────────────────

const validScore = {
  overall: 72,
  breakdown: {
    hook: { score: 8, feedback: 'Strong opener.' },
    relevance: { score: 7, feedback: 'Relevant.' },
    specificity: { score: 6, feedback: 'Could be more specific.' },
    clarity_length: { score: 8, feedback: 'Clear and concise.' },
    call_to_action: { score: 7, feedback: 'Good closing.' },
  },
  strengths: ['Clear tone'],
  improvements: ['Add concrete numbers'],
  unsupported_claims: [],
  better_opening: 'As a React developer with 5 years of experience...',
}

describe('proposalScoreSchema', () => {
  it('accepts a valid score object', () => {
    const result = proposalScoreSchema.parse(validScore)
    expect(result.overall).toBe(72)
    expect(result.breakdown.hook.score).toBe(8)
  })

  it('rejects overall score below 0', () => {
    expect(() => proposalScoreSchema.parse({ ...validScore, overall: -1 })).toThrow()
  })

  it('rejects overall score above 100', () => {
    expect(() => proposalScoreSchema.parse({ ...validScore, overall: 101 })).toThrow()
  })

  it('rejects strengths array with more than 3 items', () => {
    expect(() =>
      proposalScoreSchema.parse({ ...validScore, strengths: ['a', 'b', 'c', 'd'] })
    ).toThrow()
  })

  it('rejects improvements array with more than 3 items', () => {
    expect(() =>
      proposalScoreSchema.parse({ ...validScore, improvements: ['a', 'b', 'c', 'd'] })
    ).toThrow()
  })

  it('accepts empty unsupported_claims', () => {
    const result = proposalScoreSchema.parse({ ...validScore, unsupported_claims: [] })
    expect(result.unsupported_claims).toHaveLength(0)
  })

  it('accepts unsupported_claims with items', () => {
    const result = proposalScoreSchema.parse({ ...validScore, unsupported_claims: ['Claim A'] })
    expect(result.unsupported_claims).toContain('Claim A')
  })

  it('rejects missing breakdown fields', () => {
    const { breakdown: _b, ...rest } = validScore
    expect(() => proposalScoreSchema.parse(rest)).toThrow()
  })
})
