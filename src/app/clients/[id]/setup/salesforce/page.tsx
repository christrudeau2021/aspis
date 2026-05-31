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

export default function SalesforceSetupPage({ params }: { params: Promise<{ id: string }> }) {
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
      body: JSON.stringify({ step_key: 'connect_salesforce' }),
    })
    setDone(true)
    setSaving(false)
    setTimeout(() => router.push(`/clients/${id}`), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <span>/</span>
          {id && <Link href={`/clients/${id}`} className="hover:text-gray-300">Client</Link>}
          {id && <span>/</span>}
          <span className="text-gray-300">Connect Salesforce</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-lg">☁️</div>
            <h1 className="text-xl font-bold text-white">Connect Salesforce</h1>
          </div>
          <p className="text-gray-400 text-sm ml-11">
            Create a Connected App and read-only integration user so Steampipe can audit sharing models, profiles, and guest access. Catches the exact misconfiguration that exposed McGraw Hill's 13.5M records.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-8 text-sm text-gray-400">
          <div className="font-medium text-gray-300 mb-1">What you'll need</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Salesforce System Administrator profile</li>
            <li>API access enabled on the org (Enterprise, Unlimited, Developer editions)</li>
          </ul>
        </div>

        <div className="space-y-0">

          <Step n={1} title="Create a Connected App">
            <p className="text-sm text-gray-400 mb-2">In Salesforce Setup:</p>
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs">
              Setup → App Manager → New Connected App
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-400">
              <p><strong className="text-white">Connected App Name:</strong> <code className="text-green-300 text-xs">Aspis Security Scanner</code></p>
              <p><strong className="text-white">API Name:</strong> auto-fills</p>
              <p><strong className="text-white">Contact Email:</strong> your email</p>
              <p><strong className="text-white">Enable OAuth Settings:</strong> ✅ checked</p>
              <p><strong className="text-white">Callback URL:</strong> <code className="text-green-300 text-xs">https://login.salesforce.com/services/oauth2/callback</code></p>
            </div>
          </Step>

          <Step n={2} title="Set OAuth Scopes">
            <p className="text-sm text-gray-400 mb-2">In the Connected App OAuth settings, add these scopes:</p>
            <div className="space-y-1">
              {[
                { scope: 'api', desc: 'Access and manage your data' },
                { scope: 'refresh_token, offline_access', desc: 'Perform requests any time' },
              ].map(s => (
                <div key={s.scope} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <code className="text-xs text-green-300 font-mono w-48 shrink-0">{s.scope}</code>
                  <span className="text-xs text-gray-500">{s.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-3">Click <strong className="text-white">Save</strong>. After saving, wait 2–10 minutes for the app to activate.</p>
          </Step>

          <Step n={3} title="Get the Consumer Key and Secret">
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs">
              App Manager → find Aspis Security Scanner<br />
              → View → Manage Consumer Details
            </div>
            <p className="text-sm text-gray-400 mt-3">Copy the <strong className="text-white">Consumer Key</strong> and <strong className="text-white">Consumer Secret</strong> — these become your GitHub secrets.</p>
          </Step>

          <Step n={4} title="Create a Read-Only Integration User">
            <p className="text-sm text-gray-400 mb-2">Never use an admin account for scanner credentials. Create a dedicated user:</p>
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs">
              Setup → Users → New User<br />
              → Profile: <span className="text-green-300">Read Only</span><br />
              → Username: <span className="text-green-300">aspis-scanner@[clientdomain].com</span><br />
              → License: Salesforce (or Integration)
            </div>
            <p className="text-sm text-gray-400 mt-3">Note the user's password and security token:</p>
            <div className="text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 font-mono text-xs mt-2">
              Log in as the integration user → My Settings<br />
              → Personal → Reset My Security Token
            </div>
            <p className="text-sm text-gray-400 mt-2">The token is emailed to the user's address. Append it to the password when storing as a secret.</p>
          </Step>

          <Step n={5} title="Add Secrets to the Client's GitHub Scan Repo">
            <div className="space-y-2">
              {[
                { name: 'SF_CLIENT_ID', desc: 'Consumer Key from Step 3' },
                { name: 'SF_CLIENT_SECRET', desc: 'Consumer Secret from Step 3' },
                { name: 'SF_USERNAME', desc: 'Integration user email from Step 4' },
                { name: 'SF_PASSWORD', desc: 'Password + security token (concatenated, no space)' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <code className="text-xs text-green-300 font-mono w-40 shrink-0">{s.name}</code>
                  <span className="text-xs text-gray-500">{s.desc}</span>
                  <CopyButton text={s.name} />
                </div>
              ))}
            </div>
            <div className="mt-3 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-300">
              ⚠️ SF_PASSWORD = password + security token with no separator. E.g. if password is <code>MyPass1!</code> and token is <code>abc123</code>, store <code>MyPass1!abc123</code>
            </div>
          </Step>

          <Step n={6} title="What Aspis Checks in Salesforce">
            <p className="text-sm text-gray-400 mb-2">Once connected, Steampipe audits:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Guest user permissions',
                'Public sharing model',
                'Profiles with Modify All Data',
                'Profiles with View All Data',
                'External sharing settings',
                'Connected app access policies',
                'Field-level security gaps',
                'Password policies',
              ].map(check => (
                <div key={check} className="text-xs text-gray-400 bg-gray-800 rounded px-2 py-1.5">
                  ✓ {check}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">These are the exact misconfiguration patterns used in the McGraw Hill (13.5M records) and Marcus &amp; Millichap (1.8M records) breaches in 2026.</p>
          </Step>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          {done ? (
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <span>✓</span> Salesforce connection marked complete — returning to client…
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Once the Connected App is active and secrets are added:</p>
              <button
                onClick={markComplete}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving…' : 'Mark Salesforce as configured ✓'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
