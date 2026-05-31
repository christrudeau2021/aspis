export type ModuleSlug = 'posture' | 'ttx' | 'awareness' | 'threat-hunting'

export interface Client {
  id: string
  name: string
  slug: string
  industry: string
  employee_count: number
  tier: 'starter' | 'business' | 'managed'
  modules: ModuleSlug[]
  onboarding_complete: boolean
  created_at: string
  // SaaS connections
  m365_tenant_id?: string
  salesforce_org_id?: string
  google_workspace_domain?: string
}

export interface ScanJob {
  id: string
  client_id: string
  scanner: 'prowler' | 'maester' | 'monkey365'
  status: 'queued' | 'running' | 'complete' | 'failed'
  trigger: 'scheduled' | 'manual' | 'onboarding'
  started_at?: string
  completed_at?: string
  findings_count?: number
  critical_count?: number
  high_count?: number
  run_url?: string // GitHub Actions run URL
}

export interface Finding {
  id: string
  client_id: string
  scan_job_id: string
  scanner: string
  check_id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'
  status: 'open' | 'resolved' | 'accepted_risk'
  service: string // e.g. "entra_id", "sharepoint", "salesforce"
  resource_id?: string
  description: string
  remediation: string
  compliance_frameworks: string[] // e.g. ["CIS", "HIPAA", "SOC2"]
  detected_at: string
  resolved_at?: string
}

export interface Module {
  slug: ModuleSlug
  name: string
  description: string
  icon: string
  available: boolean
  comingSoon?: boolean
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}
