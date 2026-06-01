'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

const SLIDE_DURATION = 24000 // 24s × 10 slides = 4 min
const TOTAL_SLIDES = 10

// ─── shared style tokens ────────────────────────────────────────────────────
const s = {
  ink:     '#0a0f1a',
  ink2:    '#0f1826',
  ink3:    '#162030',
  blue:    '#3b9eff',
  teal:    '#00d4a0',
  text:    '#e8f2ff',
  sec:     '#7fa0c0',
  muted:   '#3d6080',
  border:  'rgba(59,158,255,0.12)',
  borderS: 'rgba(255,255,255,0.06)',
  grad:    'linear-gradient(135deg,#3b9eff,#00d4a0)',
  serif:   "'DM Serif Display',Georgia,serif",
  sans:    "'DM Sans',system-ui,sans-serif",
  mono:    "'IBM Plex Mono','Courier New',monospace",
}

// ─── mini UI components ─────────────────────────────────────────────────────

function Badge({ children, color = s.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
      background: `${color}18`, color, border: `1px solid ${color}35`,
      padding: '3px 8px', borderRadius: 4 }}>
      {children}
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: s.mono, fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase' as const,
      color: s.teal, marginBottom: 12 }}>
      {children}
    </p>
  )
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, padding: '20px 22px', ...style }}>
      {children}
    </div>
  )
}

function SevBadge({ sev }: { sev: string }) {
  const colors: Record<string, string> = { critical: '#ff5757', high: '#ff9f43', medium: '#ffd32a', low: s.blue }
  const c = colors[sev] || s.muted
  return <span style={{ fontFamily: s.mono, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    background: `${c}15`, color: c, border: `1px solid ${c}30`, padding: '2px 7px', borderRadius: 4 }}>{sev}</span>
}

function FindingRow({ sev, title, service, check, resolved = false }:
  { sev: string; title: string; service: string; check: string; resolved?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: `1px solid ${s.borderS}`, opacity: resolved ? 0.45 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <SevBadge sev={sev} />
        <span style={{ fontFamily: s.mono, fontSize: '0.62rem', color: s.muted, flexShrink: 0 }}>{service}</span>
        <span style={{ fontSize: '0.82rem', color: resolved ? s.muted : s.text,
          textDecoration: resolved ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
        {!resolved ? (
          <>
            <span style={{ fontFamily: s.mono, fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4,
              background: `${s.teal}12`, color: s.teal, border: `1px solid ${s.teal}30` }}>✓ Resolved</span>
            <span style={{ fontFamily: s.mono, fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4,
              background: `${s.borderS}`, color: s.muted, border: `1px solid ${s.borderS}` }}>Accept Risk</span>
          </>
        ) : (
          <span style={{ fontFamily: s.mono, fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4,
            background: `${s.teal}12`, color: s.teal, border: `1px solid ${s.teal}30` }}>✓ Resolved</span>
        )}
      </div>
    </div>
  )
}

function PostureGrade({ grade, label }: { grade: string; label: string }) {
  const colors: Record<string, string> = { A: s.teal, B: s.blue, C: '#ffd32a', D: '#ff9f43', F: '#ff5757' }
  const c = colors[grade] || s.muted
  return (
    <div style={{ width: 56, height: 56, borderRadius: 12, background: `${c}12`, border: `1px solid ${c}30`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: s.serif, fontSize: '1.8rem', lineHeight: 1, color: c }}>{grade}</span>
      <span style={{ fontFamily: s.mono, fontSize: '0.52rem', color: s.muted, letterSpacing: '0.1em', marginTop: 1 }}>{label}</span>
    </div>
  )
}

function ClientRow({ name, industry, grade, gradeLabel, criticals, tier, modules }:
  { name: string; industry: string; grade: string; gradeLabel: string; criticals: number; tier: string; modules: string[] }) {
  const tierColors: Record<string, string> = { starter: s.muted, business: s.blue, managed: s.teal }
  const tc = tierColors[tier] || s.muted
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: `1px solid ${s.borderS}` }}>
      <PostureGrade grade={grade} label={gradeLabel} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: s.text }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: s.muted, marginTop: 2 }}>{industry}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {criticals > 0 && <span style={{ fontFamily: s.mono, fontSize: '0.6rem', background: 'rgba(255,85,85,0.12)',
          color: '#ff5757', border: '1px solid rgba(255,85,85,0.25)', padding: '3px 8px', borderRadius: 100 }}>
          {criticals} critical
        </span>}
        <span style={{ fontFamily: s.mono, fontSize: '0.6rem', background: `${tc}12`, color: tc,
          border: `1px solid ${tc}30`, padding: '3px 8px', borderRadius: 100 }}>{tier}</span>
        {modules.map(m => (
          <span key={m} style={{ fontFamily: s.mono, fontSize: '0.58rem', background: s.borderS, color: s.muted,
            border: `1px solid ${s.borderS}`, padding: '2px 7px', borderRadius: 3 }}>{m}</span>
        ))}
      </div>
    </div>
  )
}

// ─── SLIDES ─────────────────────────────────────────────────────────────────

function Slide1() {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', overflow: 'hidden' }}>
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(59,158,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,158,255,0.04) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)' }} />
      {/* Glows */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(59,158,255,0.10),transparent 70%)',
        filter: 'blur(60px)', top: -100, right: -50, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(0,212,160,0.07),transparent 70%)',
        filter: 'blur(60px)', bottom: -50, left: '5%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: s.mono,
          fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: s.teal, marginBottom: 24 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.teal,
            boxShadow: `0 0 10px ${s.teal}` }} />
          CyberShield Technologies · Aspis Platform Demo
        </div>

        <h1 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(2.4rem,4.5vw,3.8rem)',
          lineHeight: 1.1, color: s.text, marginBottom: 20 }}>
          Security posture for{' '}
          <em style={{ fontStyle: 'italic', background: s.grad,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            every SMB
          </em>
        </h1>

        <p style={{ fontSize: '1.05rem', color: s.sec, lineHeight: 1.75, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          Continuous misconfiguration scanning across M365, Azure, and Salesforce.
          No enterprise contract. No agent install. Results in minutes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, paddingTop: 32,
          borderTop: `1px solid ${s.border}` }}>
          {[
            { v: '1,700+', l: 'Security checks' },
            { v: '70+',    l: 'Compliance frameworks' },
            { v: '3',      l: 'SaaS platforms' },
            { v: '< 5 min', l: 'Time to first scan' },
          ].map((st, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: s.serif, fontSize: '1.6rem', color: s.text, display: 'block', lineHeight: 1.2 }}>{st.v}</span>
              <span style={{ fontFamily: s.mono, fontSize: '0.68rem', letterSpacing: '0.08em', color: s.muted, marginTop: 4, display: 'block' }}>{st.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Slide2() {
  const threats = [
    { icon: '⚠️', platform: 'Microsoft 365', color: s.blue,
      headline: 'Kali365 — FBI PSA May 2026',
      body: 'Phishing-as-a-service kit bypasses MFA via OAuth Device Code flow. $250/month. Hits hundreds of M365 tenants across legal, healthcare, and financial services.',
      stat: '300+ SMBs hit' },
    { icon: '⚠️', platform: 'Salesforce', color: '#ff9f43',
      headline: 'ShinyHunters — April 2026',
      body: 'Exploited misconfigured Salesforce Experience Cloud guest user permissions. 13.5M records exposed at McGraw Hill. Same misconfiguration exists in thousands of SMB orgs.',
      stat: '300–400 orgs affected' },
    { icon: '⚠️', platform: 'Azure / M365', color: '#ff5757',
      headline: 'Silent Ransom Group — 2026',
      body: 'Vishing attacks on law firm helpdesks to steal M365 credentials. 38 law firms breached, 3.6GB of client data published. No ransomware — pure data extortion.',
      stat: '38 law firms in 2026' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>The threat landscape · 2026</Eyebrow>
      <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.6rem,2.8vw,2.4rem)', color: s.text, marginBottom: 8 }}>
        Your clients are being targeted. Right now.
      </h2>
      <p style={{ color: s.sec, fontSize: '0.95rem', marginBottom: 32, lineHeight: 1.6 }}>
        These aren't hypothetical risks. These are active campaigns from Q1–Q2 2026 targeting the exact platforms your SMB clients use every day.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {threats.map((t, i) => (
          <div key={i} style={{ background: s.ink2, border: `1px solid ${t.color}20`,
            borderRadius: 16, padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${t.color},transparent)` }} />
            <Badge color={t.color}>{t.platform}</Badge>
            <h3 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '1.05rem', color: s.text, margin: '12px 0 8px', lineHeight: 1.3 }}>{t.headline}</h3>
            <p style={{ fontSize: '0.78rem', color: s.sec, lineHeight: 1.65, marginBottom: 14 }}>{t.body}</p>
            <div style={{ fontFamily: s.mono, fontSize: '0.68rem', letterSpacing: '0.08em', color: t.color,
              background: `${t.color}10`, border: `1px solid ${t.color}25`, padding: '4px 10px',
              borderRadius: 100, display: 'inline-block' }}>{t.stat}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Slide3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>Step 1 · Client onboarding</Eyebrow>
      <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.5rem,2.5vw,2.2rem)', color: s.text, marginBottom: 24 }}>
        Add a client in 4 steps. Under 5 minutes.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' }}>
        {/* Steps list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { n: '1', title: 'Client profile', detail: 'Company name, industry, headcount, pricing tier' },
            { n: '2', title: 'Connect environments', detail: 'Select M365, Azure, and/or Salesforce — no agent install' },
            { n: '3', title: 'Enable modules', detail: 'Posture scanning + Tabletop Exercises, Awareness Training, Threat Hunting' },
            { n: '4', title: 'Launch client', detail: 'First scan dispatches automatically. Results in 3–8 minutes' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,158,255,0.12)',
                border: `1px solid rgba(59,158,255,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.mono, fontSize: '0.72rem', color: s.blue, flexShrink: 0 }}>{step.n}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: s.text, marginBottom: 2 }}>{step.title}</div>
                <div style={{ fontSize: '0.78rem', color: s.sec }}>{step.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mock onboarding UI */}
        <div style={{ background: s.ink3, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${s.borderS}` }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: n <= 2 ? 'rgba(59,158,255,0.2)' : s.ink2,
                  border: `1px solid ${n <= 2 ? s.blue : s.borderS}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.mono, fontSize: '0.65rem', color: n <= 2 ? s.blue : s.muted }}>{n}</div>
                {n < 4 && <div style={{ flex: 1, height: 1, background: n < 2 ? `rgba(59,158,255,0.3)` : s.borderS }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '1.1rem', color: s.text, marginBottom: 4 }}>Connect environments</div>
            <div style={{ fontSize: '0.78rem', color: s.muted, marginBottom: 14 }}>Select what to scan. Credentials added per-client in GitHub Actions secrets.</div>
            {[
              { key: 'm365', label: 'Microsoft 365 / Entra ID', badge: 'Maester + Prowler', checked: true },
              { key: 'azure', label: 'Microsoft Azure', badge: 'Prowler', checked: true },
              { key: 'sf', label: 'Salesforce', badge: 'Steampipe', checked: true },
            ].map(env => (
              <div key={env.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                background: env.checked ? 'rgba(59,158,255,0.06)' : 'transparent',
                border: `1px solid ${env.checked ? `rgba(59,158,255,0.25)` : s.borderS}`,
                borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: env.checked ? s.blue : 'transparent',
                  border: `1.5px solid ${env.checked ? s.blue : s.muted}`, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {env.checked && <span style={{ color: '#fff', fontSize: '0.6rem', lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: '0.8rem', color: s.text, flex: 1 }}>{env.label}</span>
                <Badge>{env.badge}</Badge>
              </div>
            ))}
            <div style={{ marginTop: 12, background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 6, padding: '8px 12px',
              fontSize: '0.72rem', color: s.muted }}>
              <strong style={{ color: s.sec }}>No agent install required.</strong> Scans run via GitHub Actions using read-only OAuth credentials. Nothing touches client systems.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Slide4({ tick }: { tick: number }) {
  const checks = [
    'AuditLog.Read.All', 'Directory.Read.All', 'Policy.Read.All',
    'SecurityEvents.Read.All', 'IdentityRiskyUser.Read.All', 'RoleManagement.Read.All',
    'User.Read.All', 'Group.Read.All', 'Reports.Read.All',
    'Organization.Read.All', 'Application.Read.All', 'DeviceManagementConfiguration.Read.All',
  ]
  const shown = Math.min(checks.length, Math.floor((tick % SLIDE_DURATION) / (SLIDE_DURATION / checks.length)) + 1)
  const pct = Math.round((shown / checks.length) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>Step 2 · M365 scan in progress</Eyebrow>
      <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.5rem,2.5vw,2.2rem)', color: s.text, marginBottom: 6 }}>
        Maester running {checks.length} Entra ID checks
      </h2>
      <p style={{ color: s.sec, fontSize: '0.9rem', marginBottom: 24 }}>
        Harrington &amp; Associates LLP · Dispatched via GitHub Actions · Read-only OAuth
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: s.mono, fontSize: '0.72rem', color: s.teal, letterSpacing: '0.12em' }}>SCAN PROGRESS</span>
              <span style={{ fontFamily: s.mono, fontSize: '0.72rem', color: s.text }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: s.ink3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: s.grad, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: s.mono, fontSize: '0.65rem', color: s.muted }}>
              <span>{shown} / {checks.length} checks</span>
              <span style={{ color: s.teal }}>● RUNNING</span>
            </div>
          </Card>
          {[
            { label: 'Scanner',   value: 'Maester' },
            { label: 'Target',    value: 'Entra ID / M365' },
            { label: 'Tenant',    value: 'harrington-law.com' },
            { label: 'Triggered', value: 'Manual → via Aspis' },
            { label: 'Est. time', value: '3–8 minutes' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
              borderBottom: `1px solid ${s.borderS}`, fontFamily: s.mono, fontSize: '0.68rem' }}>
              <span style={{ color: s.muted }}>{r.label}</span>
              <span style={{ color: s.sec }}>{r.value}</span>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.muted, marginBottom: 10 }}>CHECKS RUNNING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflow: 'hidden' }}>
            {checks.slice(0, shown).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: s.mono, fontSize: '0.68rem',
                color: i === shown - 1 ? s.teal : s.muted }}>
                <span style={{ color: i < shown - 1 ? s.teal : s.blue }}>{i < shown - 1 ? '✓' : '●'}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Slide5() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>M365 findings · Harrington &amp; Associates LLP</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.4rem,2.5vw,2rem)', color: s.text, marginBottom: 6, lineHeight: 1.2 }}>
            Grade <span style={{ background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>F</span> — Critical Risk
          </div>
          <p style={{ fontSize: '0.85rem', color: s.sec, marginBottom: 20, lineHeight: 1.6 }}>Legal · 18 employees · Starter tier</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[['3','critical','#ff5757'],['3','high','#ff9f43'],['3','medium','#ffd32a']].map(([n,l,c]) => (
              <div key={l} style={{ background: `${c}0e`, border: `1px solid ${c}25`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.serif, fontSize: '1.6rem', color: c, lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: s.mono, fontSize: '0.6rem', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.muted, marginBottom: 8 }}>SCAN DETAILS</div>
            {[
              { k: 'Scanner',   v: 'Maester' },
              { k: 'Duration',  v: '6m 42s' },
              { k: 'Checks run', v: '211' },
              { k: 'Framework',  v: 'CIS-M365, CISA-SCuBA' },
            ].map(r => (
              <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                fontFamily: s.mono, fontSize: '0.68rem', borderBottom: `1px solid ${s.borderS}` }}>
                <span style={{ color: s.muted }}>{r.k}</span>
                <span style={{ color: s.sec }}>{r.v}</span>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.borderS}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '0.95rem', color: s.text }}>Findings</span>
            <div style={{ display: 'flex', gap: 8, fontFamily: s.mono, fontSize: '0.65rem' }}>
              <span style={{ color: '#ff5757' }}>9 open</span>
            </div>
          </div>
          {[
            { sev: 'critical', title: 'Legacy authentication protocols not blocked', service: 'entra_id' },
            { sev: 'critical', title: 'Admin accounts without MFA enforcement', service: 'entra_id' },
            { sev: 'critical', title: 'External email forwarding to Gmail (jharrington@)', service: 'exchange' },
            { sev: 'high',     title: 'Stale guest accounts with active SharePoint access', service: 'entra_id' },
            { sev: 'high',     title: 'Audit logging not enabled — CISA-SCuBA required', service: 'sharepoint' },
            { sev: 'high',     title: 'SharePoint external sharing set to "Anyone"', service: 'sharepoint' },
            { sev: 'medium',   title: 'Users can register OAuth applications', service: 'entra_id' },
            { sev: 'medium',   title: 'Self-service password reset not configured', service: 'entra_id' },
            { sev: 'medium',   title: 'Conditional Access: risky sign-ins not blocked', service: 'entra_id' },
          ].map((f, i) => <FindingRow key={i} {...f} check="" />)}
        </div>
      </div>
    </div>
  )
}

function Slide6() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>Azure findings · Meridian Capital Advisors</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.4rem,2.5vw,2rem)', color: s.text, marginBottom: 6, lineHeight: 1.2 }}>
            Grade <span style={{ color: '#ff9f43' }}>D</span> — Poor
          </div>
          <p style={{ fontSize: '0.85rem', color: s.sec, marginBottom: 20, lineHeight: 1.6 }}>Financial Services · 11 employees · Managed tier</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[['2','critical','#ff5757'],['4','high','#ff9f43'],['2','medium','#ffd32a']].map(([n,l,c]) => (
              <div key={l} style={{ background: `${c}0e`, border: `1px solid ${c}25`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.serif, fontSize: '1.6rem', color: c, lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: s.mono, fontSize: '0.6rem', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.muted, marginBottom: 8 }}>WHY THIS MATTERS</div>
            <p style={{ fontSize: '0.78rem', color: s.sec, lineHeight: 1.65 }}>
              ShinyHunters used the exact same pattern — single credential compromise → Salesforce bulk access → 47,876 customer records. Ameriprise Financial, March 2026.
            </p>
          </Card>
        </div>

        <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.borderS}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '0.95rem', color: s.text }}>Findings</span>
            <div style={{ display: 'flex', gap: 8, fontFamily: s.mono, fontSize: '0.65rem' }}>
              <span style={{ color: '#ff5757' }}>7 open</span>
              <span style={{ color: s.teal }}>1 resolved</span>
            </div>
          </div>
          {[
            { sev: 'critical', title: 'Storage account "stmeridianbackups" — public blob access', service: 'azure_storage' },
            { sev: 'critical', title: 'MFA not enforced for Azure subscription Owner role', service: 'entra_id' },
            { sev: 'high',     title: 'Azure Activity Log retention < 365 days (GLBA)', service: 'azure_monitor' },
            { sev: 'high',     title: 'Microsoft Defender for Cloud not enabled', service: 'azure_defender' },
            { sev: 'high',     title: 'NSG allows unrestricted RDP access (0.0.0.0/0)', service: 'azure_network' },
            { sev: 'high',     title: 'Key Vault purge protection not enabled', service: 'azure_keyvault' },
            { sev: 'medium',   title: 'SQL Server auditing disabled — sql-meridian-crm', service: 'azure_sql' },
            { sev: 'medium',   title: 'Guest users have member-level directory permissions', service: 'entra_id', resolved: true },
          ].map((f, i) => <FindingRow key={i} {...f} check="" />)}
        </div>
      </div>
    </div>
  )
}

function Slide7() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>Salesforce findings · Lakeside Medical Group</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.4rem,2.5vw,2rem)', color: s.text, marginBottom: 6, lineHeight: 1.2 }}>
            Grade <span style={{ color: '#ff5757' }}>F</span> — Critical Risk
          </div>
          <p style={{ fontSize: '0.85rem', color: s.sec, marginBottom: 20, lineHeight: 1.6 }}>Healthcare · 42 employees · Business tier</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[['3','critical','#ff5757'],['3','high','#ff9f43'],['2','medium','#ffd32a']].map(([n,l,c]) => (
              <div key={l} style={{ background: `${c}0e`, border: `1px solid ${c}25`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: s.serif, fontSize: '1.6rem', color: c, lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: s.mono, fontSize: '0.6rem', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.muted, marginBottom: 8 }}>BREACH REFERENCE</div>
            <p style={{ fontSize: '0.78rem', color: s.sec, lineHeight: 1.65 }}>
              McGraw Hill: Salesforce Experience Cloud guest user over-permission exposed 13.5M accounts. ShinyHunters, April 2026. Same misconfiguration pattern.
            </p>
          </Card>
        </div>

        <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.borderS}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '0.95rem', color: s.text }}>Findings</span>
              <span style={{ fontFamily: s.mono, fontSize: '0.65rem', color: s.muted, marginLeft: 10 }}>Steampipe · Salesforce</span>
            </div>
            <span style={{ fontFamily: s.mono, fontSize: '0.65rem', color: '#ff5757' }}>8 open</span>
          </div>
          {[
            { sev: 'critical', title: 'PHI accessible in unstructured email content — no DLP', service: 'exchange' },
            { sev: 'critical', title: 'Salesforce Experience Cloud: guest users have API access', service: 'salesforce' },
            { sev: 'critical', title: 'Default org-wide sharing: Accounts set to Public Read/Write', service: 'salesforce' },
            { sev: 'high',     title: 'Profile "Custom: Sales Rep" has Modify All Data permission', service: 'salesforce' },
            { sev: 'high',     title: 'Connected App allows all users — no IP restriction', service: 'salesforce' },
            { sev: 'high',     title: 'Password policy: no complexity requirement enforced', service: 'salesforce' },
            { sev: 'medium',   title: 'Field-level security: SSN visible to 12 profiles', service: 'salesforce' },
            { sev: 'medium',   title: 'Sharing rules allow external community members read access', service: 'salesforce' },
          ].map((f, i) => <FindingRow key={i} {...f} check="" />)}
        </div>
      </div>
    </div>
  )
}

function Slide8() {
  const [resolved, setResolved] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [grade, setGrade] = useState('F')

  useEffect(() => {
    const t1 = setTimeout(() => { setResolved([0]); }, 1200)
    const t2 = setTimeout(() => { setResolved([0,2]); setGrade('D'); }, 3000)
    const t3 = setTimeout(() => { setShowModal(true); }, 5000)
    const t4 = setTimeout(() => { setShowModal(false); setResolved([0,2,1]); setGrade('C'); }, 8000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); }
  }, [])

  const gradeColors: Record<string,string> = { F:'#ff5757',D:'#ff9f43',C:'#ffd32a' }
  const gc = gradeColors[grade] || '#ff5757'

  const findings = [
    { sev: 'critical', title: 'Legacy authentication protocols not blocked', service: 'entra_id' },
    { sev: 'critical', title: 'Admin accounts without MFA enforcement', service: 'entra_id' },
    { sev: 'critical', title: 'External email forwarding to Gmail', service: 'exchange' },
    { sev: 'high',     title: 'Stale guest accounts with active access', service: 'entra_id' },
    { sev: 'high',     title: 'Audit logging not enabled', service: 'sharepoint' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
      {showModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 12 }}>
          <div style={{ background: s.ink3, border: `1px solid ${s.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: '90%' }}>
            <h3 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '1.3rem', color: s.text, marginBottom: 6 }}>Accept Risk</h3>
            <p style={{ fontSize: '0.85rem', color: s.sec, marginBottom: 16 }}>Document why this risk is accepted. This becomes a compliance artifact.</p>
            <div style={{ background: s.ink2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px',
              fontSize: '0.85rem', color: s.sec, fontStyle: 'italic', marginBottom: 14 }}>
              "Admin MFA being rolled out Q3. Covered by dedicated SOC monitoring until then. Approved by CISO 2026-06-01."
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={{ fontFamily: s.mono, fontSize: '0.72rem', padding: '7px 16px', borderRadius: 6, background: 'transparent', color: s.muted, border: `1px solid ${s.borderS}`, cursor: 'pointer' }}>Cancel</button>
              <button style={{ fontFamily: s.mono, fontSize: '0.72rem', padding: '7px 16px', borderRadius: 6, background: `${s.teal}15`, color: s.teal, border: `1px solid ${s.teal}30`, cursor: 'pointer' }}>Accept Risk</button>
            </div>
          </div>
        </div>
      )}

      <Eyebrow>Step 3 · Remediation workflow</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.6fr', gap: 20, alignItems: 'start' }}>
        <div>
          <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.3rem,2.2vw,1.9rem)', color: s.text, marginBottom: 12 }}>
            Findings become tasks. Track every fix.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { c: s.teal, label: '✓ Resolved', desc: 'Fix applied — confirmed next scan' },
              { c: s.muted, label: 'Accept Risk', desc: 'Documented exception with reason' },
            ].map(a => (
              <div key={a.label} style={{ background: `${a.c}08`, border: `1px solid ${a.c}20`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontFamily: s.mono, fontSize: '0.68rem', color: a.c, marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontSize: '0.75rem', color: s.sec }}>{a.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.muted, marginBottom: 8 }}>POSTURE SCORE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${gc}12`, border: `1px solid ${gc}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: s.serif, fontSize: '2rem', color: gc, lineHeight: 1, transition: 'color 0.5s' }}>{grade}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: s.text, fontWeight: 600 }}>
                  {grade === 'F' ? 'Critical Risk' : grade === 'D' ? 'Poor' : 'Fair'}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: '0.65rem', color: s.muted, marginTop: 2 }}>
                  {resolved.length} finding{resolved.length !== 1 ? 's' : ''} resolved
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.borderS}` }}>
            <span style={{ fontFamily: s.serif, fontWeight: 400, fontSize: '0.95rem', color: s.text }}>Findings</span>
            <span style={{ fontFamily: s.mono, fontSize: '0.65rem', color: '#ff5757', marginLeft: 10 }}>{findings.length - resolved.length} open</span>
            {resolved.length > 0 && <span style={{ fontFamily: s.mono, fontSize: '0.65rem', color: s.teal, marginLeft: 8 }}>{resolved.length} resolved</span>}
          </div>
          {findings.map((f, i) => <FindingRow key={i} {...f} check="" resolved={resolved.includes(i)} />)}
        </div>
      </div>
    </div>
  )
}

function Slide9() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      <Eyebrow>Operator dashboard · All clients</Eyebrow>
      <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(1.5rem,2.5vw,2.2rem)', color: s.text, marginBottom: 20 }}>
        Your entire practice. One screen.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        {[
          { n: '3', l: 'Active clients' },
          { n: '25', l: 'Open findings' },
          { n: '8', l: 'Critical', alert: true },
        ].map(st => (
          <div key={st.l} style={{ background: st.alert ? 'rgba(255,85,85,0.06)' : s.ink2,
            border: `1px solid ${st.alert ? 'rgba(255,85,85,0.2)' : s.borderS}`,
            borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontFamily: s.serif, fontSize: '2.4rem', color: st.alert ? '#ff5757' : s.text, lineHeight: 1.1 }}>{st.n}</div>
            <div style={{ fontFamily: s.mono, fontSize: '0.68rem', letterSpacing: '0.06em', color: s.muted, marginTop: 4 }}>{st.l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: s.ink2, border: `1px solid ${s.borderS}`, borderRadius: 16, overflow: 'hidden' }}>
        <ClientRow name="Harrington & Associates LLP" industry="Legal" grade="F" gradeLabel="Critical Risk" criticals={3} tier="starter" modules={['posture','ttx']} />
        <ClientRow name="Lakeside Medical Group" industry="Healthcare" grade="F" gradeLabel="Critical Risk" criticals={3} tier="business" modules={['posture']} />
        <ClientRow name="Meridian Capital Advisors" industry="Financial Services" grade="D" gradeLabel="Poor" criticals={2} tier="managed" modules={['posture','ttx']} />
      </div>
      <p style={{ fontSize: '0.82rem', color: s.muted, marginTop: 14, fontStyle: 'italic' }}>
        Grades recalculate automatically after every scan. Drill into any client with one click.
      </p>
    </div>
  )
}

function Slide10() {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(59,158,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,158,255,0.04) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)' }} />
      <div style={{ position: 'absolute', width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(59,158,255,0.10),transparent 70%)',
        filter: 'blur(60px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
        <Eyebrow>Get started today</Eyebrow>
        <h2 style={{ fontFamily: s.serif, fontWeight: 400, fontSize: 'clamp(2rem,4vw,3.2rem)', color: s.text, marginBottom: 16, lineHeight: 1.1 }}>
          Ready to scan your{' '}
          <em style={{ fontStyle: 'italic', background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            first client?
          </em>
        </h2>
        <p style={{ fontSize: '1rem', color: s.sec, lineHeight: 1.75, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
          First scan is free. No enterprise contract. No agent install.
          Read-only OAuth credentials only. Results in under 8 minutes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 40 }}>
          <Link href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: s.grad, color: '#fff', padding: '14px 28px', borderRadius: 8, fontWeight: 600,
            fontSize: '0.9rem', boxShadow: '0 4px 24px rgba(59,158,255,0.3)',
            textDecoration: 'none', fontFamily: s.sans }}>
            Add your first client →
          </Link>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,158,255,0.08)', color: s.blue, border: '1px solid rgba(59,158,255,0.2)',
            padding: '14px 28px', borderRadius: 8, fontWeight: 600,
            fontSize: '0.9rem', textDecoration: 'none', fontFamily: s.sans }}>
            View demo dashboard
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' as const }}>
          {['M365 & Entra ID','Microsoft Azure','Salesforce','CIS · HIPAA · SOC2 · PCI-DSS'].map(t => (
            <span key={t} style={{ fontFamily: s.mono, fontSize: '0.68rem', letterSpacing: '0.1em',
              color: s.sec, background: 'rgba(59,158,255,0.06)', border: `1px solid rgba(59,158,255,0.15)`,
              padding: '4px 12px', borderRadius: 100 }}>{t}</span>
          ))}
        </div>
        <p style={{ fontFamily: s.mono, fontSize: '0.7rem', color: s.muted, marginTop: 32 }}>
          aspis.cybershield-llc.com · CyberShield Technologies, LLC
        </p>
      </div>
    </div>
  )
}

// ─── SLIDE METADATA ─────────────────────────────────────────────────────────
const SLIDES = [
  { title: 'Platform overview',       component: () => <Slide1 /> },
  { title: 'The 2026 threat landscape', component: () => <Slide2 /> },
  { title: 'Client onboarding',       component: () => <Slide3 /> },
  { title: 'M365 scan in progress',   component: ({ tick }: { tick: number }) => <Slide4 tick={tick} /> },
  { title: 'M365 findings',           component: () => <Slide5 /> },
  { title: 'Azure findings',          component: () => <Slide6 /> },
  { title: 'Salesforce findings',     component: () => <Slide7 /> },
  { title: 'Remediation workflow',    component: () => <Slide8 /> },
  { title: 'Operator dashboard',      component: () => <Slide9 /> },
  { title: 'Get started',             component: () => <Slide10 /> },
]

// ─── DEMO PLAYER ─────────────────────────────────────────────────────────────
export function DemoPlayer() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(0)

  const advance = useCallback((dir = 1) => {
    setCurrent(c => Math.max(0, Math.min(TOTAL_SLIDES - 1, c + dir)))
    setProgress(0)
    tickRef.current = 0
    setTick(0)
  }, [])

  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => {
      tickRef.current += 100
      setTick(tickRef.current)
      setProgress(tickRef.current / SLIDE_DURATION)
      if (tickRef.current >= SLIDE_DURATION) {
        setCurrent(c => {
          if (c < TOTAL_SLIDES - 1) {
            tickRef.current = 0
            setProgress(0)
            setTick(0)
            return c + 1
          }
          return c
        })
      }
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused, current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') advance(1)
      if (e.key === 'ArrowLeft')  advance(-1)
      if (e.key === ' ')          setPaused(p => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  const SlideComponent = SLIDES[current].component

  return (
    <div style={{ position: 'fixed', inset: 0, background: s.ink, display: 'flex', flexDirection: 'column',
      fontFamily: s.sans, color: s.text }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 52, borderBottom: `1px solid ${s.borderS}`, flexShrink: 0,
        background: `${s.ink2}dd`, backdropFilter: 'blur(12px)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem', fontFamily: s.sans }}>A</span>
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: s.text }}>Aspis</span>
            <span style={{ fontSize: '0.75rem', color: s.muted, marginLeft: 8 }}>by CyberShield</span>
          </div>
          <div style={{ marginLeft: 16, background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.2)',
            borderRadius: 100, padding: '3px 12px', fontFamily: s.mono, fontSize: '0.65rem', letterSpacing: '0.1em', color: s.blue }}>
            PLATFORM DEMO
          </div>
        </div>

        {/* Slide title */}
        <div style={{ fontFamily: s.mono, fontSize: '0.72rem', letterSpacing: '0.1em', color: s.sec }}>
          {SLIDES[current].title.toUpperCase()}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => advance(-1)} disabled={current === 0} style={{
            fontFamily: s.mono, fontSize: '0.75rem', padding: '5px 12px', borderRadius: 6, cursor: current === 0 ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.04)', color: current === 0 ? s.muted : s.sec, border: `1px solid ${s.borderS}`, opacity: current === 0 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <button onClick={() => setPaused(p => !p)} style={{
            fontFamily: s.mono, fontSize: '0.75rem', padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
            background: paused ? `rgba(0,212,160,0.1)` : 'rgba(255,255,255,0.04)',
            color: paused ? s.teal : s.sec, border: `1px solid ${paused ? s.teal+'30' : s.borderS}` }}>
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
          <button onClick={() => advance(1)} disabled={current === TOTAL_SLIDES - 1} style={{
            fontFamily: s.mono, fontSize: '0.75rem', padding: '5px 12px', borderRadius: 6, cursor: current === TOTAL_SLIDES - 1 ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.04)', color: current === TOTAL_SLIDES - 1 ? s.muted : s.sec, border: `1px solid ${s.borderS}`, opacity: current === TOTAL_SLIDES - 1 ? 0.4 : 1 }}>
            Next →
          </button>
          <div style={{ fontFamily: s.mono, fontSize: '0.68rem', color: s.muted, marginLeft: 6 }}>
            {current + 1}/{TOTAL_SLIDES}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: s.ink3, flexShrink: 0 }}>
        <div style={{ height: '100%', background: s.grad, transition: 'width 0.1s linear',
          width: `${(current / TOTAL_SLIDES + progress / TOTAL_SLIDES) * 100}%` }} />
      </div>

      {/* Slide */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, padding: '28px 40px', overflow: 'auto' }}>
          <SlideComponent tick={tick} />
        </div>
      </div>

      {/* Bottom dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 44, borderTop: `1px solid ${s.borderS}`, flexShrink: 0 }}>
        {SLIDES.map((sl, i) => (
          <button key={i} onClick={() => { setCurrent(i); setProgress(0); tickRef.current = 0; setTick(0); }}
            title={sl.title} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, border: 'none',
              cursor: 'pointer', transition: 'width 0.3s, background 0.3s',
              background: i === current ? s.blue : i < current ? `${s.blue}50` : s.muted }} />
        ))}
        <span style={{ fontFamily: s.mono, fontSize: '0.62rem', color: s.muted, marginLeft: 12 }}>
          ← → keys · Space to pause
        </span>
      </div>
    </div>
  )
}
