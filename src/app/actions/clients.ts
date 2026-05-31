'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const VALID_TIERS    = ['starter', 'business', 'managed'] as const
const VALID_MODULES  = ['posture', 'ttx', 'awareness', 'threat-hunting'] as const

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function createClient(formData: {
  name: string
  industry: string
  employee_count: number
  tier: string
  modules: string[]
  connections: { m365: boolean; azure: boolean; salesforce: boolean }
}) {
  const name           = formData.name.trim().slice(0, 255)
  const industry       = formData.industry.trim().slice(0, 255)
  const employee_count = Number.isInteger(formData.employee_count) ? formData.employee_count : null
  const tier           = VALID_TIERS.includes(formData.tier as any) ? formData.tier : 'starter'
  const modules        = (formData.modules ?? []).filter(m => VALID_MODULES.includes(m as any))

  if (!name || !industry) throw new Error('Missing required fields')

  const supabase = createServiceClient()
  const slug     = slugify(name)

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ name, slug, industry, employee_count, tier, modules: modules.length ? modules : ['posture'] })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const { m365, azure, salesforce } = formData.connections ?? {}
  const steps = [
    { step_key: 'profile',            title: 'Client profile created',   required: true,        completed: true  },
    { step_key: 'connect_m365',       title: 'Connect Microsoft 365',    required: !!m365,      completed: false },
    { step_key: 'connect_azure',      title: 'Connect Azure',            required: !!azure,     completed: false },
    { step_key: 'connect_salesforce', title: 'Connect Salesforce',       required: !!salesforce,completed: false },
    { step_key: 'first_scan',         title: 'First scan complete',      required: true,        completed: false },
    { step_key: 'review_findings',    title: 'Review critical findings', required: true,        completed: false },
  ].map(s => ({ ...s, client_id: client.id }))

  await supabase.from('onboarding_steps').insert(steps)

  redirect(`/clients/${client.id}`)
}
