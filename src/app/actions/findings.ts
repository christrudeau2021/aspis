'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type FindingStatus = 'open' | 'resolved' | 'accepted_risk'

export async function updateFindingStatus(
  findingId: string,
  status: FindingStatus,
  clientId: string,
  note?: string
) {
  if (!findingId || !clientId) throw new Error('Missing required parameters')

  const supabase = createServiceClient()

  // Verify the finding actually belongs to this client before updating.
  // This prevents one client's findings from being modified via a spoofed clientId.
  const { data: finding, error: lookupError } = await supabase
    .from('findings')
    .select('id, client_id')
    .eq('id', findingId)
    .eq('client_id', clientId)   // ownership check — both must match
    .single()

  if (lookupError || !finding) throw new Error('Finding not found or access denied')

  const update: Record<string, any> = { status }
  if (status === 'resolved')      update.resolved_at = new Date().toISOString()
  if (status === 'open')          update.resolved_at = null

  const { error } = await supabase
    .from('findings')
    .update(update)
    .eq('id', findingId)
    .eq('client_id', clientId)   // double-enforce in update too

  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
}
