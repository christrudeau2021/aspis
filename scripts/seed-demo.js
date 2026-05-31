#!/usr/bin/env node
/**
 * Aspis Demo Seed Script
 * Creates 3 realistic SMB clients with findings based on actual 2026 breach patterns.
 *
 * Usage:
 *   node scripts/seed-demo.js
 *   node scripts/seed-demo.js --wipe   (removes all existing demo data first)
 */

require('dotenv').config({ path: '.env.local' })
const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const WIPE         = process.argv.includes('--wipe')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ─── Supabase REST helper ──────────────────────────────────────────────────

function sb(path, method = 'GET', body = null, extra = {}) {
  return new Promise((resolve, reject) => {
    const url  = new URL(SUPABASE_URL + '/rest/v1' + path)
    const data = body ? JSON.stringify(body) : null
    const req  = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...extra,
      },
    }, res => {
      let buf = ''
      res.on('data', d => buf += d)
      res.on('end', () => {
        try { resolve(JSON.parse(buf || '[]')) }
        catch { resolve(buf) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// ─── Demo clients ──────────────────────────────────────────────────────────

const CLIENTS = [
  {
    name: 'Harrington & Associates LLP',
    slug: 'harrington-associates-llp',
    industry: 'Legal',
    employee_count: 18,
    tier: 'starter',
    modules: ['posture', 'ttx'],
    onboarding_complete: true,
    scanner: 'maester',
    provider: 'm365',
  },
  {
    name: 'Lakeside Medical Group',
    slug: 'lakeside-medical-group',
    industry: 'Healthcare',
    employee_count: 42,
    tier: 'business',
    modules: ['posture'],
    onboarding_complete: true,
    scanner: 'maester',
    provider: 'm365',
  },
  {
    name: 'Meridian Capital Advisors',
    slug: 'meridian-capital-advisors',
    industry: 'Financial Services',
    employee_count: 11,
    tier: 'managed',
    modules: ['posture', 'ttx'],
    onboarding_complete: true,
    scanner: 'prowler',
    provider: 'azure',
  },
]

// ─── Findings by client type ───────────────────────────────────────────────
// Based on real Maester check IDs and Prowler Azure checks.
// Patterns derived from 2026 breach cases (SRG law firm campaign,
// Saint Anthony Hospital email compromise, ShinyHunters credential attacks).

const LAW_FIRM_FINDINGS = [
  {
    check_id: 'EIDSCA.AP01',
    title: 'Legacy authentication protocols not blocked',
    severity: 'critical',
    service: 'entra_id',
    resource_id: null,
    description: 'IMAP, SMTP AUTH, and POP3 legacy protocols are enabled. These bypass MFA entirely and are the primary entry point for Business Email Compromise attacks.',
    remediation: 'Create a Conditional Access policy that blocks all legacy authentication. Navigate to Entra ID → Security → Conditional Access → New policy.',
    compliance_frameworks: ['CIS-M365', 'CISA-SCuBA', 'MS-ISAC'],
  },
  {
    check_id: 'EIDSCA.AP04',
    title: 'Admin accounts without MFA enforcement',
    severity: 'critical',
    service: 'entra_id',
    resource_id: 'admin@harrington-law.com',
    description: '2 administrator accounts are not covered by an MFA Conditional Access policy. Admin accounts are the highest-value target for credential attacks.',
    remediation: 'Create a Conditional Access policy requiring MFA for all users with admin roles. Apply to: Global Administrator, Exchange Administrator, SharePoint Administrator.',
    compliance_frameworks: ['CIS-M365', 'CISA-SCuBA'],
  },
  {
    check_id: 'MT.1039',
    title: 'External email forwarding enabled for user mailboxes',
    severity: 'critical',
    service: 'exchange',
    resource_id: 'jharrington@harrington-law.com',
    description: 'A mailbox forwarding rule is silently copying all incoming email to an external Gmail address. This is the exact persistence mechanism used by Silent Ransom Group after initial access.',
    remediation: 'Review all mailbox forwarding rules in Exchange Admin Center. Disable external forwarding at the org level via the outbound spam policy.',
    compliance_frameworks: ['CISA-SCuBA'],
  },
  {
    check_id: 'EIDSCA.PR04',
    title: 'Stale guest accounts with active access',
    severity: 'high',
    service: 'entra_id',
    resource_id: null,
    description: '7 guest accounts have not signed in within 90 days but retain active SharePoint and Teams permissions. Includes 2 accounts from a former IT vendor.',
    remediation: 'Review guest accounts in Entra ID → External Identities → All users. Remove or disable accounts not accessed in 90+ days. Enable access reviews.',
    compliance_frameworks: ['CIS-M365'],
  },
  {
    check_id: 'MT.1012',
    title: 'Audit logging not enabled for all services',
    severity: 'high',
    service: 'sharepoint',
    resource_id: null,
    description: 'Unified audit logging is not enabled. Without audit logs, there is no forensic record of user activity, data access, or configuration changes.',
    remediation: 'Enable unified audit logging: Microsoft 365 Compliance Center → Audit → Turn on auditing.',
    compliance_frameworks: ['CIS-M365', 'HIPAA', 'SOC2'],
  },
  {
    check_id: 'EIDSCA.AG01',
    title: 'SharePoint external sharing set to Anyone',
    severity: 'high',
    service: 'sharepoint',
    resource_id: 'Legal Documents library',
    description: 'SharePoint external sharing is set to "Anyone with the link" on the Legal Documents library. Any shared link works for anyone without authentication.',
    remediation: 'SharePoint Admin Center → Policies → Sharing → set to "Existing guests" or "Only people in your organization".',
    compliance_frameworks: ['CIS-M365', 'CISA-SCuBA'],
  },
  {
    check_id: 'EIDSCA.ST01',
    title: 'Self-service password reset not configured',
    severity: 'medium',
    service: 'entra_id',
    resource_id: null,
    description: 'SSPR is disabled. Users calling the helpdesk for password resets creates a social engineering opportunity (vishing attacks impersonate helpdesk).',
    remediation: 'Enable SSPR: Entra ID → Password reset → Properties → Selected or All users.',
    compliance_frameworks: ['CIS-M365'],
  },
  {
    check_id: 'MT.1055',
    title: 'Microsoft 365 Apps update channel not set to Current',
    severity: 'medium',
    service: 'entra_id',
    resource_id: null,
    description: 'Office applications are on Semi-Annual channel, meaning security patches are delayed up to 6 months.',
    remediation: 'Switch to Current Channel or Monthly Enterprise Channel via Microsoft 365 Apps admin center.',
    compliance_frameworks: ['CIS-M365'],
  },
  {
    check_id: 'EIDSCA.PR06',
    title: 'Users can register OAuth applications',
    severity: 'medium',
    service: 'entra_id',
    resource_id: null,
    description: 'Any user can register Azure AD applications. This allows attackers who compromise a user account to create persistent OAuth backdoors (OAuth device code attack vector).',
    remediation: 'Entra ID → User settings → App registrations → set to No.',
    compliance_frameworks: ['CIS-M365', 'CISA-SCuBA'],
  },
]

const HEALTHCARE_FINDINGS = [
  {
    check_id: 'EIDSCA.AP01',
    title: 'Legacy authentication protocols not blocked',
    severity: 'critical',
    service: 'entra_id',
    resource_id: null,
    description: 'Legacy auth (IMAP/SMTP/POP3) is enabled. Saint Anthony Hospital\'s 146,108-patient breach in 2026 began with email account compromise via legacy auth bypass.',
    remediation: 'Block legacy auth via Conditional Access. This is a HIPAA Security Rule requirement under access controls.',
    compliance_frameworks: ['CIS-M365', 'HIPAA', 'CISA-SCuBA'],
  },
  {
    check_id: 'MT.1039',
    title: 'PHI accessible in unstructured email content',
    severity: 'critical',
    service: 'exchange',
    resource_id: null,
    description: '3 mailboxes contain emails with patient names, DOBs, and medical record numbers in unencrypted body text. No DLP policy is enforcing PHI protection.',
    remediation: 'Enable Microsoft Purview DLP policies for HIPAA. Create policies to detect and block PHI in email and Teams.',
    compliance_frameworks: ['HIPAA'],
  },
  {
    check_id: 'EIDSCA.AP04',
    title: 'MFA not required for clinical staff accounts',
    severity: 'critical',
    service: 'entra_id',
    resource_id: null,
    description: '14 clinical staff accounts access patient data in M365 without MFA. HIPAA Security Rule §164.312(d) requires authentication controls for ePHI systems.',
    remediation: 'Create Conditional Access policy requiring MFA for all users. Exclude emergency break-glass accounts only.',
    compliance_frameworks: ['HIPAA', 'CIS-M365'],
  },
  {
    check_id: 'MT.1012',
    title: 'Unified audit logging disabled — HIPAA violation',
    severity: 'high',
    service: 'exchange',
    resource_id: null,
    description: 'Audit logging is off. HIPAA requires maintaining an audit trail of all ePHI access. OCR investigations consistently cite missing audit logs as a contributing factor in breach penalties.',
    remediation: 'Enable unified audit logging immediately. Microsoft 365 Compliance Center → Audit → Turn on auditing. Retain logs for minimum 6 years per HIPAA.',
    compliance_frameworks: ['HIPAA'],
  },
  {
    check_id: 'EIDSCA.AG01',
    title: 'OneDrive external sharing enabled',
    severity: 'high',
    service: 'sharepoint',
    resource_id: null,
    description: 'OneDrive for Business allows sharing with external users. Clinical documents stored in OneDrive can be shared outside the organization without approval.',
    remediation: 'SharePoint/OneDrive Admin Center → Sharing → restrict to organization members only for OneDrive.',
    compliance_frameworks: ['HIPAA', 'CIS-M365'],
  },
  {
    check_id: 'EIDSCA.PR04',
    title: 'Former employee accounts not fully deprovisioned',
    severity: 'high',
    service: 'entra_id',
    resource_id: 'dr.martinez@lakesidemedical.com',
    description: '1 former physician account is disabled in Entra ID but retains active delegated mailbox access and OAuth app permissions for 3 third-party clinical applications.',
    remediation: 'Review and revoke all delegated permissions for disabled accounts. Check OAuth app consents under Entra ID → Enterprise applications.',
    compliance_frameworks: ['HIPAA', 'CIS-M365'],
  },
  {
    check_id: 'MT.1055',
    title: 'Teams meeting recordings stored indefinitely',
    severity: 'medium',
    service: 'teams',
    resource_id: null,
    description: 'Teams meeting recordings have no retention policy. Recordings may contain verbal PHI from telehealth sessions and will accumulate without limit.',
    remediation: 'Microsoft Purview compliance portal → Data lifecycle management → create retention policy for Teams recordings (90-day recommended for non-clinical meetings).',
    compliance_frameworks: ['HIPAA'],
  },
  {
    check_id: 'EIDSCA.ST01',
    title: 'Password expiration disabled for all users',
    severity: 'medium',
    service: 'entra_id',
    resource_id: null,
    description: 'Passwords are set to never expire. While acceptable when combined with strong MFA, this org has incomplete MFA coverage making long-lived passwords higher risk.',
    remediation: 'Enable MFA for all users first. Once MFA is enforced, passwords set to never expire is acceptable per NIST 800-63B.',
    compliance_frameworks: ['CIS-M365'],
  },
]

const FINANCIAL_FINDINGS = [
  {
    check_id: 'azure-entra-cis-1.1',
    title: 'Azure subscription has no MFA enforced for privileged users',
    severity: 'critical',
    service: 'entra_id',
    resource_id: '/subscriptions/demo-sub-id',
    description: 'Privileged Azure roles (Owner, Contributor) are assigned to accounts without MFA enforcement. ShinyHunters credential attacks specifically target single-factor admin accounts.',
    remediation: 'Enable Entra ID PIM for privileged roles. Require MFA activation for all Owner and Contributor role assignments.',
    compliance_frameworks: ['CIS-Azure', 'GLBA', 'SEC-Reg-S-P'],
  },
  {
    check_id: 'azure-storage-cis-3.1',
    title: 'Storage account allows public blob access',
    severity: 'critical',
    service: 'azure_storage',
    resource_id: 'stmeridianbackups',
    description: 'Storage account "stmeridianbackups" has AllowBlobPublicAccess enabled. Financial records stored in this account are accessible to anyone with the URL.',
    remediation: 'Azure portal → Storage accounts → stmeridianbackups → Configuration → Blob public access → Disabled.',
    compliance_frameworks: ['CIS-Azure', 'GLBA'],
  },
  {
    check_id: 'azure-keyvault-cis-8.1',
    title: 'Key Vault soft delete not enabled',
    severity: 'high',
    service: 'azure_keyvault',
    resource_id: 'kv-meridian-prod',
    description: 'Key Vault does not have soft delete or purge protection enabled. Accidental or malicious deletion of keys would cause permanent data loss with no recovery path.',
    remediation: 'Enable soft delete and purge protection: az keyvault update --name kv-meridian-prod --enable-soft-delete true --enable-purge-protection true',
    compliance_frameworks: ['CIS-Azure'],
  },
  {
    check_id: 'azure-monitor-cis-5.1',
    title: 'Azure Activity Log not retained for 365 days',
    severity: 'high',
    service: 'azure_monitor',
    resource_id: '/subscriptions/demo-sub-id',
    description: 'Activity logs are retained for only 90 days. SEC Regulation S-P and GLBA require audit trails sufficient to reconstruct financial transactions and access events.',
    remediation: 'Create a Diagnostic Setting to export Activity Logs to a Storage Account or Log Analytics Workspace with 365-day retention.',
    compliance_frameworks: ['CIS-Azure', 'GLBA', 'SEC-Reg-S-P'],
  },
  {
    check_id: 'azure-defender-cis-2.1',
    title: 'Microsoft Defender for Cloud not enabled on subscription',
    severity: 'high',
    service: 'azure_defender',
    resource_id: '/subscriptions/demo-sub-id',
    description: 'Defender for Cloud is disabled. No threat detection, vulnerability assessment, or security score is available for this subscription.',
    remediation: 'Azure portal → Microsoft Defender for Cloud → Environment settings → Enable all Defender plans for this subscription.',
    compliance_frameworks: ['CIS-Azure', 'GLBA'],
  },
  {
    check_id: 'azure-network-cis-6.1',
    title: 'Network Security Group allows unrestricted RDP access',
    severity: 'high',
    service: 'azure_network',
    resource_id: 'nsg-meridian-vms',
    description: 'NSG rule allows inbound RDP (port 3389) from 0.0.0.0/0. RDP brute force is among the most common Azure VM compromise vectors.',
    remediation: 'Remove or restrict the 3389 inbound rule to specific IP ranges, or use Azure Bastion for RDP access.',
    compliance_frameworks: ['CIS-Azure'],
  },
  {
    check_id: 'azure-sql-cis-4.1',
    title: 'SQL Server auditing disabled',
    severity: 'medium',
    service: 'azure_sql',
    resource_id: 'sql-meridian-crm',
    description: 'Azure SQL Server auditing is not configured. Database access and query history is not being logged, which is required for GLBA audit trail compliance.',
    remediation: 'Azure portal → SQL servers → sql-meridian-crm → Security → Auditing → Enable.',
    compliance_frameworks: ['CIS-Azure', 'GLBA'],
  },
  {
    check_id: 'azure-entra-cis-1.14',
    title: 'Guest users have same permissions as member users',
    severity: 'medium',
    service: 'entra_id',
    resource_id: null,
    description: 'Guest user permissions are set to match member users. External collaborators (clients, partners) have access to directory information and can enumerate users.',
    remediation: 'Entra ID → External Identities → External collaboration settings → Guest user access → limit to own directory objects only.',
    compliance_frameworks: ['CIS-Azure', 'GLBA'],
  },
]

// ─── Seed function ─────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🛡️  Aspis Demo Seed\n')

  if (WIPE) {
    console.log('🗑️  Wiping existing demo clients...')
    const existing = await sb('/clients?slug=in.(harrington-associates-llp,lakeside-medical-group,meridian-capital-advisors)')
    for (const c of existing) {
      await sb(`/findings?client_id=eq.${c.id}`, 'DELETE')
      await sb(`/scan_jobs?client_id=eq.${c.id}`, 'DELETE')
      await sb(`/onboarding_steps?client_id=eq.${c.id}`, 'DELETE')
      await sb(`/clients?id=eq.${c.id}`, 'DELETE')
      console.log(`  Removed: ${c.name}`)
    }
    console.log()
  }

  const findingsByClient = {
    'harrington-associates-llp': LAW_FIRM_FINDINGS,
    'lakeside-medical-group':    HEALTHCARE_FINDINGS,
    'meridian-capital-advisors': FINANCIAL_FINDINGS,
  }

  for (const clientData of CLIENTS) {
    process.stdout.write(`Creating ${clientData.name}... `)

    // Create client
    const clientRes = await sb('/clients', 'POST', {
      name: clientData.name,
      slug: clientData.slug,
      industry: clientData.industry,
      employee_count: clientData.employee_count,
      tier: clientData.tier,
      modules: clientData.modules,
      onboarding_complete: clientData.onboarding_complete,
    })
    const client = Array.isArray(clientRes) ? clientRes[0] : null

    if (!client?.id) { console.log('SKIPPED — already exists. Run with --wipe to reset.'); continue }

    // Create completed onboarding steps
    const steps = [
      { step_key: 'profile',            title: 'Client profile created',    required: true, completed: true, completed_at: new Date().toISOString() },
      { step_key: 'connect_m365',       title: 'Connect Microsoft 365',     required: true, completed: true, completed_at: new Date().toISOString() },
      { step_key: 'connect_azure',      title: 'Connect Azure',             required: clientData.provider === 'azure', completed: clientData.provider === 'azure', completed_at: clientData.provider === 'azure' ? new Date().toISOString() : null },
      { step_key: 'connect_salesforce', title: 'Connect Salesforce',        required: false, completed: false },
      { step_key: 'first_scan',         title: 'First scan complete',       required: true, completed: true, completed_at: new Date().toISOString() },
      { step_key: 'review_findings',    title: 'Review critical findings',  required: true, completed: false },
    ].map(s => ({ ...s, client_id: client.id }))
    await sb('/onboarding_steps', 'POST', steps)

    // Create a completed scan job
    const now = new Date()
    const started = new Date(now - 7 * 60 * 1000) // 7 min ago
    const findings = findingsByClient[clientData.slug]
    const critical = findings.filter(f => f.severity === 'critical').length
    const high     = findings.filter(f => f.severity === 'high').length

    const jobRes = await sb('/scan_jobs', 'POST', {
      client_id:      client.id,
      scanner:        clientData.scanner,
      status:         'complete',
      trigger:        'onboarding',
      started_at:     started.toISOString(),
      completed_at:   now.toISOString(),
      findings_count: findings.length,
      critical_count: critical,
      high_count:     high,
      run_url:        `https://github.com/christrudeau2021/aspis-client-demo/actions/runs/demo-${clientData.slug}`,
    })
    const job = Array.isArray(jobRes) ? jobRes[0] : jobRes

    // Create findings
    const findingRows = findings.map(f => ({
      client_id:            client.id,
      scan_job_id:          job.id,
      scanner:              clientData.scanner,
      check_id:             f.check_id,
      title:                f.title,
      severity:             f.severity,
      status:               'open',
      service:              f.service,
      resource_id:          f.resource_id ?? null,
      description:          f.description,
      remediation:          f.remediation,
      compliance_frameworks: f.compliance_frameworks,
      detected_at:          now.toISOString(),
    }))
    await sb('/findings', 'POST', findingRows)

    console.log(`✓  (${critical} critical, ${high} high, ${findings.length} total)`)
  }

  console.log('\n✅ Demo data seeded. Open /dashboard to see it.\n')
}

seed().catch(e => { console.error(e); process.exit(1) })
