'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const full_name = formData.get('full_name') as string
  const headline = formData.get('headline') as string
  const tone = formData.get('tone') as string
  
  const skills = JSON.parse(formData.get('skills') as string || '[]')
  const portfolio_links = JSON.parse(formData.get('portfolio_links') as string || '[]')

  if (!full_name) return { error: 'Full name is required' }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name,
      headline,
      tone,
      skills,
      portfolio_links
    })

  if (error) return { error: error.message }
  
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveProject(formData: FormData, projectId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const link = formData.get('link') as string

  if (!title) return { error: 'Title is required' }

  const projectData = {
    user_id: user.id,
    title,
    description,
    link
  }

  let error;
  if (projectId) {
    const res = await supabase.from('projects').update(projectData).eq('id', projectId).eq('user_id', user.id)
    error = res.error
  } else {
    const res = await supabase.from('projects').insert(projectData)
    error = res.error
  }

  if (error) return { error: error.message }
  
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
