import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateProposalStream } from '@/lib/ai'
import { z } from 'zod'

const generateRequestSchema = z.object({
  tone: z.string(),
  length: z.enum(['short', 'medium', 'long'])
})

export async function POST(request: Request, context: any) {
  const resolvedParams = await context.params
  const { id } = resolvedParams
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const result = generateRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }
    const { tone, length } = result.data

    // Fetch the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Fetch user profile and projects
    const [ { data: profile }, { data: projects } ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', user.id)
    ])

    const groqStream = await generateProposalStream({
      jobText: proposal.job_text,
      platform: proposal.platform,
      tone,
      length,
      profile: profile || {},
      projects: projects || [],
      analysis: proposal.analysis
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = ''
        const startTime = Date.now()
        let finishReason: string | null = null
        let errored = false

        try {
          for await (const chunk of groqStream) {
            const choice = chunk.choices?.[0]
            if (choice?.finish_reason) {
              finishReason = choice.finish_reason
            }
            const text = choice?.delta?.content
            if (text) {
              fullText += text
              controller.enqueue(encoder.encode(text))
            }
          }

          const elapsed = Date.now() - startTime
          console.log(`[Generate] ${elapsed}ms, chars=${fullText.length}, finish=${finishReason}`)

          if (fullText.trim().length > 0) {
            const { error: updateError } = await supabase
              .from('proposals')
              .update({ proposal_text: fullText })
              .eq('id', id)
              .eq('user_id', user.id)

            if (updateError) {
              console.error('[Generate] Update error:', updateError.message)
            }
          }
        } catch (e: any) {
          errored = true
          console.error(`[Generate] Stream error after ${Date.now() - startTime}ms:`, e?.name, e?.message)
          controller.error(e)
        } finally {
          if (!errored) {
            controller.close()
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform'
      }
    })

  } catch (error: any) {
    console.error('API /generate error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
