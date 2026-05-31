'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PERMISSIONS = [
  'AuditLog.Read.All',
  'Directory.Read.All',
  'Group.Read.All',
  'IdentityRiskyUser.Read.All',
  'Organization.Read.All',
  'Policy.Read.All',
  'Reports.Read.All',
  'RoleManagement.Read.All',
  'SecurityEvents.Read.All',
  'User.Read.All',
  'Application.Read.All',
  'DeviceManagementConfiguration.Read.All',
  'DeviceManagementManagedDevices.Read.All',
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-blue-900 border border-blue-700 text-blue-300 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div className="flex-1 pb-8 border-b border-gray-800 last:border-0 last:pb-0">
        <div className="text-white font-medium mb-3">{title}</div>
        {children}
      </div>
    </div>
  )
}

function CodeBlock({ children, copyText }: { children: React.ReactNode; copyText?: string }) {
  return (
    <div className="flex items-start gap-2 mt-2">
      <pre className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">{children}</pre>
      {copyText && <CopyButton text={copyText} />}
    </div>
  )
}

export default function M365SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [clientId, setClientId] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const [id, setId] = useState<string | null>(null)
  useEffect(() => { params.then(p => setId(p.id)) }, [])

  async function markComplete() {
    if (!id) return
    setSaving(true)
    await fetch(`/api/clients/${id}/setup`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-aspis-api-key': process.env.NEXT_PUBLIC_ASPIS_API_KEY ?? '',
      },
      body: JSON.stringify({ step_key: 'connect_m365' }),
    })
    setDone(true)
    setSaving(false)
    setTimeout(() => router.push(`/clients/${id}`), 1500)
  }

  const permList = PERMISSIONS.join('\n')

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <span>/</span>
          {id && <Link href={`/clients/${id}`} className="hover:text-gray-300">Client</Link>}
          {id && <span>/</span>}
          <span className="text-gray-300">Connect M365</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-lg">🏢</div>
            <h1 className="text-xl font-bold text-white">Connect Microsoft 365 / Entra ID</h1>
          </div>
          <p className="text-gray-400 text-sm ml-11">Register a read-only Azure AD app so Maester and Prowler can scan this tenant. Takes about 10 minutes.</p>
        </div>

        {/* What you'll need callout */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-8 text-sm text-gray-400">
          <div className="font-medium text-gray-300 mb-1">What you'll need</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Global Administrator or Application Administrator role in the client's Entra ID</li>
            <li>Access to the client's GitHub scan repo to add secrets</li>
          </ul>
        </div>

        <div className="space-y-0">

          <Step n={1} title="Open Azure Portal — App Registrations">
            <p className="text-sm text-gray-400 mb-2">Go to the client's Azure Portal, then navigate to:</p>
            <CodeBlock copyText="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade">
              portal.azure.com → Entra ID → App registrations → New registration
            </CodeBlock>
            <div className="mt-3 text-sm text-gray-400">
              <strong className="text-gray-300">Name the app:</strong>
              <CodeBlock copyText="Aspis Security Scanner (Read Only)">Aspis Security Scanner (Read Only)</CodeBlock>
            </div>
            <p className="text-sm text-gray-400 mt-3">Supported account types: <strong className="text-white">Single tenant</strong> — accounts in this directory only.</p>
            <p className="text-sm text-gray-400 mt-1">Redirect URI: leave blank. Click <strong className="text-white">Register</strong>.</p>
          </Step>

          <Step n={2} title="Copy the Tenant ID and Client ID">
            <p className="text-sm text-gray-400 mb-2">On the app's Overview page you'll see two values you need:</p>
            <div className="space-y-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Application (client) ID</div>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">Paste it above — you'll need it for the GitHub secret</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Directory (tenant) ID</div>
                <div className="text-xs text-gray-400">Copy this separately — it becomes <code className="text-green-300">M365_TENANT_ID</code> in GitHub secrets</div>
              </div>
            </div>
          </Step>

          <Step n={3} title="Add Microsoft Graph API Permissions">
            <p className="text-sm text-gray-400 mb-2">
              In your app: <strong className="text-white">API permissions → Add a permission → Microsoft Graph → Application permissions</strong>
            </p>
            <p className="text-sm text-gray-400 mb-2">Add all of the following — search each one and check the box:</p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{PERMISSIONS.length} permissions required</span>
                <CopyButton text={permList} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                {PERMISSIONS.map(p => (
                  <div key={p} className="text-xs text-green-300 font-mono bg-gray-900 px-2 py-1 rounded">{p}</div>
                ))}
              </div>
            </div>
            <div className="mt-3 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-300">
              ⚠️ After adding permissions, click <strong>"Grant admin consent for [tenant]"</strong> — without this the app cannot read data.
            </div>
          </Step>

          <Step n={4} title="Create a Client Secret">
            <p className="text-sm text-gray-400 mb-2">
              In your app: <strong className="text-white">Certificates & secrets → Client secrets → New client secret</strong>
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Description: <code className="text-green-300 text-xs">Aspis scanner</code></p>
              <p>Expires: <strong className="text-white">24 months</strong> (set a calendar reminder to rotate)</p>
              <p>Click <strong className="text-white">Add</strong> — copy the <strong className="text-red-400">Value</strong> immediately. It won't be shown again.</p>
            </div>
            <div className="mt-3 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-300">
              🔑 Copy the secret Value now — once you leave this page it's hidden forever.
            </div>
          </Step>

          <Step n={5} title="Add Secrets to the Client's GitHub Scan Repo">
            <p className="text-sm text-gray-400 mb-3">
              In <code className="text-green-300 text-xs">github.com/christrudeau2021/aspis-client-[name]</code>:<br />
              <strong className="text-white">Settings → Secrets and variables → Actions → New repository secret</strong>
            </p>
            <div className="space-y-2">
              {[
                { name: 'M365_TENANT_ID', desc: 'Directory (tenant) ID from Step 2' },
                { name: 'M365_CLIENT_ID', desc: 'Application (client) ID from Step 2' },
                { name: 'M365_CLIENT_SECRET', desc: 'Secret Value from Step 4' },
                { name: 'SUPABASE_URL', desc: 'Your Aspis Supabase project URL' },
                { name: 'SUPABASE_SERVICE_KEY', desc: 'Your Aspis Supabase service role key' },
                { name: 'ASPIS_CLIENT_ID', desc: 'This client\'s UUID from Supabase' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <code className="text-xs text-green-300 font-mono w-48 shrink-0">{s.name}</code>
                  <span className="text-xs text-gray-500">{s.desc}</span>
                  <CopyButton text={s.name} />
                </div>
              ))}
            </div>
          </Step>

          <Step n={6} title="Trigger the First Scan">
            <p className="text-sm text-gray-400 mb-2">In the client scan repo:</p>
            <p className="text-sm text-gray-400"><strong className="text-white">Actions → M365 Security Scan (Maester) → Run workflow → Run workflow</strong></p>
            <p className="text-sm text-gray-400 mt-2">The scan takes 3–8 minutes. When complete, findings will appear automatically in the Aspis dashboard for this client.</p>
            <div className="mt-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
              💡 After the first manual run confirms everything works, Maester will scan automatically every day at 2am UTC.
            </div>
          </Step>

        </div>

        {/* Mark complete */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          {done ? (
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <span>✓</span> M365 connection marked complete — returning to client…
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Once you've completed all steps above and the first scan has run:</p>
              <button
                onClick={markComplete}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving…' : 'Mark M365 as configured ✓'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
