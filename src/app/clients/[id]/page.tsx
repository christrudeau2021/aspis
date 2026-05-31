import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-800',
  high: 'bg-orange-900/50 text-orange-300 border-orange-800',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  low: 'bg-blue-900/50 text-blue-300 border-blue-800',
  informational: 'bg-gray-800 text-gray-400 border-gray-700',
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: client }, { data: findings }, { data: onboarding }] = await Promise.all([
    supabase.from('clients').select('*, scan_jobs(*)').eq('id', id).single(),
    supabase.from('findings').select('*').eq('client_id', id).eq('status', 'open').order('severity'),
    supabase.from('onboarding_steps').select('*').eq('client_id', id),
  ])

  if (!client) notFound()

  const onboardingComplete = onboarding?.every(s => !s.required || s.completed) ?? false
  const pendingSteps = onboarding?.filter(s => s.required && !s.completed) ?? []

  const bySeverity = (findings ?? []).reduce((acc: Record<string, number>, f: any) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-300">{client.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <p className="text-gray-500 text-sm">{client.industry} · {client.employee_count} employees · {client.tier}</p>
          </div>
          <div className="flex gap-2">
            {(client.modules as string[]).map((m: string) => (
              <span key={m} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded">{m}</span>
            ))}
          </div>
        </div>

        {/* Onboarding banner */}
        {!onboardingComplete && pendingSteps.length > 0 && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6">
            <div className="text-sm font-medium text-blue-300 mb-2">Complete setup to activate scanning</div>
            <div className="space-y-1">
              {pendingSteps.map((s: any) => (
                <div key={s.step_key} className="flex items-center gap-2 text-sm text-blue-400">
                  <span className="w-4 h-4 border border-blue-600 rounded" />
                  {s.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Severity summary */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {['critical', 'high', 'medium', 'low', 'informational'].map(sev => (
            <div key={sev} className={`border rounded-lg p-3 ${SEVERITY_COLORS[sev]}`}>
              <div className="text-2xl font-bold">{bySeverity[sev] ?? 0}</div>
              <div className="text-xs capitalize">{sev}</div>
            </div>
          ))}
        </div>

        {/* Findings table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Open findings ({findings?.length ?? 0})</h2>
          </div>

          {!findings || findings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No open findings. {onboardingComplete ? 'Waiting for first scan.' : 'Complete setup to start scanning.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {findings.map((f: any) => (
                <div key={f.id} className="px-4 py-3 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[f.severity]}`}>
                          {f.severity}
                        </span>
                        <span className="text-xs text-gray-500">{f.service}</span>
                        <span className="text-xs text-gray-600">{f.check_id}</span>
                      </div>
                      <div className="text-sm text-white">{f.title}</div>
                      {f.remediation && (
                        <div className="text-xs text-gray-500 mt-1 truncate">{f.remediation}</div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(f.compliance_frameworks as string[]).slice(0, 2).map((fw: string) => (
                        <span key={fw} className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">{fw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
