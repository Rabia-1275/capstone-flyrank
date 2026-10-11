import { createClient } from '@/utils/supabase/server'
import HealthDashboard, { HealthData } from '@/components/HealthDashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Health & Status - ProposalAI',
  description: 'Public health status and connectivity overview for ProposalAI.',
}

export default async function HealthPage() {
  const timestamp = new Date().toISOString()
  const aiConfigured = Boolean(
    process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0
  )

  let supabaseReachable = false
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    supabaseReachable = !error
  } catch {
    supabaseReachable = false
  }

  const initialData: HealthData = {
    status: supabaseReachable ? 'ok' : 'degraded',
    supabase_reachable: supabaseReachable,
    ai_configured: aiConfigured,
    timestamp,
  }

  return (
    <div className="mt-8 max-w-4xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          System Health
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Public live status monitor for core services, database connectivity, and AI integration.
        </p>
      </div>

      <HealthDashboard initialData={initialData} />
    </div>
  )
}