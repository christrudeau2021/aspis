# Aspis — Morning Brief
**Date:** June 1, 2026
**Status:** MVP complete, deployed, demo-ready
**Demo URL:** https://aspis.cybershield-llc.com
**GitHub:** https://github.com/christrudeau2021/aspis

---

## What You Have Right Now

A fully deployed CSPM/DSPM platform with:
- Password-protected dashboard (Basic Auth)
- 3 seeded demo clients with realistic findings
- Posture scoring (A–F grade) per client
- Remediation workflow (Resolved / Accept Risk with documented reason)
- Integration setup guides for M365, Azure, Salesforce
- Scan trigger button (dispatches GitHub Actions via GitHub API)
- Scan job history with status polling

**The demo is live.** Seed data is in Supabase. You can show it to a client right now.

---

## Before You Demo Today — 5 Things (30 minutes)

### 1. Add Environment Variables to Vercel (5 min)
Vercel → aspis → Settings → Environment Variables → Add:

| Variable | Value | Notes |
|---|---|---|
| `DASHBOARD_PASSWORD` | Pick something strong | You type this to log in |
| `GITHUB_TOKEN` | PAT from github.com/settings/tokens | Needs `repo` scope |
| `GITHUB_OWNER` | `christrudeau2021` | Your GitHub username |
| `NEXT_PUBLIC_ASPIS_API_KEY` | Same value as `ASPIS_API_KEY` | Already set — confirm it's there |

After adding, **redeploy**: Vercel → Deployments → 3-dot → Redeploy latest.

### 2. Register M365 Read-Only App (15 min)
Follow the guide built into the app:
`aspis.cybershield-llc.com/clients/[any-id]/setup/m365`

You need from Azure Portal:
- Directory (tenant) ID
- Application (client) ID
- Client Secret Value (copy immediately — shown once)

### 3. Create Client Scan Repo on GitHub (5 min)
Create **private** repo named: `aspis-client-[slug]`
(slug = client's slug from Supabase `clients` table, e.g. `harrington-associates-llp`)

Copy 3 files into it:
```bash
mkdir -p .github/workflows .github/scripts
cp ~/Projects/aspis/.github/workflows/scan-m365.yml    .github/workflows/
cp ~/Projects/aspis/.github/workflows/scan-cloud.yml   .github/workflows/
cp ~/Projects/aspis/.github/scripts/upload-findings.js .github/scripts/
```
Push to main.

### 4. Add 6 Secrets + 1 Variable to Scan Repo (5 min)
GitHub → scan repo → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `M365_TENANT_ID` | From Step 2 |
| `M365_CLIENT_ID` | From Step 2 |
| `M365_CLIENT_SECRET` | From Step 2 |
| `SUPABASE_URL` | https://ybxnepkseulsvxusazvj.supabase.co |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key (Settings → API) |
| `ASPIS_CLIENT_ID` | UUID from Supabase `clients` table for that client row |

Settings → Variables → Actions → New:

| Variable | Value |
|---|---|
| `ASPIS_CLIENT_ID` | Same UUID as above |

### 5. Trigger First Real Scan (1 click)
Go to `aspis.cybershield-llc.com/clients/[id]` → click **▶ Scan M365**

Results appear in 3–8 minutes. The scan job status updates live.

---

## Demo Script (10 minutes)

**Open:** `aspis.cybershield-llc.com` → type password

**Screen 1 — Dashboard**
> "This is my operator view. Every client I manage. The letter grade tells me the story — two F's means I have calls to make today."

**Screen 2 — Harrington & Associates LLP (Law Firm)**
> "18 employees, legal firm. Grade F — Critical Risk. Let me show you what we found."

**Click ▸ on first finding (Legacy Authentication)**
> "This is the exact attack vector the FBI warned about last week. Your legacy protocols bypass MFA entirely. Here's exactly how to fix it. CIS, CISA-SCuBA, MS-ISAC all require this."

**Click Accept Risk on another finding**
> "If they can't fix something immediately — vendor dependency, whatever — they document the reason here. That becomes a compliance artifact for their insurer."

**Navigate to Lakeside Medical Group**
> "Different client, different risk profile. Healthcare. Same platform surfaces HIPAA context automatically — PHI in unstructured email, MFA not enforced for clinical staff."

**Navigate to Meridian Capital Advisors**
> "Financial advisor, 11 people. Grade D — better, but Azure has a publicly accessible storage account. That's their backup bucket, readable by anyone with the URL."

**Click ▶ Scan M365 (if real scan is set up)**
> "This is live. I just dispatched a scan of your tenant. Results in 8 minutes."

---

## Key Numbers for the Conversation

| Stat | Value |
|---|---|
| Security checks run | 1,700+ (Prowler) + 200+ (Maester) |
| Compliance frameworks | 70+ including CIS, HIPAA, SOC2, PCI-DSS, CISA-SCuBA |
| Time to first scan | Under 10 minutes |
| Agent install required | None — read-only OAuth only |
| Cost to client | $299–$2,000/month depending on tier |

---

## Pricing

| Tier | Price | What's Included |
|---|---|---|
| Starter | $499/mo | M365 + 1 cloud, monthly report |
| Business | $1,200/mo | Full SaaS stack, weekly scans, alerts |
| Managed | $2,500/mo | Continuous monitoring + remediation guidance |

**Note:** Original pricing was $299/$799/$2,000 — recommend moving it up. Law firms and healthcare practices with compliance obligations will not blink at $499.

---

## Architecture (for technical questions)

```
GitHub Actions (per client, private repo)
    ↓  scan results via upload-findings.js
Supabase PostgreSQL
    ↑  server-side queries
Vercel (aspis.cybershield-llc.com)
    ↑  browser
```

- **No persistent server** — scans run as GitHub Actions workflows on a schedule
- **No agent install** — read-only OAuth app credentials only
- **Scanners:** Prowler (Apache 2.0), Maester (MIT), both open source
- **Per-client isolation** — each client has their own private GitHub repo with their own credentials

---

## Infrastructure Reference

| Service | Detail |
|---|---|
| Vercel project | aspis (prj_FLLqn2Yf8IfVlJkmKtHndh6yldns) |
| Supabase project | aspis — ybxnepkseulsvxusazvj.supabase.co |
| GitHub repo | github.com/christrudeau2021/aspis (public) |
| Custom domain | aspis.cybershield-llc.com |
| DNS | Cloudflare (CNAME → cname.vercel-dns.com) |

---

## Application Routes

| Route | What It Does |
|---|---|
| `/` | Landing page |
| `/dashboard` | Multi-client overview — your operator view |
| `/onboarding` | 4-step wizard to add a new client |
| `/clients/[id]` | Per-client posture score, findings, scan trigger |
| `/clients/[id]/setup/m365` | Step-by-step M365 OAuth app registration guide |
| `/clients/[id]/setup/azure` | Azure service principal setup guide |
| `/clients/[id]/setup/salesforce` | Salesforce Connected App setup guide |
| `/api/clients` | REST: list / create clients |
| `/api/clients/[id]/scan` | REST: trigger scan / get scan history |
| `/api/clients/[id]/setup` | REST: mark onboarding steps complete |

---

## Seed / Reset Demo Data

```bash
# Full clean reset (wipe + rebuild all 3 demo clients)
cd ~/Projects/aspis
node scripts/seed-demo.js --wipe

# Safe run (skips if clients already exist)
node scripts/seed-demo.js
```

Demo clients:
- **Harrington & Associates LLP** — Legal, 18 employees, Starter, 9 findings (3 critical)
- **Lakeside Medical Group** — Healthcare, 42 employees, Business, 8 findings (3 critical)
- **Meridian Capital Advisors** — Financial Services, 11 employees, Managed, 8 findings (2 critical)

---

## What Is NOT Built Yet (Prioritised)

### Must Have Before First Paying Client
- [ ] **User authentication** — right now the dashboard has a single shared password. Before a second operator touches this, add Supabase Auth with per-user logins
- [ ] **RLS policies** — Supabase Row Level Security is ON but has no user-scoped policies. Safe for single-operator use, fix before multi-user
- [ ] **Key rotation** — SUPABASE_SERVICE_ROLE_KEY and ASPIS_API_KEY were exposed in a Claude chat session. Rotate both before any real client data goes in

### High Value — Next Sprint
- [ ] **Weekly email digest** — Resend integration, Monday morning summary per client (Aegis has the Resend pattern)
- [ ] **Posture trend chart** — is the grade improving over time? One chart on the client page
- [ ] **PDF report** — one-click board-ready PDF with posture score, findings, remediation summary
- [ ] **CISA KEV feed** — weekly GitHub Actions job that pulls live threat intel and flags if any open finding matches an active exploit

### Medium Term
- [ ] **Client portal** — separate login where the client sees only their own data
- [ ] **Peer benchmarking** — "Your law firm scores in the 34th percentile vs other legal firms"
- [ ] **Axiom threat hunting integration** — connect behavioral log data to Aspis posture findings
- [ ] **Aegis (awareness training) module** — wire the Aspis module slot to the live Aegis platform

---

## Product Portfolio (for context)

| Product | Purpose | Status |
|---|---|---|
| **Aegis** | Security awareness training + phishing simulation | Live at aegis.cybershield-llc.com |
| **Aspis** | CSPM/DSPM security posture management | Live at aspis.cybershield-llc.com (this) |
| **TTX** | Tabletop exercise platform | Local only — ~/Projects/ttx-advisor |
| **Axiom** | Threat hunting | Not yet built |

Company: **CyberShield Technologies, LLC**
Servicemark for "Aspis" is pending.

---

## Security Issues to Fix Before a Second Operator

These do NOT affect tomorrow's demo. They matter before you add a second person to the platform.

| Issue | Risk | Fix |
|---|---|---|
| Single shared password (Basic Auth) | Anyone with the password sees all clients | Add Supabase Auth |
| No RLS user policies | Service role key is the only thing enforcing isolation | Write per-user Supabase policies |
| Exposed keys in chat history | Session logs may contain old SUPABASE_SERVICE_ROLE_KEY | Rotate both keys in Supabase + Vercel |
| CORS scoped to domain | Low risk now, verify after any domain change | Already fixed to aspis.cybershield-llc.com |

---

## Local Dev

```bash
cd ~/Projects/aspis
npm run dev
# → http://localhost:3000
# Auth is active — browser will prompt for password
# Use the DASHBOARD_PASSWORD from .env.local
```

Scanner repos cloned locally for reference:
- `~/Projects/prowler` — Apache 2.0
- `~/Projects/maester` — MIT
- `~/Projects/monkey365` — Apache 2.0

---

## One Thing That Matters More Than All Of This

The platform is built. The demo is ready. The gap between now and a paying client is one conversation — not more features.

Find a law firm, an accounting practice, or a small healthcare office that uses M365. Ask if you can run a free scan. Show them the results. The findings will do the selling.

Good luck tomorrow.
