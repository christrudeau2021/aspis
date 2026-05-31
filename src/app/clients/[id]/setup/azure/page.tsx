'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function AzureSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [id, setId] = useState<string | null>(null)
  useEffect(() => { params.then(p => setId(p.id)) }, [])

  async function markComplete() {
    if (!id) return
    setSaving(true)
    await fetch(`/api/clients/${id}/setup`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-aspis-api-key': process.env.NEXT_PUBLIC_ASPIS_API_KEY ?? '' },
      body: JSON.stringify({ step_key: 'connect_azure' }),
    })
    setDone(true)
    setSaving(false)
    setTimeout(() => router.push(`/clients/${id}`), 1500)
  }

  const cliCommands = `# 1. Login
az login

# 2. Create service principal with Reader + Security Reader
az ad sp create-for-rbac \\
  --name "Aspis Security Scanner" \\
  --role "Reader" \\
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID

# 3. Add Security Reader role
az role assignment create \\
  --assignee YOUR_APP_ID \\
  --role "Security Reader" \\
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID`

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <span>/</span>
          {id && <Link href={`/clients/${id}`} className="hover:text-gray-300">Client</Link>}
          {id && <span>/</span>}
          <span className="text-gray-300">Connect Azure</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-lg">☁️</div>
            <h1 className="text-xl font-bold text-white">Connect Microsoft Azure</h1>
          </div>
          <p className="text-gray-400 text-sm ml-11">Create a read-only service principal so Prowler can scan Azure subscriptions for misconfigurations.</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-8 text-sm text-gray-400">
          <div className="font-medium text-gray-300 mb-1">What you'll need</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Owner or User Access Administrator role on the Azure subscription</li>
            <li>Azure CLI installed, or access to Azure Cloud Shell</li>
          </ul>
        </div>

        <div className="space-y-0">

          <Step n={1} title="Create a Service Principal via Azure CLI">
            <p className="text-sm text-gray-400 mb-1">The fastest way is Azure CLI. Open a terminal or Azure Cloud Shell:</p>
            <CodeBlock copyText={cliCommands}>{cliCommands}</CodeBlock>
            <p className="text-sm text-gray-400 mt-3">The output gives you <code className="text-green-300 text-xs">appId</code>, <code className="text-green-300 text-xs">password</code>, and <code className="text-green-300 text-xs">tenant</code> — save all three.</p>
          </Step>

          <Step n={2} title="Or create via the Azure Portal">
            <p className="text-sm text-gray-400 mb-2">Prefer the UI? Navigate to:</p>
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs">
              Entra ID → App registrations → New registration<br />
              → Name: <span className="text-green-300">Aspis Security Scanner</span><br />
              → Register → Certificates &amp; secrets → New client secret
            </div>
            <p className="text-sm text-gray-400 mt-3">Then assign roles:</p>
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs">
              Subscriptions → [subscription] → Access control (IAM)<br />
              → Add role assignment → Reader → assign to your app<br />
              → Repeat for: Security Reader
            </div>
          </Step>

          <Step n={3} title="Add Secrets to the Client's GitHub Scan Repo">
            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-white">Settings → Secrets and variables → Actions → New repository secret</strong>
            </p>
            <div className="space-y-2">
              {[
                { name: 'AZURE_TENANT_ID', desc: 'tenant from CLI output (or Directory ID)' },
                { name: 'AZURE_CLIENT_ID', desc: 'appId from CLI output (or Application ID)' },
                { name: 'AZURE_CLIENT_SECRET', desc: 'password from CLI output (or secret Value)' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <code className="text-xs text-green-300 font-mono w-44 shrink-0">{s.name}</code>
                  <span className="text-xs text-gray-500">{s.desc}</span>
                  <CopyButton text={s.name} />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-3">Also set the repository variable:</p>
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mt-2">
              <code className="text-xs text-green-300 font-mono w-44 shrink-0">PROWLER_PROVIDER</code>
              <span className="text-xs text-gray-500">Set value to: <code className="text-green-300">azure</code></span>
              <CopyButton text="azure" />
            </div>
          </Step>

          <Step n={4} title="Trigger the First Scan">
            <p className="text-sm text-gray-400 mb-2">In the client scan repo:</p>
            <p className="text-sm text-gray-400"><strong className="text-white">Actions → Cloud Security Scan (Prowler) → Run workflow → Run workflow</strong></p>
            <p className="text-sm text-gray-400 mt-2">Prowler runs 1,700+ checks. First scan takes 5–15 minutes depending on subscription size.</p>
            <div className="mt-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
              💡 After the first manual run, Prowler scans automatically every Monday at 3am UTC.
            </div>
          </Step>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          {done ? (
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <span>✓</span> Azure connection marked complete — returning to client…
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Once the first scan has completed successfully:</p>
              <button
                onClick={markComplete}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving…' : 'Mark Azure as configured ✓'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
