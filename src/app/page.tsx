import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Now monitoring M365, Azure &amp; Salesforce
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Security posture for<br />
            <span className="text-blue-400">every SMB</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Continuous misconfiguration scanning across your M365, Azure, and Salesforce environments.
            No enterprise contract. No complexity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/onboarding"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Add your first client
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg font-medium transition-colors"
          >
            View dashboard
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 text-left">
          {[
            { label: 'Checks', value: '1,700+', sub: 'M365, Azure, AWS' },
            { label: 'Frameworks', value: '70+', sub: 'CIS, HIPAA, SOC2, PCI' },
            { label: 'Time to first scan', value: '< 5 min', sub: 'OAuth onboarding' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
