-- ============================================================
-- Migration: Monthly targets
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- Adds a rolling target plan per client: one target per calendar
-- month (title, optional numeric target/actual, status). Either
-- the client or their coach can set or update a month's target;
-- there's no hard cap on how many months can be added, so a plan
-- can run past 12 months if the client wants to keep going.
-- ============================================================

create table targets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references profiles(id) on delete cascade,
  period_month date not null, -- always the 1st of the month, e.g. 2026-09-01
  title text not null default '',
  description text default '',
  target_value numeric,
  target_unit text default '',
  actual_value numeric,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'achieved', 'missed')),
  created_by uuid not null references profiles(id) on delete cascade,
  last_updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, period_month)
);

alter table targets enable row level security;

create policy "Clients manage their own targets"
  on targets for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Coaches manage targets for their clients"
  on targets for all
  using (is_coach_of(client_id))
  with check (is_coach_of(client_id));

create policy "Business teammates can view targets"
  on targets for select
  using (shares_business_with(client_id));
