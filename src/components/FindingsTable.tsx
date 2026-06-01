'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { updateFindingStatus } from '@/app/actions/findings'

const SEV: Record<string, { bg: string; color: string; border: string }> = {
  critical:      { bg: 'rgba(255,60,60,0.12)',   color: '#ff8080',            border: 'rgba(255,80,80,0.25)' },
  high:          { bg: 'rgba(255,140,0,0.10)',    color: '#ffaa55',            border: 'rgba(255,140,0,0.25)' },
  medium:        { bg: 'rgba(255,200,0,0.08)',    color: '#ffd060',            border: 'rgba(255,200,0,0.2)' },
  low:           { bg: 'rgba(59,158,255,0.08)',   color: '#3b9eff',            border: 'rgba(59,158,255,0.2)' },
  informational: { bg: 'rgba(255,255,255,0.03)',  color: '#3d6080',            border: 'rgba(255,255,255,0.06)' },
}

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  open:          { bg: 'rgba(255,60,60,0.08)',  color: '#ff8080', border: 'rgba(255,80,80,0.2)' },
  resolved:      { bg: 'rgba(0,212,160,0.08)', color: '#00d4a0', border: 'rgba(0,212,160,0.2)' },
  accepted_risk: { bg: 'rgba(255,255,255,0.03)', color: '#3d6080', border: 'rgba(255,255,255,0.06)' },
}

// Keep old aliases for compatibility with any remaining references
const SEVERITY_COLORS: Record<string, string> = {}
const STATUS_STYLES: Record<string, string> = {}

type Finding = {
  id: string
  check_id: string
  title: string
  severity: string
  status: string
  service: string
  description: string
  remediation: string
  compliance_frameworks: string[]
}

function AcceptRiskModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 480, width: '100%' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 6 }}>Accept Risk</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Document why this risk is being accepted. This becomes a compliance artifact.
        </p>
        <textarea
          style={{ width: '100%', background: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', resize: 'vertical', minHeight: 90, fontFamily: 'var(--font-sans)' }}
          placeholder="e.g. Legacy auth required for AccountEdge vendor until Q3 migration. Mitigated by IP allowlisting."
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', fontSize: '0.875rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Cancel
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()} style={{
            padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, borderRadius: 8, cursor: 'pointer',
            background: reason.trim() ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
            color: reason.trim() ? 'var(--text-primary)' : 'var(--text-muted)',
            border: '1px solid var(--border-soft)', fontFamily: 'var(--font-sans)',
            opacity: reason.trim() ? 1 : 0.5,
          }}>
            Accept Risk
          </button>
        </div>
      </div>
    </div>
  )
}

function FindingRow({ finding, clientId }: { finding: Finding; clientId: string }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(finding.status)
  const [expanded, setExpanded] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)

  function handleStatus(newStatus: 'open' | 'resolved' | 'accepted_risk', note?: string) {
    setStatus(newStatus)
    startTransition(() => updateFindingStatus(finding.id, newStatus, clientId, note))
  }

  const isOpen = status === 'open'

  return (
    <>
      {showAcceptModal && (
        <AcceptRiskModal
          onConfirm={reason => { setShowAcceptModal(false); handleStatus('accepted_risk', reason) }}
          onCancel={() => setShowAcceptModal(false)}
        />
      )}
      <div style={{ padding: '14px 20px', opacity: isPending ? 0.6 : isOpen ? 1 : 0.75, transition: 'opacity 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Expand toggle */}
          <button onClick={() => setExpanded(e => !e)} style={{
            marginTop: 2, color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.75rem',
            transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            {expanded ? '▾' : '▸'}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {(() => { const s = SEV[finding.severity] || SEV.informational; return (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>
                  {finding.severity}
                </span>
              )})()}
              {status !== 'open' && (() => { const s = STATUS[status] || STATUS.open; return (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
                  padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color,
                  border: `1px solid ${s.border}`, flexShrink: 0 }}>
                  {status === 'accepted_risk' ? 'accepted risk' : status}
                </span>
              )})()}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{finding.service}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7, flexShrink: 0 }}>{finding.check_id}</span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: '0.9rem', fontWeight: 500,
              color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)',
              textDecoration: isOpen ? 'none' : 'line-through',
            }}>
              {finding.title}
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>What this means</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 14, borderLeft: '2px solid rgba(59,158,255,0.25)' }}>{finding.description}</p>
                </div>
                {finding.remediation && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 6 }}>How to fix it</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 14, borderLeft: '2px solid rgba(0,212,160,0.25)' }}>{finding.remediation}</p>
                  </div>
                )}
                {finding.compliance_frameworks.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Compliance</span>
                    {finding.compliance_frameworks.map(fw => (
                      <span key={fw} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--blue)', background: 'rgba(59,158,255,0.07)', border: '1px solid rgba(59,158,255,0.15)', padding: '2px 8px', borderRadius: 4 }}>{fw}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
            {isOpen ? (
              <>
                <button onClick={() => handleStatus('resolved')} disabled={isPending} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em',
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s',
                  background: 'rgba(0,212,160,0.1)', color: 'var(--teal)', border: '1px solid rgba(0,212,160,0.25)',
                  opacity: isPending ? 0.4 : 1,
                }}>
                  ✓ Resolved
                </button>
                <button onClick={() => setShowAcceptModal(true)} disabled={isPending} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em',
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s',
                  background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)',
                  opacity: isPending ? 0.4 : 1,
                }}>
                  Accept Risk
                </button>
              </>
            ) : (
              <button onClick={() => handleStatus('open')} disabled={isPending} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.06em',
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)',
                opacity: isPending ? 0.4 : 1,
              }}>
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function FindingsTable({ findings, clientId }: { findings: Finding[]; clientId: string }) {
  const [filter, setFilter] = useState<'open' | 'all'>('open')

  const visible = filter === 'open'
    ? findings.filter(f => f.status === 'open')
    : findings

  const openCount = findings.filter(f => f.status === 'open').length
  const resolvedCount = findings.filter(f => f.status === 'resolved').length
  const acceptedCount = findings.filter(f => f.status === 'accepted_risk').length

  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Findings</h2>
          <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
            <span style={{ color: '#ff8080' }}>{openCount} open</span>
            {resolvedCount > 0 && <span style={{ color: 'var(--teal)' }}>{resolvedCount} resolved</span>}
            {acceptedCount > 0 && <span style={{ color: 'var(--text-muted)' }}>{acceptedCount} accepted</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['open', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.08em',
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s',
              background: filter === f ? 'rgba(59,158,255,0.1)' : 'transparent',
              color: filter === f ? 'var(--blue)' : 'var(--text-muted)',
              border: filter === f ? '1px solid rgba(59,158,255,0.2)' : '1px solid transparent',
            }}>
              {f === 'open' ? 'Open only' : `All (${findings.length})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {filter === 'open' ? '✓ No open findings.' : 'No findings yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {visible.map((f, i) => (
            <div key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}>
              <FindingRow finding={f} clientId={clientId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
