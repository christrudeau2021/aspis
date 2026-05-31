import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorized(req: NextRequest) {
  return req.headers.get('x-aspis-api-key') === process.env.ASPIS_API_KEY
}

// PATCH /api/clients/[id]/setup — mark an onboarding step complete
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const step_key = typeof body.step_key === 'string' ? body.step_key.trim() : null
  if (!step_key) return NextResponse.json({ error: 'Missing step_key' }, { status: 400 })

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('onboarding_steps')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('client_id', id)
    .eq('step_key', step_key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if all required steps are now complete — if so mark client onboarding done
  const { data: steps } = await supabase
    .from('onboarding_steps')
    .select('required, completed')
    .eq('client_id', id)

  const allDone = steps?.every(s => !s.required || s.completed) ?? false
  if (allDone) {
    await supabase.from('clients').update({ onboarding_complete: true }).eq('id', id)
  }

  return NextResponse.json({ ok: true, onboarding_complete: allDone })
}
