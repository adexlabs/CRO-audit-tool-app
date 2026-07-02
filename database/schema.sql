-- ============================================================
-- CRO Audit Shopify App — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists shops (
  id uuid primary key default uuid_generate_v4(),
  shop_domain text unique not null,
  access_token text not null,
  plan text default 'free',
  installed_at timestamptz default now(),
  uninstalled_at timestamptz,
  settings jsonb default '{}'::jsonb
);

create table if not exists audits (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  status text default 'pending',
  overall_score numeric,
  category_scores jsonb default '{}'::jsonb,
  target_type text,
  target_url text,
  raw_findings jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists audit_issues (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid references audits(id) on delete cascade,
  category text,
  severity text,
  title text,
  description text,
  element_selector text,
  file_target text,
  current_snippet text,
  suggested_fix_summary text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists fixes (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  audit_id uuid references audits(id) on delete cascade,
  issue_id uuid references audit_issues(id) on delete cascade,
  file_target text not null,
  original_code text,
  fixed_code text,
  ai_explanation text,
  ai_model text,
  applied boolean default false,
  applied_at timestamptz,
  applied_by text,
  rollback_backup_id uuid,
  created_at timestamptz default now()
);

create table if not exists backups (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  theme_id text,
  file_target text not null,
  file_content text not null,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  audit_id uuid references audits(id) on delete cascade,
  report_url text,
  format text default 'pdf',
  created_at timestamptz default now()
);

create table if not exists history (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  event_type text not null,
  reference_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audits_shop on audits(shop_id);
create index if not exists idx_issues_audit on audit_issues(audit_id);
create index if not exists idx_fixes_shop on fixes(shop_id);
create index if not exists idx_fixes_issue on fixes(issue_id);
create index if not exists idx_history_shop on history(shop_id);

alter table shops enable row level security;
alter table audits enable row level security;
alter table audit_issues enable row level security;
alter table fixes enable row level security;
alter table backups enable row level security;
alter table reports enable row level security;
alter table history enable row level security;

create policy "service role full access shops" on shops for all using (true) with check (true);
create policy "service role full access audits" on audits for all using (true) with check (true);
create policy "service role full access issues" on audit_issues for all using (true) with check (true);
create policy "service role full access fixes" on fixes for all using (true) with check (true);
create policy "service role full access backups" on backups for all using (true) with check (true);
create policy "service role full access reports" on reports for all using (true) with check (true);
create policy "service role full access history" on history for all using (true) with check (true);
