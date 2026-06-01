# Aspis — Start of Day Brief
**CyberShield Technologies, LLC**
**Updated:** June 1, 2026
**Status:** MVP deployed, demo-ready, first real scan pending

---

## Where Things Stand

### Live Right Now
- **https://aspis.cybershield-llc.com** — deployed on Vercel, password protected
- **3 demo clients** seeded in Supabase with realistic findings (law firm, healthcare, financial)
- **Posture scoring** (A–F grade) computed per client from open findings
- **Remediation workflow** — mark findings Resolved or Accept Risk with documented reason
- **Integration setup guides** for M365, Azure, Salesforce (with copy buttons, step-by-step)
- **Scan trigger button** — dispatches GitHub Actions via GitHub API, polls for status
- **Basic Auth** protecting all operator routes

### What Is NOT Working Yet
- **Real scans** — you have seeded demo data. Real scans require Step 1–5 below.
- **Email alerts** — Resend not yet wired
- **Client portal** — clients can't log in themselves yet
- **Webhooks** — status is polled, not pushed (next sprint)

---

## First Thing This Morning — 5 Steps to Real Scans (30 min)

### Step 1 — Add Environment Variables to Vercel (5 min)
**Vercel → aspis project → Settings → Environment Variables**

| Variable | What | Where to get it |
|---|---|---|
| `DASHBOARD_PASSWORD` | Your login password | Make it strong — you type it once per browser session |
| `GITHUB_TOKEN` | PAT to dispatch scans | github.com/settings/tokens → Generate new (classic) → check **repo** scope |
| `GITHUB_OWNER` | Your GitHub username | `christrudeau2021` |
| `NEXT_PUBLIC_ASPIS_API_KEY` | Browser-side API key | Same value as `ASPIS_API_KEY` — confirm it's there |

After adding: **Vercel → Deployments → latest → 3-dot menu → Redeploy**

---

### Step 2 — Register M365 Read-Only App in Azure (15 min)
The full guide is built into the app at:
`aspis.cybershield-llc.com/clients/[any-client-id]/setup/m365`

Short version — in Azure Portal:
1. **Entra ID → App registrations → New registration**
   - Name: `Aspis Security Scanner (Read Only)`
   - Single tenant, no redirect URI
2. **API permissions → Microsoft Graph → Application permissions** — add all 13:
   `AuditLog.Read.All, Directory.Read.All, Group.Read.All, IdentityRiskyUser.Read.All,
   Organization.Read.All, Policy.Read.All, Reports.Read.All, RoleManagement.Read.All,
   SecurityEvents.Read.All, User.Read.All, Application.Read.All,
   DeviceManagementConfiguration.Read.All, DeviceManagementManagedDevices.Read.All`
3. **Grant admin consent** (the button at the top of permissions page — critical, easy to miss)
4. **Certificates & secrets → New client secret** — copy the Value immediately
5. Note the **Tenant ID** and **Application (client) ID** from the Overview page

---

### Step 3 — Create the Client Scan Repo on GitHub (5 min)
Go to github.com → New repository:
- **Name:** `aspis-client-[slug]` (get slug from Supabase `clients` table)
  - Law firm example: `aspis-client-harrington-associates-llp`
- **Private** ✅
- **No README** (stays empty for now)

Then copy the 3 workflow files:
```bash
cd ~/Projects/aspis
mkdir -p /tmp/scan-repo/.github/workflows /tmp/scan-repo/.github/scripts
cp .github/workflows/scan-m365.yml    /tmp/scan-repo/.github/workflows/
cp .github/workflows/scan-cloud.yml   /tmp/scan-repo/.github/workflows/
cp .github/scripts/upload-findings.js /tmp/scan-repo/.github/scripts/
cd /tmp/scan-repo && git init && git add . && git commit -m "init" && git remote add origin https://github.com/christrudeau2021/aspis-client-[slug].git && git push -u origin main
```

---

### Step 4 — Add Secrets to the Scan Repo (5 min)
**GitHub → scan repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `M365_TENANT_ID` | Directory (tenant) ID from Step 2 |
| `M365_CLIENT_ID` | Application (client) ID from Step 2 |
| `M365_CLIENT_SECRET` | Secret Value from Step 2 |
| `SUPABASE_URL` | `https://ybxnepkseulsvxusazvj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | From Supabase → Settings → API → service_role key |
| `ASPIS_CLIENT_ID` | UUID of this client from Supabase `clients` table |

**Settings → Variables → Actions → New repository variable:**

| Variable | Value |
|---|---|
| `ASPIS_CLIENT_ID` | Same UUID as above |

---

### Step 5 — Trigger First Scan (1 click)
`aspis.cybershield-llc.com/clients/[id]` → click **▶ Scan M365**

Results appear in 3–8 minutes. Status updates live. If you get a 404 error — the repo name doesn't match. Double-check the slug.

---

## Demo Script (10 min)

**Login:** `aspis.cybershield-llc.com` → enter password

---

**DASHBOARD**
> *"This is my operator view. Every client, one screen. The letter grade is the story — two F's means I have calls to make today. 7 critical findings across 3 clients."*

---

**HARRINGTON & ASSOCIATES LLP** (law firm, Grade F)
> *"18-person law firm. Grade F — Critical Risk. Let me show you exactly what that means."*

Click `▸` on **Legacy authentication protocols not blocked**:
> *"This is the attack vector the FBI warned about last week. These legacy protocols bypass MFA entirely — no password needed. The FBI's Kali365 advisory is specifically about this gap. Here's the exact fix, and three compliance frameworks that require it."*

Click **Accept Risk** on another finding:
> *"If they can't fix something immediately — say, a vendor dependency — they document the reason here. That text becomes a compliance artifact. Their cyber insurer can pull this report and see exactly what was accepted, why, and when."*

---

**LAKESIDE MEDICAL GROUP** (healthcare, Grade F)
> *"42-person medical practice. Completely different risk profile. Same platform, different compliance lens — watch how HIPAA surfaces automatically."*

Point to **PHI accessible in unstructured email content** and **MFA not required for clinical staff**:
> *"Saint Anthony Hospital paid to notify 146,000 patients because two email accounts were compromised. Same pattern. We caught it here before it became a breach notification."*

---

**MERIDIAN CAPITAL ADVISORS** (financial services, Grade D)
> *"11-person RIA. Grade D — better, but look at the first finding: a storage account named 'stmeridianbackups' has public blob access enabled. That's their client backup data, readable by anyone with the URL. ShinyHunters used this exact pattern to pull 47,000 customer records from Ameriprise this year."*

---

**SCAN TRIGGER** (if real scan set up)
> *"This is live. I'm dispatching a scan of your tenant right now. Results in 8 minutes. You'll see real findings from your actual environment — not a demo."*

---

## Key Numbers to Know

| | |
|---|---|
| Security checks | 1,700+ (Prowler) + 200+ (Maester) |
| Compliance frameworks | 70+ — CIS, HIPAA, SOC2, PCI-DSS, CISA-SCuBA, GLBA |
| Time to first scan | Under 10 minutes |
| Agent install | None — read-only OAuth only |
| No enterprise contract | Month-to-month |

## Pricing (Updated — don't go lower)

| Tier | Price | Included |
|---|---|---|
| Starter | **$499/mo** | M365 + 1 cloud, monthly posture report |
| Business | **$1,200/mo** | Full stack, weekly scans, critical alerts |
| Managed | **$2,500/mo** | Continuous monitoring + remediation guidance |

---

## Infrastructure Quick Reference

| | |
|---|---|
| **Demo URL** | https://aspis.cybershield-llc.com |
| **Vercel project** | prj_FLLqn2Yf8IfVlJkmKtHndh6yldns |
| **Supabase URL** | https://ybxnepkseulsvxusazvj.supabase.co |
| **GitHub repo** | github.com/christrudeau2021/aspis |
| **Local project** | ~/Projects/aspis |
| **DNS** | Cloudflare → CNAME → cname.vercel-dns.com |

## Reset Demo Data Any Time
```bash
cd ~/Projects/aspis
node scripts/seed-demo.js --wipe   # full clean rebuild
node scripts/seed-demo.js           # skips if clients exist
```

---

## Next Sprint — Webhooks

This is the conversation from last night. Webhooks close the last mile of the workflow and make the platform feel real-time.

### The Three Problems Webhooks Solve

**1. Scan status is polled, not pushed**
Right now the dashboard asks GitHub "are you done yet?" every 15 seconds. GitHub already knows the instant a scan completes — it just has nowhere to send that signal. Fix: GitHub → Aspis inbound webhook on `workflow_run` completion.

**2. Findings appear all at once, not live**
All 200 checks complete, then everything lands at once. Fix: Supabase Realtime subscription — findings appear one by one as they're inserted, posture grade recalculates live. This is the moment that closes deals.

**3. No outbound alerts**
A critical finding is detected at 2am. Nobody knows until someone logs in. Fix: Aspis → Slack/Teams/PagerDuty when critical findings land.

### Build Order

| Priority | Webhook | What It Does | Effort |
|---|---|---|---|
| 1 | **GitHub → Aspis** | Instant scan complete, no polling | 2 hrs |
| 2 | **Supabase Realtime** | Findings stream live during scan | 3 hrs |
| 3 | **Aspis → Slack/Teams** | Critical finding alerts | 2 hrs |
| 4 | **Aspis → Resend** | Scan complete + weekly digest email | 1 hr |
| 5 | **Aspis → client URL** | Configurable per client, enterprise feature | 4 hrs |

### GitHub Inbound Webhook (the most important one)

**In GitHub** — each client scan repo → Settings → Webhooks → Add:
```
Payload URL: https://aspis.cybershield-llc.com/api/webhooks/github
Secret:      GITHUB_WEBHOOK_SECRET (new env var, store in Vercel + each scan repo)
Events:      Workflow runs
```

**In Aspis** — new route `POST /api/webhooks/github`:
- Verify `X-Hub-Signature-256` HMAC header (never skip — prevents fake completions)
- On `workflow_run` completed → update `scan_jobs.status` to `complete` or `failed`
- Triggers Supabase Realtime broadcast → browser updates instantly

**Security rule:** Every webhook endpoint needs signature verification. Same HMAC-SHA256 pattern for GitHub, Slack, and any client-facing webhooks.

---

## What's Built — Complete File Map

```
~/Projects/aspis/
├── src/
│   ├── app/
│   │   ├── page.tsx                          Landing page
│   │   ├── layout.tsx                        Root layout + metadata
│   │   ├── dashboard/page.tsx                Multi-client dashboard (server)
│   │   ├── onboarding/page.tsx               4-step client wizard (client)
│   │   ├── clients/[id]/
│   │   │   ├── page.tsx                      Client findings + scan trigger
│   │   │   └── setup/
│   │   │       ├── m365/page.tsx             M365 integration guide
│   │   │       ├── azure/page.tsx            Azure integration guide
│   │   │       └── salesforce/page.tsx       Salesforce integration guide
│   │   ├── api/
│   │   │   ├── clients/route.ts              GET/POST clients
│   │   │   └── clients/[id]/
│   │   │       ├── scan/route.ts             POST trigger scan / GET history
│   │   │       └── setup/route.ts            PATCH mark onboarding step complete
│   │   └── actions/
│   │       ├── clients.ts                    Server action: create client
│   │       └── findings.ts                   Server action: update finding status
│   ├── components/
│   │   ├── FindingsTable.tsx                 Findings list + expand + remediation
│   │   └── ScanTrigger.tsx                   Scan button + job history + polling
│   ├── lib/
│   │   ├── posture.ts                        A–F grade calculation
│   │   ├── modules.ts                        Product module definitions
│   │   └── supabase/
│   │       ├── client.ts                     Anon client (browser)
│   │       ├── server.ts                     Service role client (server only)
│   │       └── schema.sql                    Full DB schema — run in Supabase SQL editor
│   ├── types/index.ts                        TypeScript types
│   └── proxy.ts                              Basic Auth middleware (Next.js 16)
├── .github/
│   ├── workflows/
│   │   ├── scan-m365.yml                     Maester daily M365 scan
│   │   └── scan-cloud.yml                    Prowler weekly Azure/AWS scan
│   └── scripts/
│       └── upload-findings.js                Parses scan JSON → upserts to Supabase
├── scripts/
│   └── seed-demo.js                          Demo data seeder (--wipe flag)
├── vercel.json                               CORS config (scoped to domain)
├── PROJECT-BRIEF.md                          Full project context for Claude sessions
└── MORNING-BRIEF.md                          This file
```

---

## Before First Paying Client — Must-Do List

- [ ] **Rotate SUPABASE_SERVICE_ROLE_KEY** — was in chat session. Supabase → Settings → API → Regenerate → update Vercel env var → redeploy
- [ ] **Rotate ASPIS_API_KEY** — same reason. `openssl rand -hex 32` → update Vercel + `.env.local`
- [ ] **Add Supabase Auth** — right now it's one shared password. Before a second operator or paying client, add proper login
- [ ] **Write RLS policies** — schema has RLS on but no user-scoped policies. Fine for solo operator, fix before multi-user
- [ ] **Pin scanner versions** — `maester@main` in scan-m365.yml is unpinned (supply chain risk). Pin to a release tag

---

## CyberShield Portfolio

| Product | URL | Status |
|---|---|---|
| **Aegis** | aegis.cybershield-llc.com | Live — awareness training + phishing sim |
| **Aspis** | aspis.cybershield-llc.com | Live — CSPM/DSPM (this) |
| **TTX** | — | Local only at ~/Projects/ttx-advisor |
| **Axiom** | — | Not built yet — threat hunting |

**Fastest path to revenue:** Aspis + Aegis as a bundle. Two products, one invoice, one conversation. The "Security Posture + Awareness Training" bundle covers the two biggest SMB gaps and justifies $800–$1,500/month without blinking.

---

## The Only Thing That Matters Today

The platform is built. The demo works. The gap between now and a paying client is one conversation.

Pick up the phone. Find a law firm, accounting practice, or healthcare office that uses M365. Offer a free scan. Show them the findings. The platform does the rest.

**You don't need more features. You need your first client.**
