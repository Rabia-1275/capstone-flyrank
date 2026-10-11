import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProposalsList from '@/components/ProposalsList'

export const metadata = {
  title: 'Proposals | ProposalAI',
  description: 'View and manage your generated proposals and job applications.',
}

export default async function ProposalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="py-6">
      <ProposalsList />
    </div>
  )
}
