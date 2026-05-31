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
  const supabase = createServiceClient()

  const update: Record<string, any> = { status }
  if (status === 'resolved') update.resolved_at = new Date().toISOString()

  const { error } = await supabase
    .from('findings')
    .update(update)
    .eq('id', findingId)

  if (error) throw new Error(error.message)
  revalidatePath(`/clients/${clientId}`)
}
