-- Aspis Platform Schema — CyberShield Technologies LLC
-- Run this in your Supabase SQL editor

-- Clients (one row per SMB customer)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text,
  employee_count integer,
  tier text not null default 'starter' check (tier in ('starter','business','managed')),
  modules text[] default '{"posture"}',
  onboarding_complete boolean default false,
  m365_tenant_id text,
  salesforce_org_id text,
  google_workspace_domain text,
  created_at timestamptz default now()
);

-- Scan jobs (one per GitHub Actions run)
create table scan_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  scanner text not null check (scanner in ('prowler','maester','monkey365')),
  status text not null default 'queued' check (status in ('queued','running','complete','failed')),
  trigger text not null default 'scheduled' check (trigger in ('scheduled','manual','onboarding')),
  started_at timestamptz,
  completed_at timestamptz,
  findings_count integer default 0,
  critical_count integer default 0,
  high_count integer default 0,
  run_url text,
  created_at timestamptz default now()
);

-- Findings (individual check results)
create table findings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  scan_job_id uuid references scan_jobs(id) on delete cascade,
  scanner text not null,
  check_id text not null,
  title text not null,
  severity text not null check (severity in ('critical','high','medium','low','informational')),
  status text not null default 'open' check (status in ('open','resolved','accepted_risk')),
  service text,
  resource_id text,
  description text,
  remediation text,
  compliance_frameworks text[] default '{}',
  detected_at timestamptz default now(),
  resolved_at timestamptz,
  -- Deduplication handled by partial indexes below (NULL-safe)
  constraint findings_check_title_not_empty check (char_length(title) > 0)
);

-- Onboarding checklist per client
create table onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  step_key text not null,
  title text not null,
  description text,
  completed boolean default false,
  required boolean default true,
  completed_at timestamptz,
  unique(client_id, step_key)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Service role key bypasses all policies (used by GitHub Actions
-- and server-side API routes only — never exposed to browser).
-- Anon key is blocked from all tables until auth is wired up.
-- ============================================================
alter table clients enable row level security;
alter table scan_jobs enable row level security;
alter table findings enable row level security;
alter table onboarding_steps enable row level security;

-- Deny all anon access (explicit safety net — RLS-on with no
-- policy already blocks anon, but this makes intent clear)
create policy "deny anon clients"           on clients           for all to anon using (false);
create policy "deny anon scan_jobs"         on scan_jobs         for all to anon using (false);
create policy "deny anon findings"          on findings          for all to anon using (false);
create policy "deny anon onboarding_steps"  on onboarding_steps  for all to anon using (false);

-- ============================================================
-- INDEXES
-- ============================================================
create index findings_client_severity on findings(client_id, severity) where status = 'open';
create index findings_client_service  on findings(client_id, service);
create index scan_jobs_client         on scan_jobs(client_id, created_at desc);
create index onboarding_client        on onboarding_steps(client_id);

-- NULL-safe deduplication for findings:
-- When resource_id IS NOT NULL: deduplicate by (client, check, resource)
create unique index findings_dedup_with_resource
  on findings(client_id, check_id, resource_id)
  where resource_id is not null;

-- When resource_id IS NULL: deduplicate by (client, check) only
create unique index findings_dedup_no_resource
  on findings(client_id, check_id)
  where resource_id is null;
