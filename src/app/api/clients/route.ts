import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VALID_TIERS = ['starter', 'business', 'managed'] as const
const VALID_MODULES = ['posture', 'ttx', 'awareness', 'threat-hunting'] as const

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function isAuthorized(req: NextRequest) {
  const key = req.headers.get('x-aspis-api-key')
  return key === process.env.ASPIS_API_KEY
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, scan_jobs(id, status, completed_at, critical_count, high_count)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Input validation
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 255) : null
  const industry = typeof body.industry === 'string' ? body.industry.trim().slice(0, 255) : null
  const employee_count = Number.isInteger(body.employee_count) && body.employee_count > 0 ? body.employee_count : null
  const tier = VALID_TIERS.includes(body.tier) ? body.tier : null
  const modules: string[] = Array.isArray(body.modules)
    ? body.modules.filter((m: any) => VALID_MODULES.includes(m))
    : ['posture']

  if (!name || !industry || !tier) {
    return NextResponse.json({ error: 'Missing required fields: name, industry, tier' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const slug = slugify(name)

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ name, slug, industry, employee_count, tier, modules })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed onboarding checklist
  const connections = body.connections ?? {}
  const steps = [
    { step_key: 'profile',            title: 'Client profile created',    required: true,                         completed: true  },
    { step_key: 'connect_m365',       title: 'Connect Microsoft 365',     required: !!connections.m365,           completed: false },
    { step_key: 'connect_azure',      title: 'Connect Azure',             required: !!connections.azure,          completed: false },
    { step_key: 'connect_salesforce', title: 'Connect Salesforce',        required: !!connections.salesforce,     completed: false },
    { step_key: 'first_scan',         title: 'First scan complete',       required: true,                         completed: false },
    { step_key: 'review_findings',    title: 'Review critical findings',  required: true,                         completed: false },
  ].map(s => ({ ...s, client_id: client.id }))

  await supabase.from('onboarding_steps').insert(steps)

  return NextResponse.json(client, { status: 201 })
}
