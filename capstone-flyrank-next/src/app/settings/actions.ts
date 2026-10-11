'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const default_tone = (formData.get('default_tone') as string) || 'professional'
  const default_length = (formData.get('default_length') as string) || 'medium'

  const validTones = ['professional', 'friendly', 'confident', 'concise']
  const validLengths = ['short', 'medium', 'long']

  if (!validTones.includes(default_tone)) {
    return { error: 'Invalid tone selected' }
  }

  if (!validLengths.includes(default_length)) {
    return { error: 'Invalid length selected' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      default_tone,
      default_length,
      tone: default_tone
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteAllProposals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error, count } = await supabase
    .from('proposals')
    .delete({ count: 'exact' })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/proposals')
  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { success: true, count: count ?? 0 }
}
