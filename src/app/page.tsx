import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'var(--ink)' }}>

      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(59,158,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,158,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)',
      }} />

      {/* Glow blobs */}
      <div className="absolute pointer-events-none" style={{
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,158,255,0.10), transparent 70%)',
        filter: 'blur(80px)', top: -100, right: -100,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,160,0.07), transparent 70%)',
        filter: 'blur(80px)', bottom: 0, left: '10%',
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 w-full">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 mb-8" style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--teal)',
        }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--teal)', boxShadow: '0 0 10px var(--teal)' }} />
          A CyberShield Technologies Product
        </div>

        {/* Headline */}
        <h1 className="mb-6" style={{
          fontFamily: 'var(--font-serif)', fontWeight: 400,
          fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)', lineHeight: 1.1,
          color: 'var(--text-primary)',
        }}>
          Security posture for{' '}
          <em style={{
            fontStyle: 'italic',
            background: 'var(--grad-brand)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            every SMB
          </em>
        </h1>

        {/* Subhead */}
        <p className="mb-10 max-w-2xl" style={{
          fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
          color: 'var(--text-secondary)', lineHeight: 1.75,
        }}>
          Continuous misconfiguration scanning across M365, Azure, and Salesforce.
          No enterprise contract. No agents. No complexity.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-16">
          <Link href="/onboarding" className="btn-primary-cs">
            Add your first client →
          </Link>
          <Link href="/dashboard" className="btn-ghost-cs">
            View dashboard
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-8 pt-8" style={{
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { value: '1,700+', label: 'Security checks', sub: 'M365 · Azure · AWS' },
            { value: '70+',    label: 'Compliance frameworks', sub: 'CIS · HIPAA · SOC2 · PCI' },
            { value: '< 5 min', label: 'Time to first scan', sub: 'OAuth onboarding' },
            { value: '$0',     label: 'Agent install cost', sub: 'Read-only OAuth only' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-8">
              {i > 0 && <div style={{ width: 1, height: 36, background: 'var(--border)' }} />}
              <div>
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {s.value}
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 2 }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance pills */}
        <div className="flex flex-wrap gap-3 mt-8">
          {['CIS Benchmarks', 'HIPAA', 'SOC 2', 'PCI-DSS', 'CISA-SCuBA', 'GLBA', 'NIST CSF', 'MS-ISAC'].map(f => (
            <span key={f} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em',
              color: 'var(--text-secondary)', background: 'rgba(59,158,255,0.07)',
              border: '1px solid rgba(59,158,255,0.15)', padding: '5px 14px', borderRadius: 100,
            }}>
              {f}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
