/**
 * Tests for src/lib/dashboard.ts – aggregateDashboard and helpers.
 * All pure functions; no Supabase or network calls.
 */
import { describe, it, expect } from 'vitest'
import { aggregateDashboard, ProposalRow } from '@/lib/dashboard'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProposal(overrides: Partial<ProposalRow> = {}): ProposalRow {
  return {
    id: 'p1',
    platform: 'upwork',
    tone: 'professional',
    status: 'sent',
    score: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ─── aggregateDashboard ───────────────────────────────────────────────────────

describe('aggregateDashboard', () => {
  it('returns all-null rates for empty array', () => {
    const data = aggregateDashboard([])
    expect(data.total).toBe(0)
    expect(data.submitted).toBe(0)
    expect(data.replyRate).toBeNull()
    expect(data.winRate).toBeNull()
    expect(data.avgScore).toBeNull()
  })

  it('counts total correctly', () => {
    const proposals = [makeProposal(), makeProposal({ id: 'p2', status: 'draft' })]
    const data = aggregateDashboard(proposals)
    expect(data.total).toBe(2)
  })

  it('calculates reply rate correctly', () => {
    const proposals = [
      makeProposal({ id: 'p1', status: 'sent' }),
      makeProposal({ id: 'p2', status: 'replied' }),
      makeProposal({ id: 'p3', status: 'sent' }),
      makeProposal({ id: 'p4', status: 'sent' }),
    ]
    const data = aggregateDashboard(proposals)
    // submitted = 4, replied/won = 1 → rate = 1/4 = 0.25
    expect(data.submitted).toBe(4)
    expect(data.replyRate).toBeCloseTo(0.25)
  })

  it('calculates win rate correctly', () => {
    const proposals = [
      makeProposal({ id: 'p1', status: 'sent' }),
      makeProposal({ id: 'p2', status: 'won' }),
      makeProposal({ id: 'p3', status: 'won' }),
      makeProposal({ id: 'p4', status: 'lost' }),
    ]
    const data = aggregateDashboard(proposals)
    // submitted = 4, won = 2 → winRate = 0.5
    expect(data.winRate).toBeCloseTo(0.5)
  })

  it('returns null replyRate when no submitted proposals', () => {
    const proposals = [makeProposal({ status: 'draft' })]
    const data = aggregateDashboard(proposals)
    expect(data.replyRate).toBeNull()
    expect(data.winRate).toBeNull()
  })

  it('calculates avgScore from numeric scores', () => {
    const proposals = [
      makeProposal({ id: 'p1', score: 80 }),
      makeProposal({ id: 'p2', score: 60 }),
    ]
    const data = aggregateDashboard(proposals)
    expect(data.avgScore).toBe(70)
  })

  it('calculates avgScore from object scores', () => {
    const proposals = [
      makeProposal({ id: 'p1', score: { overall: 90 } }),
      makeProposal({ id: 'p2', score: { overall: 70 } }),
    ]
    const data = aggregateDashboard(proposals)
    expect(data.avgScore).toBe(80)
  })

  it('ignores null scores in avgScore', () => {
    const proposals = [
      makeProposal({ id: 'p1', score: null }),
      makeProposal({ id: 'p2', score: 80 }),
    ]
    const data = aggregateDashboard(proposals)
    expect(data.avgScore).toBe(80)
    expect(data.scoredCount).toBe(1)
  })

  it('returns null avgScore when no scores', () => {
    const proposals = [makeProposal({ score: null })]
    const data = aggregateDashboard(proposals)
    expect(data.avgScore).toBeNull()
    expect(data.scoredCount).toBe(0)
  })

  it('groups by platform', () => {
    const proposals = [
      makeProposal({ id: 'p1', platform: 'upwork', status: 'sent' }),
      makeProposal({ id: 'p2', platform: 'fiverr', status: 'sent' }),
      makeProposal({ id: 'p3', platform: 'upwork', status: 'won' }),
    ]
    const data = aggregateDashboard(proposals)
    const upworkRow = data.byPlatform.find(r => r.label === 'upwork')
    const fiverrRow = data.byPlatform.find(r => r.label === 'fiverr')
    expect(upworkRow?.submitted).toBe(2)
    expect(upworkRow?.won).toBe(1)
    expect(fiverrRow?.submitted).toBe(1)
  })

  it('groups by tone', () => {
    const proposals = [
      makeProposal({ id: 'p1', tone: 'professional', status: 'sent' }),
      makeProposal({ id: 'p2', tone: 'friendly', status: 'sent' }),
      makeProposal({ id: 'p3', tone: 'professional', status: 'won' }),
    ]
    const data = aggregateDashboard(proposals)
    const profRow = data.byTone.find(r => r.label === 'professional')
    expect(profRow?.submitted).toBe(2)
    expect(profRow?.won).toBe(1)
  })

  it('includes weekly buckets', () => {
    const data = aggregateDashboard([])
    // 8 week buckets always present
    expect(data.weekly).toHaveLength(8)
  })

  it('counts proposals in the correct weekly bucket', () => {
    // Use today's date so it falls in the last bucket
    const proposal = makeProposal({ created_at: new Date().toISOString() })
    const data = aggregateDashboard([proposal])
    const total = data.weekly.reduce((acc, b) => acc + b.count, 0)
    expect(total).toBe(1)
  })

  it('handles n < 5 edge case – reply rate is non-null with only 1 submitted', () => {
    const proposals = [makeProposal({ id: 'p1', status: 'replied' })]
    const data = aggregateDashboard(proposals)
    // Only 1 submitted; replyRate = 1/1 = 1 (not null – the n<5 note is purely UI)
    expect(data.replyRate).toBe(1)
  })
})
