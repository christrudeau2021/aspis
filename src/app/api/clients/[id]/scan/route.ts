import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorized(req: NextRequest) {
  return req.headers.get('x-aspis-api-key') === process.env.ASPIS_API_KEY
}

const GITHUB_OWNER = process.env.GITHUB_OWNER ?? 'christrudeau2021'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// POST /api/clients/[id]/scan
// Body: { scanner: 'maester' | 'prowler', workflow?: 'scan-m365' | 'scan-cloud' }
// Dispatches a GitHub Actions workflow on the client's scan repo.
// Repo naming convention: aspis-client-{slug}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!GITHUB_TOKEN)      return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const scanner  = body.scanner  === 'prowler' ? 'prowler' : 'maester'
  const workflow = scanner === 'prowler' ? 'scan-cloud.yml' : 'scan-m365.yml'

  const supabase = createServiceClient()

  // Look up the client to get slug + confirm it exists
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, slug')
    .eq('id', id)
    .single()

  if (clientError || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const repo = `aspis-client-${client.slug}`

  // Register the scan job in Supabase before dispatching
  const { data: job, error: jobError } = await supabase
    .from('scan_jobs')
    .insert({
      client_id:  id,
      scanner,
      status:     'queued',
      trigger:    'manual',
      started_at: new Date().toISOString(),
      run_url:    `https://github.com/${GITHUB_OWNER}/${repo}/actions`,
    })
    .select()
    .single()

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  // Dispatch the GitHub Actions workflow
  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          client_id: id,
          trigger:   'manual',
        },
      }),
    }
  )

  if (!ghRes.ok) {
    const ghErr = await ghRes.text()

    // If dispatch fails, mark the job as failed
    await supabase
      .from('scan_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', job.id)

    // 404 = repo doesn't exist yet — give a clear message
    if (ghRes.status === 404) {
      return NextResponse.json({
        error: `Scan repo not found: github.com/${GITHUB_OWNER}/${repo}. Create it and add workflow files first.`,
        setup_required: true,
        repo,
      }, { status: 404 })
    }

    return NextResponse.json({ error: `GitHub dispatch failed: ${ghErr}` }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    job_id:  job.id,
    scanner,
    repo,
    message: `Scan queued on ${repo}. Results will appear here in 3–8 minutes.`,
  })
}

// GET /api/clients/[id]/scan — returns latest scan job status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { data: jobs } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json(jobs ?? [])
}
