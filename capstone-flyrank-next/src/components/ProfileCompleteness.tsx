import { createClient } from '@/utils/supabase/server'

export default async function ProfileCompleteness() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const [ { data: profile }, { data: projects } ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('id').eq('user_id', user.id)
  ])

  let score = 0
  const maxScore = 4 // name, headline, 3+ skills, 1+ project

  if (profile) {
    if (profile.full_name) score += 1
    if (profile.headline) score += 1
    if (profile.skills && profile.skills.length >= 3) score += 1
  }
  
  if (projects && projects.length >= 1) {
    score += 1
  }

  const percentage = Math.round((score / maxScore) * 100)

  return (
    <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-[var(--radius)] bg-[var(--background)] shadow-sm mb-6">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Profile Completeness</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-[var(--primary)] h-2.5 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
      <span className="text-sm font-bold text-[var(--primary)]">{percentage}%</span>
    </div>
  )
}
