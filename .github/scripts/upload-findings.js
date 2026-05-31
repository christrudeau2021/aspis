#!/usr/bin/env node
// Parses Prowler/Maester JSON output and upserts findings into Supabase

const fs = require('fs')
const path = require('path')
const https = require('https')

const args = process.argv.slice(2).reduce((acc, val, i, arr) => {
  if (val.startsWith('--')) acc[val.slice(2)] = arr[i + 1]
  return acc
}, {})

const { scanner, 'client-id': clientId, 'scan-job-id': scanJobId, 'results-dir': resultsDir } = args
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

function supabaseFetch(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path)
    const data = JSON.stringify(body)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(data),
      }
    }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function normalizeProwlerFinding(f, clientId, scanJobId) {
  return {
    client_id: clientId,
    scan_job_id: scanJobId,
    scanner: 'prowler',
    check_id: f.CheckID || f.check_id,
    title: f.CheckTitle || f.check_title,
    severity: (f.Severity || f.severity || 'informational').toLowerCase(),
    status: f.Status === 'FAIL' ? 'open' : 'resolved',
    service: f.ServiceName || f.service_name,
    resource_id: f.ResourceUID || f.resource_uid || f.ResourceArn,
    description: f.CheckDescription || f.description || '',
    remediation: f.Remediation?.Recommendation?.Text || f.remediation || '',
    compliance_frameworks: Object.keys(f.Compliance || {}),
    detected_at: new Date().toISOString(),
  }
}

function normalizeMaesterFinding(f, clientId, scanJobId) {
  return {
    client_id: clientId,
    scan_job_id: scanJobId,
    scanner: 'maester',
    check_id: f.TestId || f.Id,
    title: f.TestName || f.Name,
    severity: f.Result === 'Failed' ? 'high' : 'informational',
    status: f.Result === 'Failed' ? 'open' : 'resolved',
    service: 'entra_id',
    resource_id: f.TestId,
    description: f.TestDescription || '',
    remediation: f.Remediation || '',
    compliance_frameworks: f.Tags || [],
    detected_at: new Date().toISOString(),
  }
}

async function main() {
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'))
  let allFindings = []

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'))
    const items = Array.isArray(raw) ? raw : raw.findings || raw.tests || []

    for (const item of items) {
      const finding = scanner === 'prowler'
        ? normalizeProwlerFinding(item, clientId, scanJobId)
        : normalizeMaesterFinding(item, clientId, scanJobId)
      allFindings.push(finding)
    }
  }

  // Batch upsert in chunks of 100
  const chunkSize = 100
  let uploaded = 0
  for (let i = 0; i < allFindings.length; i += chunkSize) {
    const chunk = allFindings.slice(i, i + chunkSize)
    await supabaseFetch('/rest/v1/findings', 'POST', chunk)
    uploaded += chunk.length
    console.log(`Uploaded ${uploaded}/${allFindings.length} findings`)
  }

  // Update scan job counts
  const openFindings = allFindings.filter(f => f.status === 'open')
  const critical = openFindings.filter(f => f.severity === 'critical').length
  const high = openFindings.filter(f => f.severity === 'high').length

  await supabaseFetch(`/rest/v1/scan_jobs?id=eq.${scanJobId}`, 'PATCH', {
    findings_count: openFindings.length,
    critical_count: critical,
    high_count: high,
  })

  console.log(`Done. ${openFindings.length} open findings (${critical} critical, ${high} high)`)
}

main().catch(e => { console.error(e); process.exit(1) })
