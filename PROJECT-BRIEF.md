# Aspis — Project Brief & Handoff
**CyberShield Technologies, LLC**
**Product:** Aspis (CSPM/DSPM Platform)
**URL:** aspis.cybershield-llc.com
**GitHub:** github.com/christrudeau2021/aspis
**Last updated:** May 2026

---

## 1. Who You Are

You are Chris Trudeau, founder of **CyberShield Technologies, LLC** — a cybersecurity services company
targeting small and medium-sized businesses (SMBs under 500 employees). You are pre-revenue with
zero clients today. You build and deploy on GitHub + Vercel. You are a solo operator.

---

## 2. The Product Portfolio

You are building four standalone products that can be sold individually or bundled as a retainer.
Each product has its own name. The company name is CyberShield Technologies. The products are NOT
called CyberShield — that is the company only.

| Product | Purpose | Status | Repo / Location |
|---------|---------|--------|-----------------|
| **Aegis** | Security awareness training + phishing simulation | Live | github.com/christrudeau2021/aegis |
| **TTX** | Tabletop exercise (incident response scenarios) | Local only | ~/Projects/ttx-advisor |
| **Axiom** | Threat hunting | Not yet built | TBD |
| **Aspis** | CSPM/DSPM — security posture scanning | In build | github.com/christrudeau2021/aspis |

**Aspis is the current build focus.** It is the fourth product and the one most likely to generate
recurring retainer revenue from SMB clients.

---

## 3. What Aspis Does

Aspis continuously scans SMB client environments for security misconfigurations and surfaces them
in a dashboard. It targets:

- **Microsoft 365 / Entra ID** — misconfigured MFA, legacy auth, OAuth sprawl, mailbox forwarding rules
- **Azure** — cloud posture, CIS benchmark compliance
- **Salesforce** — sharing model misconfigs, guest user over-permission, excessive export rights

It uses three open-source scanners (all permissively licensed):

| Scanner | License | What it scans |
|---------|---------|---------------|
| Prowler | Apache 2.0 | Azure, M365, AWS, GCP (1,700+ checks) |
| Maester | MIT | M365 and Entra ID natively (200+ checks) |
| Monkey365 | Apache 2.0 | Azure and M365 identity governance |

---

## 4. The Architecture — Read This Before Touching Code

### No persistent server. Ever.

Scans run as **GitHub Actions workflows** on a schedule. There is no Fly.io, no Railway, no
always-on worker. This was a deliberate decision to keep costs at zero during MVP.

Each SMB client gets their own **private GitHub repo** containing:
- The scan workflows (copied from Aspis)
- Their OAuth credentials stored as GitHub Actions Secrets
- Their Aspis client UUID as a repository variable

Results post to a shared **Supabase PostgreSQL database**. The Vercel frontend reads from Supabase.

```
[GitHub Actions — per client repo]
        ↓  (POST findings via upload-findings.js)
[Supabase PostgreSQL]
        ↑  (server-side queries)
[Vercel — aspis.cybershield-llc.com]
        ↑
[Client browser]
```

### Tech stack

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — schema at src/lib/supabase/schema.sql
- **Hosting:** Vercel — auto-deploys on push to GitHub main
- **DNS:** Cloudflare (matches the Aegis pattern already in use)
- **Scan runners:** GitHub Actions (free tier = 2,000 min/month)
- **Email:** Resend (not yet wired — matches Aegis pattern)
- **Auth:** Not yet implemented — planned as Basic Auth on /dashboard (matches Aegis)

### Key rule on secrets

`SUPABASE_SERVICE_ROLE_KEY` lives only in:
1. `.env.local` (gitignored — never committed)
2. Vercel environment variables (server-side only)
3. GitHub Actions secrets in each client scan repo

It is **never** used in client components or exposed via NEXT_PUBLIC_ variables.
The `createServiceClient()` helper in `src/lib/supabase/server.ts` is the only place
it should be instantiated.

---

## 5. Environment Variables

### In `.env.local` (and Vercel env vars)

| Variable | What it is | Where to get it |
|----------|-----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never expose) | Supabase → Settings → API |
| `ASPIS_API_KEY` | Internal API auth key | Generated via `openssl rand -hex 32` |

### In each client's GitHub Actions repo (Secrets)

| Secret | What it is |
|--------|-----------|
| `SUPABASE_URL` | Same as NEXT_PUBLIC_SUPABASE_URL |
| `SUPABASE_SERVICE_KEY` | Same as SUPABASE_SERVICE_ROLE_KEY |
| `ASPIS_CLIENT_ID` | The UUID of that client row in Supabase |
| `M365_TENANT_ID` | Client's Microsoft tenant ID |
| `M365_CLIENT_ID` | OAuth app client ID |
| `M365_CLIENT_SECRET` | OAuth app client secret |
| `AZURE_CLIENT_ID` | Azure service principal client ID |
| `AZURE_CLIENT_SECRET` | Azure service principal secret |
| `AZURE_TENANT_ID` | Azure tenant ID |

---

## 6. Database Schema

Four tables. Schema file: `src/lib/supabase/schema.sql`

- **clients** — one row per SMB customer (name, industry, tier, modules, connections)
- **scan_jobs** — one row per GitHub Actions run (scanner, status, finding counts, run URL)
- **findings** — individual check results (severity, remediation, compliance frameworks)
- **onboarding_steps** — checklist per client for setup completion

RLS is enabled on all tables. Explicit deny policies block all anon key access.
Service role key bypasses RLS — used server-side only.

NULL-safe deduplication uses two partial unique indexes (not a single unique constraint,
because Postgres treats NULL != NULL which breaks dedup on global checks).

---

## 7. Application Routes

| Route | Type | What it does |
|-------|------|-------------|
| `/` | Static | Landing page / marketing |
| `/dashboard` | Dynamic | Multi-client overview with stats |
| `/onboarding` | Static (client) | 4-step wizard: profile → connect → modules → launch |
| `/clients/[id]` | Dynamic | Per-client findings view with severity breakdown |
| `/api/clients` GET | API | Returns all clients (requires x-aspis-api-key header) |
| `/api/clients` POST | API | Creates a client + seeds onboarding steps (requires x-aspis-api-key header) |

All API routes require the `x-aspis-api-key` header matching `ASPIS_API_KEY` env var.

---

## 8. GitHub Actions Workflows

Two workflows live in `.github/workflows/`:

- **scan-m365.yml** — Runs Maester daily at 2am UTC. Scans M365 and Entra ID.
- **scan-cloud.yml** — Runs Prowler weekly on Mondays at 3am UTC. Scans Azure or AWS.

Both workflows:
1. Register a scan_job row in Supabase at start
2. Run the scanner
3. Call `upload-findings.js` to parse JSON output and upsert findings to Supabase
4. Update the scan_job row with completion status and finding counts

The `upload-findings.js` script lives in `.github/scripts/` and handles both Prowler and
Maester output formats.

---

## 9. Open-Source Scanner Repos (Local)

These are cloned into `~/Projects/` for reference. They are NOT imported into the Aspis app —
they run in GitHub Actions environments.

| Repo | Local path | Used by |
|------|-----------|---------|
| prowler | ~/Projects/prowler | scan-cloud.yml |
| maester | ~/Projects/maester | scan-m365.yml |
| monkey365 | ~/Projects/monkey365 | Future Azure deep-dive |

---

## 10. Monetization Model

| Tier | Price | What's included |
|------|-------|----------------|
| Starter | $299–$499/mo | M365 + 1 cloud, monthly report |
| Business | $799–$1,200/mo | Full SaaS stack, weekly scans, alerts |
| Managed | $2,000+/mo | Continuous monitoring + remediation guidance |

Target verticals (highest value):
1. Law firms and legal services (SRG ransomware campaign active — 38 firms hit in 2026)
2. Healthcare (HIPAA compliance + email compromise exposure)
3. Financial services / RIAs (Salesforce + M365 credential targeting)
4. Accounting firms (GLBA/IRS Pub 4557 compliance obligations)
5. Real estate (BEC wire fraud exposure)

---

## 11. Sales Playbook

### Best cold outreach hook right now (May 2026)

The FBI issued PSA IC3-260521 about the Kali365 phishing kit that bypasses M365 MFA entirely
via OAuth Device Code flow. This is active against SMBs across all sectors.

**Outreach script:**
> "The FBI issued a warning last week about a phishing kit actively targeting Microsoft 365
> accounts in [their industry]. It bypasses MFA and has hit hundreds of organizations.
> We run a free posture scan that checks for the specific Entra ID configuration gaps this
> exploit requires. Happy to run one for your org at no cost — no sales pitch, just the
> findings. Interested?"

### Five proven use cases to lead with

1. **Ex-employee access** — OAuth tokens and delegated permissions that survive account disabling
2. **Salesforce misconfiguration** — guest user over-permission (McGraw Hill lost 13.5M records this way)
3. **Legacy auth bypassing MFA** — IMAP/SMTP/POP3 still enabled, BEC entry point
4. **Compliance time bomb** — law firms / accountants unaware of M365 config requirements
5. **Post-incident persistence** — attackers leave backdoors; clients think they're clean

### Displacement sale framing

You replace a $10,000 annual manual compliance audit with $6,000/yr of continuous automated
coverage. Sell it as cheaper AND better, not as a new cost.

---

## 12. Security Decisions Already Made

These were reviewed and hardened before first commit. Do not revert them.

| Decision | Reason |
|----------|--------|
| API routes require x-aspis-api-key header | POST /api/clients was open to the internet |
| Service role key only in createServiceClient() | Prevents key exposure in client bundles |
| RLS deny-all anon policies explicitly defined | Belt-and-suspenders: intent is explicit, not accidental |
| /dashboard and /clients/[id] are force-dynamic | Were incorrectly prerendered as static (served stale data) |
| NULL-safe dedup via two partial indexes | Single unique constraint breaks on NULL resource_id |
| Input validation on POST /api/clients | Validates tier enum, module names, string lengths |

---

## 13. What Is NOT Built Yet (Next Steps)

These are in priority order:

### Immediate (before first real client)
1. Create GitHub repo `christrudeau2021/aspis` and push
2. Create Supabase project, run schema.sql, fill in .env.local
3. Connect Vercel, add env vars, set domain aspis.cybershield-llc.com in Cloudflare
4. Create first client scan repo, add M365 secrets, trigger manual scan
5. Confirm findings land in Supabase and appear in dashboard

### Short term (before client #2)
6. Add Basic Auth to /dashboard (copy pattern from Aegis)
7. Add Resend email notifications for critical findings (copy pattern from Aegis)
8. Pin maester@main to a release tag in scan-m365.yml
9. Pin prowler to a specific version in scan-cloud.yml
10. Add workflow_dispatch input validation (whitelist UUID pattern for client_id)

### Medium term (module expansion)
11. Wire TTX module link to ~/Projects/ttx-advisor
12. Wire Aegis awareness training into Aspis module system
13. Build Axiom threat hunting integration (Axiom.co log query API)
14. Add per-client report export (PDF — use Aegis cert pattern as reference)

---

## 14. Naming Rules — Do Not Break These

- **CyberShield Technologies, LLC** = the company. Never a product name.
- **Aspis** = this product. Servicemark pending.
- **Aegis** = awareness training product. Already live.
- **TTX** = tabletop exercise product.
- **Axiom** = threat hunting product (not yet built).
- Folder: `~/Projects/aspis` — do not rename.
- GitHub repo: `aspis` — do not rename.
- Domain: `aspis.cybershield-llc.com` — subdomain of company domain.
- Package name: `aspis` in package.json.

---

## 15. Existing GitHub Repos for Reference

| Repo | Stack | Notes |
|------|-------|-------|
| aegis | HTML/JS, Vercel KV (Upstash Redis), Resend, Cloudflare | Most complete product — use as pattern for auth, email, cron |
| command-center | Next.js/TS, Vercel | TV dashboard — good widget component reference |
| Clandy | Apache 2.0 stub | Not relevant |
| q_retreive | Empty | QRadar script — not relevant |

When in doubt about deployment patterns, auth patterns, or email patterns — look at Aegis first.
