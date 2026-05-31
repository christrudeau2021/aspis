'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { updateFindingStatus } from '@/app/actions/findings'

const SEVERITY_COLORS: Record<string, string> = {
  critical:      'bg-red-900/50 text-red-300 border-red-800',
  high:          'bg-orange-900/50 text-orange-300 border-orange-800',
  medium:        'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  low:           'bg-blue-900/50 text-blue-300 border-blue-800',
  informational: 'bg-gray-800 text-gray-400 border-gray-700',
}

const STATUS_STYLES: Record<string, string> = {
  open:          'bg-red-900/30 text-red-400 border-red-800',
  resolved:      'bg-green-900/30 text-green-400 border-green-800',
  accepted_risk: 'bg-gray-800 text-gray-400 border-gray-700',
}

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-white font-semibold mb-1">Accept Risk</h3>
        <p className="text-gray-400 text-sm mb-4">Document why this risk is being accepted. This becomes a compliance artifact.</p>
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          placeholder="e.g. Legacy auth required for specific vendor integration until Q3. Mitigated by network-level controls."
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
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
      <div className={`px-4 py-3 transition-colors ${isPending ? 'opacity-60' : ''} ${isOpen ? 'hover:bg-gray-800/50' : 'opacity-70'}`}>
        <div className="flex items-start gap-3">
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-1 text-gray-600 hover:text-gray-400 shrink-0 transition-colors text-xs"
          >
            {expanded ? '▾' : '▸'}
          </button>

          <div className="flex-1 min-w-0">
            {/* Top row */}
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${SEVERITY_COLORS[finding.severity]}`}>
                {finding.severity}
              </span>
              {status !== 'open' && (
                <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLES[status]}`}>
                  {status === 'accepted_risk' ? 'accepted risk' : status}
                </span>
              )}
              <span className="text-xs text-gray-500 shrink-0">{finding.service}</span>
              <span className="text-xs text-gray-600 shrink-0 font-mono">{finding.check_id}</span>
            </div>

            {/* Title */}
            <div className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-500 line-through'}`}>
              {finding.title}
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">What this means</div>
                  <p className="text-gray-300 leading-relaxed">{finding.description}</p>
                </div>
                {finding.remediation && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">How to fix it</div>
                    <p className="text-gray-300 leading-relaxed">{finding.remediation}</p>
                  </div>
                )}
                {finding.compliance_frameworks.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Compliance</div>
                    <div className="flex gap-1 flex-wrap">
                      {finding.compliance_frameworks.map(fw => (
                        <span key={fw} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{fw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons — only for open findings */}
          <div className="flex gap-1.5 shrink-0 mt-0.5">
            {isOpen ? (
              <>
                <button
                  onClick={() => handleStatus('resolved')}
                  disabled={isPending}
                  className="text-xs px-2.5 py-1 bg-green-900/40 hover:bg-green-800/60 text-green-400 border border-green-800 rounded-lg transition-colors disabled:opacity-40"
                >
                  ✓ Resolved
                </button>
                <button
                  onClick={() => setShowAcceptModal(true)}
                  disabled={isPending}
                  className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  Accept Risk
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStatus('open')}
                disabled={isPending}
                className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-500 border border-gray-700 rounded-lg transition-colors disabled:opacity-40"
              >
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-white">Findings</h2>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="text-red-400 font-medium">{openCount} open</span>
            {resolvedCount > 0 && <span className="text-green-400">{resolvedCount} resolved</span>}
            {acceptedCount > 0 && <span>{acceptedCount} accepted</span>}
          </div>
        </div>
        <div className="flex gap-1">
          {(['open', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f === 'open' ? 'Open only' : `All (${findings.length})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          {filter === 'open' ? '✓ No open findings.' : 'No findings yet.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {visible.map(f => (
            <FindingRow key={f.id} finding={f} clientId={clientId} />
          ))}
        </div>
      )}
    </div>
  )
}
