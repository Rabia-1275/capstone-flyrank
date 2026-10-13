import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const saveRequestSchema = z.object({
  proposal_text: z.string()
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  const { id } = resolvedParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const result = saveRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }
  const { proposal_text } = result.data

  const { error } = await supabase
    .from('proposals')
    .update({ proposal_text })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
