import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProposalEditor from '@/components/ProposalEditor'

import ProposalStatusSelect from '@/components/ProposalStatusSelect'
import { formatPlatformName } from '@/lib/format'

export const metadata = {
  title: 'Proposal Details',
  description: 'View, edit, regenerate, and score your tailored freelance proposal.',
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load the proposal (must belong to user)
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, user_id, platform, tone, job_text, analysis, proposal_text, score, status, created_at')
    .eq('id', resolvedParams.id)
    .eq('user_id', user.id)
    .single()

  if (proposalError) {
    console.error('Error fetching proposal (server):', proposalError.message)
    throw new Error('Failed to load proposal')
  }
  if (!proposal) {
    notFound()
  }

  // Load profile & projects for controls / generation
  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('*').eq('user_id', user.id)
  ])

  const initialTone = proposal.tone || profile?.default_tone || profile?.tone || 'professional'
  const initialLength = (['short', 'medium', 'long'].includes(profile?.default_length) ? profile.default_length : 'medium') as 'short' | 'medium' | 'long'

  return (
    <div className="mt-8 max-w-4xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Proposal</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {formatPlatformName(proposal.platform)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">Status:</span>
          <ProposalStatusSelect
            proposalId={proposal.id}
            currentStatus={proposal.status || 'draft'}
          />
        </div>
      </div>
      <ProposalEditor
        proposalId={proposal.id}
        initialText={proposal.proposal_text || ''}
        analysis={proposal.analysis}
        initialTone={initialTone}
        initialLength={initialLength}
        profile={profile}
        projects={projects || []}
        initialScore={proposal.score}
      />
    </div>
  )
}
