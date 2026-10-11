import { SupabaseClient } from '@supabase/supabase-js'

export type AIUsageKind = 'analyze' | 'generate' | 'score'

export type UsageCheckResult =
  | { allowed: true }
  | { allowed: false; message: string; retryAfterSeconds: number; resetTime: string }

interface LimitConfig {
  defaultLimit: number
  windowMs: number
  envVar: string
  label: string
  windowLabel: string
}

const LIMIT_CONFIGS: Record<AIUsageKind, LimitConfig> = {
  analyze: {
    defaultLimit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    envVar: 'AI_LIMIT_ANALYZE_PER_HOUR',
    label: 'job analysis',
    windowLabel: 'hour',
  },
  generate: {
    defaultLimit: 30,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    envVar: 'AI_LIMIT_GENERATE_PER_DAY',
    label: 'proposal generation',
    windowLabel: 'day',
  },
  score: {
    defaultLimit: 30,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    envVar: 'AI_LIMIT_SCORE_PER_DAY',
    label: 'proposal scoring',
    windowLabel: 'day',
  },
}

function getLimit(kind: AIUsageKind): number {
  const config = LIMIT_CONFIGS[kind]
  const envVal = process.env[config.envVar]
  if (envVal) {
    const parsed = parseInt(envVal, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return config.defaultLimit
}

function formatRelativeTime(seconds: number): string {
  if (seconds <= 60) {
    return 'in less than a minute'
  }
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  const hours = Math.ceil(minutes / 60)
  return `in ${hours} hour${hours === 1 ? '' : 's'}`
}

/**
 * Checks usage against rolling quotas and records usage if the request is accepted.
 */
export async function checkAndRecordUsage(
  supabase: SupabaseClient,
  userId: string,
  kind: AIUsageKind
): Promise<UsageCheckResult> {
  const config = LIMIT_CONFIGS[kind]
  const limit = getLimit(kind)
  const now = Date.now()
  const windowStart = new Date(now - config.windowMs).toISOString()

  // Query events in current sliding window, oldest first
  const { data: usageEvents, error: countError } = await supabase
    .from('ai_usage')
    .select('created_at')
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: true })

  if (countError) {
    // If the table doesn't exist yet or query fails, fail open to avoid blocking users
    // but log a warning
    console.error('[AI Usage] Error querying quota:', countError.message)
    return { allowed: true }
  }

  const currentCount = usageEvents ? usageEvents.length : 0

  if (currentCount >= limit) {
    // Determine when the earliest request in the window expires
    const oldestEventTime = usageEvents[0]?.created_at
      ? new Date(usageEvents[0].created_at).getTime()
      : now - config.windowMs

    const resetTimestamp = oldestEventTime + config.windowMs
    const diffMs = Math.max(resetTimestamp - now, 1000)
    const retryAfterSeconds = Math.ceil(diffMs / 1000)
    const resetDate = new Date(resetTimestamp)
    const relativeTime = formatRelativeTime(retryAfterSeconds)
    const timeFormatted = resetDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

    const message = `Rate limit exceeded: You have reached the limit of ${limit} ${config.label} requests per ${config.windowLabel}. Your quota resets ${relativeTime} (around ${timeFormatted}).`

    return {
      allowed: false,
      message,
      retryAfterSeconds,
      resetTime: resetDate.toISOString(),
    }
  }

  // Request is accepted: record this usage event
  const { error: insertError } = await supabase.from('ai_usage').insert({
    user_id: userId,
    kind,
  })

  if (insertError) {
    console.error('[AI Usage] Failed to record usage:', insertError.message)
    // Non-blocking for accepted request
  }

  return { allowed: true }
}
