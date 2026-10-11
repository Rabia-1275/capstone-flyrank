import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { analyzeJob } from '@/lib/ai'
import { z } from 'zod'

const analyzeRequestSchema = z.object({
  jobText: z.string().min(50, 'Job description must be at least 50 characters').max(8000, 'Job description too long'),
  platform: z.enum(['upwork', 'fiverr', 'freelancer', 'peopleperhour'])
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = analyzeRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { jobText, platform } = result.data

    // Check rate limit: max 10 proposals in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if (countError) throw countError
    if (count !== null && count >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded: You have created too many proposals recently.' }, { status: 429 })
    }

    // Fetch user profile and projects
    const [ { data: profile }, { data: projectsResult } ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', user.id)
    ])
    const projects = projectsResult || []

    // Call Groq
    const analysis = await analyzeJob({
      jobText,
      platform,
      profile: profile || {},
      projects: projects || []
    })

    // Insert into proposals
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        user_id: user.id,
        platform,
        tone: profile?.default_tone || profile?.tone || 'professional',
        job_text: jobText,
        analysis,
        status: 'draft'
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: proposal.id, analysis })

  } catch (error: unknown) {
    console.error('API /analyze error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
