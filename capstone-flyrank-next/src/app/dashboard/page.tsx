import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCompleteness from '@/components/ProfileCompleteness'
import DashboardContent from '@/components/DashboardContent'
import { aggregateDashboard } from '@/lib/dashboard'
import type { ProposalRow } from '@/lib/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load all user proposals (RLS-scoped by user_id)
  const { data: proposals, error } = await supabase
    .from('proposals')
    .select('id, platform, tone, status, score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="mt-10 max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const rows: ProposalRow[] = (proposals ?? []).map((p) => ({
    id: p.id as string,
    platform: (p.platform as string) || 'custom',
    tone: (p.tone as string) || 'professional',
    status: (p.status as string) || 'draft',
    score: p.score as ProposalRow['score'],
    created_at: p.created_at as string,
  }))

  const data = aggregateDashboard(rows)

  return (
    <div className="mt-10 max-w-5xl mx-auto px-4 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-[var(--muted)] mt-1">Welcome back, {user.email}</p>
      </div>

      <ProfileCompleteness />

      <DashboardContent data={data} />
    </div>
  )
}
