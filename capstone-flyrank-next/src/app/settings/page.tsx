import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'

export const metadata = {
  title: 'Settings - ProposalAI',
  description: 'Manage your ProposalAI account preferences and proposal defaults.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_tone, default_length, tone')
    .eq('id', user.id)
    .maybeSingle()

  const initialTone =
    profile?.default_tone || profile?.tone || 'professional'
  const initialLength = profile?.default_length || 'medium'

  return (
    <div className="mt-8 max-w-4xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your account, proposal generator defaults, and workspace data.
        </p>
      </div>

      <SettingsForm
        email={user.email || 'No email attached'}
        initialTone={initialTone}
        initialLength={initialLength}
      />
    </div>
  )
}
