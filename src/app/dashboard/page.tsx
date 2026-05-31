import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getClients() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('clients')
    .select(`
      id, name, industry, tier, onboarding_complete, modules,
      scan_jobs(id, status, completed_at, critical_count, high_count, created_at)
    `)
    .order('created_at', { ascending: false })
  return data ?? []
}

async function getStats() {
  const supabase = createServiceClient()
  const [{ count: clientCount }, { count: openFindings }, { count: critical }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('findings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('findings').select('*', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'critical'),
  ])
  return { clientCount: clientCount ?? 0, openFindings: openFindings ?? 0, critical: critical ?? 0 }
}

const TIER_COLORS: Record<string, string> = {
  starter: 'bg-gray-800 text-gray-400',
  business: 'bg-blue-900 text-blue-300',
  managed: 'bg-purple-900 text-purple-300',
}

export default async function DashboardPage() {
  const [clients, stats] = await Promise.all([getClients(), getStats()])

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Aspis</h1>
            <p className="text-gray-500 text-sm">Security posture dashboard</p>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors"
          >
            + Add client
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active clients', value: stats.clientCount },
            { label: 'Open findings', value: stats.openFindings },
            { label: 'Critical', value: stats.critical, alert: stats.critical > 0 },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.alert ? 'border-red-800 bg-red-950/20' : 'border-gray-800 bg-gray-900'}`}>
              <div className={`text-3xl font-bold ${s.alert ? 'text-red-400' : 'text-white'}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Client list */}
        {clients.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500 mb-4">No clients yet.</p>
            <Link href="/onboarding" className="text-blue-400 hover:text-blue-300 text-sm">Add your first client →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client: any) => {
              const latestScan = client.scan_jobs?.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
              const hasActiveScan = latestScan?.status === 'running' || latestScan?.status === 'queued'

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.industry}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {latestScan?.critical_count > 0 && (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded font-medium">
                        {latestScan.critical_count} critical
                      </span>
                    )}
                    {hasActiveScan && (
                      <span className="text-xs text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        Scanning
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${TIER_COLORS[client.tier]}`}>
                      {client.tier}
                    </span>
                    <div className="flex gap-1">
                      {(client.modules as string[]).map((m: string) => (
                        <span key={m} className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
