import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { scoreProposal } from '@/lib/ai'
import crypto from 'crypto'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  const { id } = resolvedParams

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      body = {}
    }

    const force = Boolean(body?.force)

    // Load proposal with RLS
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const proposalText = (typeof body?.proposal_text === 'string' && body.proposal_text.trim()
      ? body.proposal_text
      : proposal.proposal_text) || ''

    if (!proposalText.trim()) {
      return NextResponse.json({ error: 'Proposal text cannot be empty to score' }, { status: 400 })
    }

    const textHash = crypto.createHash('sha256').update(proposalText.trim()).digest('hex')

    // If score already exists with matching text hash and force is false, return cached score
    if (!force && proposal.score && typeof proposal.score === 'object') {
      if (proposal.score.text_hash === textHash) {
        return NextResponse.json(proposal.score)
      }
    }

    // Load profile and projects
    const [ { data: profile }, { data: projects } ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', user.id)
    ])

    const startTime = Date.now()
    const result = await scoreProposal({
      jobText: proposal.job_text,
      proposalText,
      profile: profile || {},
      projects: projects || [],
      analysis: proposal.analysis
    })

    const elapsed = Date.now() - startTime
    console.log(`[Score] ${elapsed}ms, overall=${result.overall}`)

    const scoredData = {
      ...result,
      text_hash: textHash,
      scored_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('proposals')
      .update({ score: scoredData })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Score Route] Failed to update proposal score:', updateError.message)
    }

    return NextResponse.json(scoredData)

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; status?: number; code?: string }
    console.error('[Score Route] Error:', err?.name, err?.message)
    if (err?.status === 429 || err?.message?.includes('Rate limit')) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment before trying again.' }, { status: 429 })
    }
    if (err?.status === 401 || err?.status === 403 || err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication error. Please check your AI API credentials.' }, { status: 401 })
    }
    if (err?.message?.includes('timed out') || err?.code === 'ETIMEDOUT') {
      return NextResponse.json({ error: 'Request timed out. Please try again.' }, { status: 504 })
    }
    if (err?.message?.includes('parse AI response') || err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Failed to parse AI scoring response. Please try again.' }, { status: 502 })
    }
    return NextResponse.json({ error: err?.message || 'Failed to score proposal' }, { status: 500 })
  }
}
