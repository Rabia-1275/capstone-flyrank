import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import NewProposalForm from '@/components/NewProposalForm'

export default async function NewProposalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  
  const emptyProfile = !profile?.full_name || !profile?.skills || profile.skills.length < 3

  return (
    <div className="mt-8 max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">New Proposal</h1>
      <NewProposalForm emptyProfile={emptyProfile} />
    </div>
  )
}
