// Posture score calculation — shared between server and client components

export type PostureGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface PostureResult {
  score: number       // 0–100
  grade: PostureGrade
  color: string       // tailwind text color
  bg: string          // tailwind bg color
  border: string      // tailwind border color
  label: string       // human-readable label
}

export function computePosture(findings: { severity: string; status: string }[]): PostureResult {
  const open = findings.filter(f => f.status === 'open')
  const critical = open.filter(f => f.severity === 'critical').length
  const high     = open.filter(f => f.severity === 'high').length
  const medium   = open.filter(f => f.severity === 'medium').length
  const low      = open.filter(f => f.severity === 'low').length

  const score = Math.max(0, Math.min(100,
    100 - (critical * 20) - (high * 8) - (medium * 2) - (low * 1)
  ))

  if (score >= 90) return { score, grade: 'A', color: 'text-green-400',  bg: 'bg-green-900/40',  border: 'border-green-700', label: 'Excellent' }
  if (score >= 75) return { score, grade: 'B', color: 'text-blue-400',   bg: 'bg-blue-900/40',   border: 'border-blue-700',  label: 'Good' }
  if (score >= 50) return { score, grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-900/40', border: 'border-yellow-700',label: 'Fair' }
  if (score >= 25) return { score, grade: 'D', color: 'text-orange-400', bg: 'bg-orange-900/40', border: 'border-orange-700',label: 'Poor' }
  return              { score, grade: 'F', color: 'text-red-400',    bg: 'bg-red-900/40',    border: 'border-red-700',   label: 'Critical Risk' }
}

// Approximate score from scan_job counts (used on dashboard where full findings aren't loaded)
export function approximatePosture(criticalCount: number, highCount: number): PostureResult {
  return computePosture([
    ...Array(criticalCount).fill({ severity: 'critical', status: 'open' }),
    ...Array(highCount).fill({ severity: 'high', status: 'open' }),
  ])
}
