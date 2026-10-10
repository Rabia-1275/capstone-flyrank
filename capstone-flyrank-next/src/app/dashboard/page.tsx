import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileCompleteness from '@/components/ProfileCompleteness'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mt-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-[var(--muted)] mb-8">Welcome back, {user.email}</p>
      
      <ProfileCompleteness />
    </div>
  )
}

