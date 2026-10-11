/**
 * Dashboard aggregation helpers.
 * Runs server-side on already-RLS-scoped proposal rows.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface ProposalRow {
  id: string
  platform: string
  tone: string
  status: string
  score: { overall?: number; text_hash?: string; scored_at?: string } | number | null
  created_at: string
}

export interface BreakdownRow {
  label: string
  submitted: number
  replied: number
  won: number
  winRate: number | null
  avgScoreWon: number | null
  avgScoreNotWon: number | null
}

export interface WeekBucket {
  label: string      // e.g. "Oct 6"
  count: number
  weekStart: string  // ISO date of Monday
}

export interface DashboardData {
  total: number
  submitted: number
  replyRate: number | null
  winRate: number | null
  avgScore: number | null
  scoredCount: number
  byPlatform: BreakdownRow[]
  byTone: BreakdownRow[]
  weekly: WeekBucket[]
}

// ── Helpers ────────────────────────────────────────────────────────────

const SUBMITTED_STATUSES = new Set(['sent', 'replied', 'won', 'lost'])

function extractOverall(score: ProposalRow['score']): number | null {
  if (score === null || score === undefined) return null
  if (typeof score === 'number') return score
  if (typeof score === 'object' && 'overall' in score && typeof score.overall === 'number') {
    return score.overall
  }
  return null
}

function safeRate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

function buildBreakdown(rows: ProposalRow[], keyFn: (r: ProposalRow) => string): BreakdownRow[] {
  const buckets = new Map<string, ProposalRow[]>()
  for (const r of rows) {
    const key = keyFn(r)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(r)
  }

  const result: BreakdownRow[] = []
  for (const [label, items] of buckets) {
    const sub = items.filter(r => SUBMITTED_STATUSES.has(r.status))
    const replied = sub.filter(r => r.status === 'replied' || r.status === 'won').length
    const won = sub.filter(r => r.status === 'won').length
    const notWon = sub.filter(r => r.status !== 'won')

    const wonScores = sub.filter(r => r.status === 'won').map(r => extractOverall(r.score)).filter((s): s is number => s !== null)
    const notWonScores = notWon.map(r => extractOverall(r.score)).filter((s): s is number => s !== null)

    result.push({
      label,
      submitted: sub.length,
      replied,
      won,
      winRate: safeRate(won, sub.length),
      avgScoreWon: wonScores.length > 0 ? Math.round(wonScores.reduce((a, b) => a + b, 0) / wonScores.length) : null,
      avgScoreNotWon: notWonScores.length > 0 ? Math.round(notWonScores.reduce((a, b) => a + b, 0) / notWonScores.length) : null,
    })
  }

  return result.sort((a, b) => b.submitted - a.submitted)
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function buildWeekly(rows: ProposalRow[]): WeekBucket[] {
  const now = new Date()
  const thisMonday = getMonday(now)

  // Build 8 week buckets going backward
  const buckets: WeekBucket[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - i * 7)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    buckets.push({
      label: `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`,
      count: 0,
      weekStart: weekStart.toISOString(),
    })
  }

  // Count proposals per bucket
  for (const r of rows) {
    const created = new Date(r.created_at)
    const rowMonday = getMonday(created)
    for (const b of buckets) {
      const bStart = new Date(b.weekStart)
      if (rowMonday.getTime() === bStart.getTime()) {
        b.count++
        break
      }
    }
  }

  return buckets
}

// ── Main ───────────────────────────────────────────────────────────────

export function aggregateDashboard(proposals: ProposalRow[]): DashboardData {
  const submitted = proposals.filter(r => SUBMITTED_STATUSES.has(r.status))
  const repliedOrWon = submitted.filter(r => r.status === 'replied' || r.status === 'won')
  const won = submitted.filter(r => r.status === 'won')

  const allScores = proposals
    .map(r => extractOverall(r.score))
    .filter((s): s is number => s !== null)

  return {
    total: proposals.length,
    submitted: submitted.length,
    replyRate: safeRate(repliedOrWon.length, submitted.length),
    winRate: safeRate(won.length, submitted.length),
    avgScore: allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : null,
    scoredCount: allScores.length,
    byPlatform: buildBreakdown(proposals, r => r.platform),
    byTone: buildBreakdown(proposals, r => r.tone || 'professional'),
    weekly: buildWeekly(proposals),
  }
}
