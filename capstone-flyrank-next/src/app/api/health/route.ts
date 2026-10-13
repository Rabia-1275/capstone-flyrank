import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const timestamp = new Date().toISOString()
  const aiConfigured = Boolean(
    process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0
  )

  let supabaseReachable = false

  try {
    const supabase = await createClient()
    // Perform a minimal, non-sensitive query to test connectivity
    const { error } = await supabase.from('profiles').select('id').limit(1)
    supabaseReachable = !error
  } catch {
    supabaseReachable = false
  }

  const appStatusOk = supabaseReachable

  return NextResponse.json(
    {
      status: appStatusOk ? 'ok' : 'degraded',
      supabase_reachable: supabaseReachable,
      ai_configured: aiConfigured,
      timestamp,
    },
    {
      status: appStatusOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  )
}
