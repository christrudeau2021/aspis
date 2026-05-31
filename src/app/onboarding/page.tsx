'use client'

import { useState } from 'react'
import { createClient } from '@/app/actions/clients'

type Step = 'profile' | 'connect' | 'modules' | 'launch'

const INDUSTRIES = [
  'Legal', 'Healthcare', 'Financial Services', 'Real Estate',
  'Manufacturing', 'Professional Services', 'Technology', 'Education', 'Other'
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState({
    name: '', industry: '', employee_count: '', tier: 'starter'
  })

  const [connections, setConnections] = useState({
    m365: false, salesforce: false, azure: false
  })

  const [modules, setModules] = useState({
    posture: true, ttx: false
  })

  async function handleLaunch() {
    setLoading(true)
    setError(null)
    try {
      await createClient({
        name: profile.name,
        industry: profile.industry,
        employee_count: parseInt(profile.employee_count) || 0,
        tier: profile.tier,
        modules: Object.entries(modules).filter(([, v]) => v).map(([k]) => k),
        connections,
      })
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {(['profile', 'connect', 'modules', 'launch'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0
                ${step === s ? 'bg-blue-600 text-white' :
                  ['profile', 'connect', 'modules', 'launch'].indexOf(step) > i
                    ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`h-px flex-1 ${['profile', 'connect', 'modules', 'launch'].indexOf(step) > i ? 'bg-blue-800' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

          {/* Step 1: Client Profile */}
          {step === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Client profile</h2>
              <p className="text-gray-400 text-sm mb-6">Basic information to configure your scans correctly.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Company name</label>
                  <input
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Acme Law LLC"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Industry</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    value={profile.industry}
                    onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Employees</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="25"
                    value={profile.employee_count}
                    onChange={e => setProfile(p => ({ ...p, employee_count: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'starter', label: 'Starter', price: '$299/mo' },
                      { id: 'business', label: 'Business', price: '$799/mo' },
                      { id: 'managed', label: 'Managed', price: '$2,000/mo' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setProfile(p => ({ ...p, tier: t.id }))}
                        className={`border rounded-lg p-3 text-left transition-colors ${profile.tier === t.id ? 'border-blue-500 bg-blue-950' : 'border-gray-700 hover:border-gray-600'}`}
                      >
                        <div className="text-sm font-medium text-white">{t.label}</div>
                        <div className="text-xs text-gray-400">{t.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('connect')}
                disabled={!profile.name || !profile.industry}
                className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Connect SaaS */}
          {step === 'connect' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Connect environments</h2>
              <p className="text-gray-400 text-sm mb-6">Select what to scan. OAuth credentials are added per-client in GitHub Actions secrets.</p>

              <div className="space-y-3">
                {[
                  { key: 'm365', label: 'Microsoft 365 / Entra ID', description: 'M365, SharePoint, Teams, Exchange', badge: 'Maester + Prowler' },
                  { key: 'azure', label: 'Microsoft Azure', description: 'IaaS, PaaS, security posture', badge: 'Prowler' },
                  { key: 'salesforce', label: 'Salesforce', description: 'Sharing model, profiles, guest access', badge: 'Steampipe' },
                ].map(conn => (
                  <label key={conn.key} className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors
                    ${connections[conn.key as keyof typeof connections] ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-blue-500"
                      checked={connections[conn.key as keyof typeof connections]}
                      onChange={e => setConnections(c => ({ ...c, [conn.key]: e.target.checked }))}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{conn.label}</span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{conn.badge}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{conn.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                <strong className="text-gray-300">No agent install required.</strong> Scans run via GitHub Actions using read-only OAuth app credentials you provide. Nothing touches your client&apos;s systems.
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('profile')} className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:border-gray-500 transition-colors">Back</button>
                <button
                  onClick={() => setStep('modules')}
                  disabled={!Object.values(connections).some(Boolean)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Modules */}
          {step === 'modules' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Aspis modules</h2>
              <p className="text-gray-400 text-sm mb-6">Choose what&apos;s active for this client. Add more anytime.</p>

              <div className="space-y-3">
                {[
                  { key: 'posture', label: 'Security Posture', description: 'Continuous misconfiguration scanning', required: true },
                  { key: 'ttx', label: 'Tabletop Exercises', description: 'Scenario-based incident response exercises', required: false },
                  { key: 'awareness', label: 'Security Awareness', description: 'Phishing simulations + training', required: false, soon: true },
                  { key: 'threat-hunting', label: 'Threat Hunting (Axiom)', description: 'Log-based proactive threat hunting', required: false, soon: true },
                ].map(mod => (
                  <label key={mod.key} className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors
                    ${mod.soon ? 'opacity-50 cursor-not-allowed border-gray-800' :
                    modules[mod.key as keyof typeof modules] ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-blue-500"
                      checked={mod.required || modules[mod.key as keyof typeof modules]}
                      disabled={mod.required || mod.soon}
                      onChange={e => !mod.soon && setModules(m => ({ ...m, [mod.key]: e.target.checked }))}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{mod.label}</span>
                        {mod.required && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">Required</span>}
                        {mod.soon && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Coming soon</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{mod.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('connect')} className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:border-gray-500 transition-colors">Back</button>
                <button onClick={() => setStep('launch')} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Launch */}
          {step === 'launch' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Ready to launch</h2>
              <p className="text-gray-400 text-sm mb-6">Review your setup and kick off the first scan.</p>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Client</div>
                  <div className="text-white font-medium">{profile.name}</div>
                  <div className="text-sm text-gray-400">{profile.industry} · {profile.employee_count} employees · {profile.tier}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Scanning</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(connections).filter(([, v]) => v).map(([k]) => (
                      <span key={k} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">{k.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Next steps after save</div>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Add OAuth secrets to the client&apos;s GitHub Actions repo</li>
                    <li>First scan triggers automatically within 60 seconds</li>
                    <li>Findings appear in dashboard as they stream in</li>
                  </ol>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-2">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('modules')} className="flex-1 py-2.5 border border-gray-700 text-gray-300 rounded-lg font-medium hover:border-gray-500 transition-colors">Back</button>
                <button
                  onClick={handleLaunch}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Creating client...' : 'Launch client'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
