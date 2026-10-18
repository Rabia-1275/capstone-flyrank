/**
 * Tests for src/lib/usage.ts – checkAndRecordUsage with a mocked Supabase client.
 * Never calls real Supabase. All Supabase methods are stubbed via vi.fn().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkAndRecordUsage } from '@/lib/usage'

// ─── Mock builder ─────────────────────────────────────────────────────────────

type MockBuilder = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

function makeMockBuilder(queryResult: unknown, insertResult: unknown): MockBuilder {
  const insertFn = vi.fn().mockResolvedValue(insertResult)
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    order: vi.fn().mockResolvedValue(queryResult),
    insert: insertFn,
    update: vi.fn(),
    delete: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  return builder
}

function makeMockSupabase(queryResult: unknown, insertResult: unknown = { error: null }): SupabaseClient {
  const builder = makeMockBuilder(queryResult, insertResult)
  return {
    from: vi.fn().mockReturnValue(builder),
  } as unknown as SupabaseClient
}

const USER_ID = 'test-user-123'

// ─── Under limit ─────────────────────────────────────────────────────────────

describe('checkAndRecordUsage – under limit', () => {
  beforeEach(() => {
    // Remove any override env vars
    delete process.env.AI_LIMIT_ANALYZE_PER_HOUR
    delete process.env.AI_DISABLED
  })

  it('returns { allowed: true } when usage count is 0', async () => {
    const supabase = makeMockSupabase({ data: [], error: null })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'analyze')
    expect(result.allowed).toBe(true)
  })

  it('returns { allowed: true } when usage count is below default limit', async () => {
    // analyze default limit is 10; 9 events means still allowed
    const events = Array.from({ length: 9 }, (_, i) => ({
      created_at: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    }))
    const supabase = makeMockSupabase({ data: events, error: null })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'analyze')
    expect(result.allowed).toBe(true)
  })

  it('calls supabase.from("ai_usage").insert() when allowed', async () => {
    const supabase = makeMockSupabase({ data: [], error: null })
    await checkAndRecordUsage(supabase, USER_ID, 'generate')
    const fromCalls = (supabase.from as ReturnType<typeof vi.fn>).mock.calls
    // Should have been called with 'ai_usage' for both select and insert
    const calledArgs = fromCalls.map((c: unknown[]) => c[0])
    expect(calledArgs).toContain('ai_usage')
  })
})

// ─── Over limit ──────────────────────────────────────────────────────────────

describe('checkAndRecordUsage – over limit', () => {
  it('returns { allowed: false } when usage equals default analyze limit (10)', async () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      created_at: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    }))
    const supabase = makeMockSupabase({ data: events, error: null })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'analyze')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.message).toMatch(/rate limit exceeded/i)
      expect(result.retryAfterSeconds).toBeGreaterThan(0)
      expect(result.resetTime).toBeTruthy()
    }
  })

  it('returns { allowed: false } when usage exceeds default generate limit (30)', async () => {
    const events = Array.from({ length: 30 }, (_, i) => ({
      created_at: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    }))
    const supabase = makeMockSupabase({ data: events, error: null })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'generate')
    expect(result.allowed).toBe(false)
  })

  it('respects custom limit from env var', async () => {
    process.env.AI_LIMIT_ANALYZE_PER_HOUR = '3'
    // 3 events → should be over the custom limit of 3
    const events = Array.from({ length: 3 }, (_, i) => ({
      created_at: new Date(Date.now() - (i + 1) * 60_000).toISOString(),
    }))
    const supabase = makeMockSupabase({ data: events, error: null })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'analyze')
    expect(result.allowed).toBe(false)
    delete process.env.AI_LIMIT_ANALYZE_PER_HOUR
  })
})

// ─── Query error (fail open) ──────────────────────────────────────────────────

describe('checkAndRecordUsage – query error', () => {
  it('fails open (returns allowed: true) when the DB query errors', async () => {
    const supabase = makeMockSupabase({ data: null, error: { message: 'table not found' } })
    const result = await checkAndRecordUsage(supabase, USER_ID, 'score')
    expect(result.allowed).toBe(true)
  })
})
