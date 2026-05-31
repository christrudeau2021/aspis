import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { computePosture } from '@/lib/posture'
import { FindingsTable } from '@/components/FindingsTable'

export const dynamic = 'force-dynamic'

const SEVERITY_COLORS: Record<string, string> = {
  critical:      'bg-red-900/50 text-red-300 border-red-800',
  high:          'bg-orange-900/50 text-orange-300 border-orange-800',
  medium:        'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  low:           'bg-blue-900/50 text-blue-300 border-blue-800',
  informational: 'bg-gray-800 text-gray-400 border-gray-700',
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: client }, { data: allFindings }, { data: onboarding }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('findings').select('*').eq('client_id', id).order('severity').order('status'),
    supabase.from('onboarding_steps').select('*').eq('client_id', id),
  ])

  if (!client) notFound()

  const findings = allFindings ?? []
  const openFindings = findings.filter(f => f.status === 'open')
  const posture = computePosture(findings)

  const onboardingComplete = onboarding?.every(s => !s.required || s.completed) ?? false
  const pendingSteps = onboarding?.filter(s => s.required && !s.completed) ?? []

  const bySeverity = openFindings.reduce((acc: Record<string, number>, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})

  const setupLinks: Record<string, string> = {
    connect_m365:       `/clients/${id}/setup/m365`,
    connect_azure:      `/clients/${id}/setup/azure`,
    connect_salesforce: `/clients/${id}/setup/salesforce`,
  }

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
            <p className="text-gray-500 text-sm mt-0.5">
              {client.industry} · {client.employee_count} employees · {client.tier}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(client.modules as string[]).map((m: string) => (
              <span key={m} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Posture score + severity summary */}
        <div className="grid grid-cols-6 gap-3 mb-6">

          {/* Grade card */}
          <div className={`col-span-1 border rounded-xl p-4 flex flex-col items-center justify-center ${posture.bg} ${posture.border}`}>
            <div className={`text-4xl font-black ${posture.color}`}>{posture.grade}</div>
            <div className="text-xs text-gray-500 mt-1">Posture</div>
            <div className={`text-xs font-medium mt-0.5 ${posture.color}`}>{posture.label}</div>
          </div>

          {/* Severity breakdown */}
          {(['critical', 'high', 'medium', 'low', 'informational'] as const).map(sev => (
            <div key={sev} className={`border rounded-xl p-3 ${SEVERITY_COLORS[sev]}`}>
              <div className="text-2xl font-bold">{bySeverity[sev] ?? 0}</div>
              <div className="text-xs capitalize">{sev}</div>
            </div>
          ))}
        </div>

        {/* Onboarding banner */}
        {!onboardingComplete && pendingSteps.length > 0 && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6">
            <div className="text-sm font-medium text-blue-300 mb-3">Complete setup to activate scanning</div>
            <div className="space-y-2">
              {pendingSteps.map((s: any) => (
                <div key={s.step_key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <span className="w-4 h-4 border border-blue-600 rounded shrink-0" />
                    {s.title}
                  </div>
                  {setupLinks[s.step_key] && (
                    <Link
                      href={setupLinks[s.step_key]}
                      className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Configure →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Findings table with remediation */}
        {!onboardingComplete && findings.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-12 text-gray-500 text-sm">
            Complete setup above to activate scanning.
          </div>
        ) : (
          <FindingsTable findings={findings} clientId={id} />
        )}

      </div>
    </div>
  )
}
