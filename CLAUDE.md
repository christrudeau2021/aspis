@AGENTS.md

# Aspis — CSPM/DSPM Platform
**By CyberShield Technologies, LLC**
**URL:** aspis.cybershield-llc.com
**GitHub:** github.com/christrudeau2021/aspis

## What This Is
Aspis is a Security Posture Management (CSPM/DSPM) platform for SMB clients. It provides
continuous misconfiguration scanning across Microsoft 365, Azure, and Salesforce environments.
It is the fourth product in the CyberShield Technologies portfolio.

## CyberShield Product Portfolio
| Product | Repo | Purpose |
|---------|------|---------|
| Aegis | christrudeau2021/aegis | Security awareness training + phishing simulation |
| TTX | christrudeau2021/ttx (local: ~/Projects/ttx-advisor) | Tabletop exercise platform |
| Axiom | TBD | Threat hunting |
| **Aspis** | christrudeau2021/aspis | CSPM/DSPM — this repo |

## Tech Stack
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Database:** Supabase (PostgreSQL) — schema in src/lib/supabase/schema.sql
- **Hosting:** Vercel (auto-deploy from GitHub main)
- **DNS:** Cloudflare (matches Aegis pattern)
- **Scan runners:** GitHub Actions (no persistent server — replaces Fly.io)
- **Scanners:** Prowler (Apache 2.0), Maester (MIT), Monkey365 (Apache 2.0)
- **Email:** Resend (to match Aegis pattern when email is needed)

## Architecture: No Persistent Server
Scans run as GitHub Actions workflows — one private repo per client.
Each client repo holds their OAuth credentials as Actions Secrets.
Results are posted to Supabase via the upload-findings.js script.
Vercel frontend reads from Supabase. Zero Fly.io / zero always-on workers.

## Scan Workflows
- .github/workflows/scan-m365.yml — Maester daily M365/Entra ID scan
- .github/workflows/scan-cloud.yml — Prowler weekly Azure/AWS scan
- .github/scripts/upload-findings.js — parses JSON output → upserts to Supabase

## Key Routes
- / — Landing page
- /dashboard — Multi-client overview (server component, reads Supabase)
- /onboarding — 4-step client onboarding wizard
- /clients/[id] — Per-client findings view
- /api/clients — REST: GET all clients, POST create client

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Public anon key
SUPABASE_SERVICE_ROLE_KEY — Service role key (server-side only, never expose)

## Per-Client GitHub Actions Secrets (in each client scan repo)
SUPABASE_URL, SUPABASE_SERVICE_KEY — shared Supabase instance
M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET — per client
AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID — per client
ASPIS_CLIENT_ID — the Supabase UUID for that client row

## Module Roadmap
- posture: LIVE — Prowler + Maester scanning
- ttx: WIRED — connects to ~/Projects/ttx-advisor when ready
- awareness: COMING SOON — will integrate with Aegis
- threat-hunting: COMING SOON — Axiom integration

## Naming Notes
- Company: CyberShield Technologies, LLC
- Product: Aspis (Greek warrior shield — aspis.cybershield-llc.com)
- DO NOT rename back to cybershield — that is the company, not the product
- Servicemark for "Aspis" is pending
