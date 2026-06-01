import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { approximatePosture } from '@/lib/posture'

export const dynamic = 'force-dynamic'

const TIER_STYLES: Record<string, { bg: string; color: string }> = {
  starter:  { bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' },
  business: { bg: 'rgba(59,158,255,0.1)',   color: 'var(--blue)' },
  managed:  { bg: 'rgba(0,212,160,0.1)',    color: 'var(--teal)' },
}

async function getData() {
  const supabase = createServiceClient()
  const [{ data: clients }, { count: openFindings }, { count: critical }] = await Promise.all([
    supabase
      .from('clients')
      .select(`id, name, slug, industry, tier, onboarding_complete, modules,
        scan_jobs(id, status, completed_at, critical_count, high_count, created_at)`)
      .order('created_at', { ascending: false }),
    supabase.from('findings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('findings').select('*', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'critical'),
  ])
  return { clients: clients ?? [], openFindings: openFindings ?? 0, critical: critical ?? 0 }
}

export default async function DashboardPage() {
  const { clients, openFindings, critical } = await getData()

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 6 }}>
              CyberShield Technologies
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '2rem', color: 'var(--text-primary)', lineHeight: 1.15 }}>
              Aspis
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 2 }}>Security posture dashboard</p>
          </div>
          <Link href="/onboarding" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--grad-brand)', color: '#fff',
            padding: '11px 22px', borderRadius: 8, fontWeight: 600,
            fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
            boxShadow: '0 4px 20px rgba(59,158,255,0.25)',
          }}>
            + Add client
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active clients',  value: clients.length,  alert: false },
            { label: 'Open findings',   value: openFindings,    alert: false },
            { label: 'Critical',        value: critical,        alert: critical > 0 },
          ].map(s => (
            <div key={s.label} style={{
              background: s.alert ? 'rgba(255,60,60,0.06)' : 'var(--ink-2)',
              border: `1px solid ${s.alert ? 'rgba(255,80,80,0.25)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
            }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: s.alert ? '#ff6b6b' : 'var(--text-primary)', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Client list */}
        {clients.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No clients yet.</p>
            <Link href="/onboarding" style={{ color: 'var(--blue)', fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Add your first client →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clients.map((client: any) => {
              const latestScan = client.scan_jobs
                ?.slice()
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

              const posture = approximatePosture(latestScan?.critical_count ?? 0, latestScan?.high_count ?? 0)
              const hasActiveScan = latestScan?.status === 'running' || latestScan?.status === 'queued'
              const tier = TIER_STYLES[client.tier] ?? TIER_STYLES.starter

              return (
                <Link key={client.id} href={`/clients/${client.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'var(--ink-2)', border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                  transition: 'border-color 0.3s, transform 0.2s',
                  textDecoration: 'none',
                }}>
                  {/* Grade */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: posture.bg, border: `1px solid ${posture.border.replace('border-', '')}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', lineHeight: 1, color: posture.color.replace('text-', '') }}>
                      {posture.grade}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{client.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: 2 }}>{client.industry}</div>
                  </div>

                  {/* Right badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {(latestScan?.critical_count ?? 0) > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em',
                        background: 'rgba(255,60,60,0.12)', color: '#ff8080',
                        border: '1px solid rgba(255,80,80,0.2)', padding: '4px 10px', borderRadius: 100,
                      }}>
                        {latestScan.critical_count} critical
                      </span>
                    )}
                    {hasActiveScan && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--teal)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
                        Scanning
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
                      background: tier.bg, color: tier.color,
                      border: `1px solid ${tier.color}30`, padding: '4px 10px', borderRadius: 100,
                    }}>
                      {client.tier}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(client.modules as string[]).map((m: string) => (
                        <span key={m} style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
                          color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-soft)', padding: '3px 8px', borderRadius: 4,
                        }}>
                          {m}
                        </span>
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
