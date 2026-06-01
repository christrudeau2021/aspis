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

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  queued:   { dot: 'bg-gray-400 animate-pulse',  label: 'Queued',    text: 'text-gray-400' },
  running:  { dot: 'bg-blue-400 animate-pulse',  label: 'Scanning…', text: 'text-blue-400' },
  complete: { dot: 'bg-green-400',               label: 'Complete',  text: 'text-green-400' },
  failed:   { dot: 'bg-red-400',                 label: 'Failed',    text: 'text-red-400' },
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-white">Run Security Scan</div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono">github.com/christrudeau2021/{repoName}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => triggerScan('maester')}
            disabled={triggering || isActive}
            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {triggering ? 'Starting…' : '▶ Scan M365'}
          </button>
          <button
            onClick={() => triggerScan('prowler')}
            disabled={triggering || isActive}
            className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {triggering ? 'Starting…' : '▶ Scan Azure'}
          </button>
        </div>
      </div>

      {/* Error / setup required */}
      {error && (
        <div className="mb-3 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-300">
          {error}
          {setupRequired && (
            <div className="mt-1 text-red-400">
              <a
                href={`https://github.com/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Create repo on GitHub →
              </a>
              {' '}then copy workflow files from the aspis repo.
            </div>
          )}
        </div>
      )}

      {/* Scan history */}
      {jobs.length > 0 && (
        <div className="space-y-1.5">
          {jobs.slice(0, 3).map(job => {
            const s = STATUS_STYLES[job.status] ?? STATUS_STYLES.failed
            const elapsed = job.completed_at
              ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 60000)}m`
              : isActive && job.id === latestJob?.id ? 'running…' : ''
            return (
              <div key={job.id} className="flex items-center gap-3 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                <span className={`font-medium w-16 ${s.text}`}>{s.label}</span>
                <span className="text-gray-500 capitalize">{job.scanner}</span>
                <span className="text-gray-600">{new Date(job.started_at).toLocaleDateString()}</span>
                {elapsed && <span className="text-gray-600">{elapsed}</span>}
                {job.findings_count != null && job.status === 'complete' && (
                  <span className="text-gray-500">
                    {job.findings_count} findings
                    {(job.critical_count ?? 0) > 0 && (
                      <span className="text-red-400 ml-1">· {job.critical_count} critical</span>
                    )}
                  </span>
                )}
                {job.run_url && (
                  <a
                    href={job.run_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-400 ml-auto"
                  >
                    View logs →
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {jobs.length === 0 && (
        <p className="text-xs text-gray-600">No scans yet. Click Scan M365 to run the first scan.</p>
      )}
    </div>
  )
}
