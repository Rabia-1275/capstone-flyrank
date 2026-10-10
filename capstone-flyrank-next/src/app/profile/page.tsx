import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import ProjectsSection from '@/components/ProjectsSection'
import ProfileCompleteness from '@/components/ProfileCompleteness'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [ { data: profile }, { data: projects } ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  ])

  return (
    <div className="mt-8 max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">Your Profile</h1>
      
      <ProfileCompleteness />
      <ProfileForm initialData={profile} />
      <ProjectsSection projects={projects || []} />
    </div>
  )
}
