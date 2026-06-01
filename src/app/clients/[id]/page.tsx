import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { computePosture } from '@/lib/posture'
import { FindingsTable } from '@/components/FindingsTable'
import { ScanTrigger } from '@/components/ScanTrigger'

export const dynamic = 'force-dynamic'

const SEV_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  critical:      { bg: 'rgba(255,60,60,0.08)',   color: '#ff8080',         border: 'rgba(255,80,80,0.2)' },
  high:          { bg: 'rgba(255,140,0,0.08)',    color: '#ffaa55',         border: 'rgba(255,140,0,0.2)' },
  medium:        { bg: 'rgba(255,200,0,0.07)',    color: '#ffd060',         border: 'rgba(255,200,0,0.2)' },
  low:           { bg: 'rgba(59,158,255,0.08)',   color: 'var(--blue)',     border: 'var(--border)' },
  informational: { bg: 'rgba(255,255,255,0.03)',  color: 'var(--text-muted)', border: 'var(--border-soft)' },
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
    <div className="min-h-screen p-6" style={{ background: 'var(--ink)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 24 }}>
          <Link href="/dashboard" style={{ color: 'var(--blue)' }}>Dashboard</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{client.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 6 }}>
              {client.industry}
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', color: 'var(--text-primary)', lineHeight: 1.15 }}>
              {client.name}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {client.employee_count} employees · {client.tier} tier
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(client.modules as string[]).map((m: string) => (
              <span key={m} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
                color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-soft)', padding: '4px 10px', borderRadius: 4,
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Posture + severity row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>

          {/* Grade */}
          <div style={{
            background: posture.bg, border: `1px solid ${posture.border}`,
            borderRadius: 'var(--radius-lg)', padding: '20px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', lineHeight: 1, color: posture.color }}>{posture.grade}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>Posture</span>
            <span style={{ fontSize: '0.72rem', color: posture.color, marginTop: 2 }}>{posture.label}</span>
          </div>

          {/* Severity cards */}
          {(['critical', 'high', 'medium', 'low', 'informational'] as const).map(sev => {
            const s = SEV_STYLES[sev]
            return (
              <div key={sev} style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 'var(--radius-lg)', padding: '16px',
              }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: s.color, lineHeight: 1.1 }}>
                  {bySeverity[sev] ?? 0}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>
                  {sev}
                </div>
              </div>
            )
          })}
        </div>

        {/* Onboarding banner */}
        {!onboardingComplete && pendingSteps.length > 0 && (
          <div style={{
            background: 'rgba(59,158,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20,
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 14 }}>
              Complete setup to activate scanning
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingSteps.map((s: any) => (
                <div key={s.step_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 16, height: 16, border: '1px solid var(--border)', borderRadius: 4, flexShrink: 0 }} />
                    {s.title}
                  </div>
                  {setupLinks[s.step_key] && (
                    <Link href={setupLinks[s.step_key]} style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.08em',
                      background: 'var(--grad-brand)', color: '#fff',
                      padding: '5px 14px', borderRadius: 6, textDecoration: 'none',
                    }}>
                      Configure →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan trigger */}
        <ScanTrigger clientId={id} clientSlug={client.slug} />

        {/* Findings */}
        {findings.length === 0 ? (
          <div style={{
            background: 'var(--ink-2)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius-lg)', textAlign: 'center', padding: '48px 0',
            color: 'var(--text-muted)', fontSize: '0.875rem',
          }}>
            {onboardingComplete ? 'No findings yet. Run a scan above to populate results.' : 'Complete setup above, then run a scan.'}
          </div>
        ) : (
          <FindingsTable findings={findings} clientId={id} />
        )}

      </div>
    </div>
  )
}
