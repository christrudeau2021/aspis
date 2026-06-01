'use client'

import { useState, useEffect, useTransition } from 'react'

type ScanJob = {
  id: string
  scanner: string
  status: string
  trigger: string
  started_at: string
  completed_at?: string
  findings_count?: number
  critical_count?: number
  high_count?: number
  run_url?: string
}

const JOB_STATUS: Record<string, { color: string; label: string }> = {
  queued:   { color: 'var(--text-muted)', label: 'Queued' },
  running:  { color: 'var(--blue)',       label: 'Scanning…' },
  complete: { color: 'var(--teal)',       label: 'Complete' },
  failed:   { color: '#ff8080',           label: 'Failed' },
}

export function ScanTrigger({ clientId, clientSlug }: { clientId: string; clientSlug: string }) {
  const [jobs, setJobs] = useState<ScanJob[]>([])
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [isPending, startTransition] = useTransition()

  const apiKey = process.env.NEXT_PUBLIC_ASPIS_API_KEY ?? ''
  const headers = { 'Content-Type': 'application/json', 'x-aspis-api-key': apiKey }

  async function fetchJobs() {
    const res = await fetch(`/api/clients/${clientId}/scan`, { headers })
    if (res.ok) setJobs(await res.json())
  }

  useEffect(() => {
    fetchJobs()
    // Poll every 15s if a scan is active
    const interval = setInterval(() => {
      const hasActive = jobs.some(j => j.status === 'queued' || j.status === 'running')
      if (hasActive) fetchJobs()
    }, 15_000)
    return () => clearInterval(interval)
  }, [jobs.map(j => j.status).join()])

  async function triggerScan(scanner: 'maester' | 'prowler') {
    setTriggering(true)
    setError(null)
    setSetupRequired(false)
    try {
      const res = await fetch(`/api/clients/${clientId}/scan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ scanner }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.setup_required) {
          setSetupRequired(true)
          setError(`Scan repo not found. Create github.com/christrudeau2021/${data.repo} first.`)
        } else {
          setError(data.error ?? 'Scan failed to start')
        }
      } else {
        await fetchJobs()
      }
    } finally {
      setTriggering(false)
    }
  }

  const latestJob = jobs[0]
  const isActive = latestJob?.status === 'queued' || latestJob?.status === 'running'
  const repoName = `aspis-client-${clientSlug}`

  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 4 }}>Run Security Scan</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>github.com/christrudeau2021/{repoName}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => triggerScan('maester')} disabled={triggering || isActive} style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
            padding: '10px 20px', borderRadius: 8, cursor: triggering || isActive ? 'not-allowed' : 'pointer',
            background: 'var(--grad-brand)', color: '#fff', border: 'none',
            boxShadow: '0 4px 16px rgba(59,158,255,0.25)',
            opacity: triggering || isActive ? 0.5 : 1, transition: 'opacity 0.2s',
          }}>
            {triggering ? 'Starting…' : '▶ Scan M365'}
          </button>
          <button onClick={() => triggerScan('prowler')} disabled={triggering || isActive} style={{
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
            padding: '10px 20px', borderRadius: 8, cursor: triggering || isActive ? 'not-allowed' : 'pointer',
            background: 'rgba(59,158,255,0.08)', color: 'var(--blue)',
            border: '1px solid rgba(59,158,255,0.2)',
            opacity: triggering || isActive ? 0.5 : 1, transition: 'opacity 0.2s',
          }}>
            {triggering ? 'Starting…' : '▶ Scan Azure'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 12, background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#ff8080' }}>
          {error}
          {setupRequired && (
            <div style={{ marginTop: 6 }}>
              <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Create repo on GitHub →
              </a>
              {' '}then copy workflow files from the aspis repo.
            </div>
          )}
        </div>
      )}

      {/* Scan history */}
      {jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.slice(0, 3).map(job => {
            const s = JOB_STATUS[job.status] ?? JOB_STATUS.failed
            const elapsed = job.completed_at
              ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 60000)}m`
              : isActive && job.id === latestJob?.id ? 'running…' : ''
            return (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: job.status === 'running' ? `0 0 8px ${s.color}` : 'none' }} />
                <span style={{ color: s.color, width: 70 }}>{s.label}</span>
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{job.scanner}</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(job.started_at).toLocaleDateString()}</span>
                {elapsed && <span style={{ color: 'var(--text-muted)' }}>{elapsed}</span>}
                {job.findings_count != null && job.status === 'complete' && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {job.findings_count} findings
                    {(job.critical_count ?? 0) > 0 && <span style={{ color: '#ff8080', marginLeft: 6 }}>· {job.critical_count} critical</span>}
                  </span>
                )}
                {job.run_url && (
                  <a href={job.run_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', marginLeft: 'auto', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    View logs →
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {jobs.length === 0 && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          No scans yet. Click Scan M365 to run the first scan.
        </p>
      )}
    </div>
  )
}
