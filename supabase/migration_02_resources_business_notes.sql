-- ============================================================
-- Migration: Resources, Businesses, and Session Notes
-- Run this in Supabase SQL Editor -> New snippet -> Run
-- Safe to run once on a database that already has the original
-- schema.sql applied (it only ADDS new tables/columns, it
-- doesn't touch your existing profiles/homework/progress data).
-- ============================================================

-- ------------------------------------------------------------
-- RESOURCES
-- ------------------------------------------------------------
create table resources (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade, -- null = visible to all of this coach's clients
  title text not null,
  description text default '',
  resource_type text not null default 'link' check (resource_type in ('link', 'file', 'video')),
  url text,
  file_url text,
  created_at timestamptz not null default now()
);

alter table resources enable row level security;

create policy "Coaches manage their own resources"
  on resources for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Clients can view resources shared with all of their coach's clients"
  on resources for select
  using (
    client_id is null
    and coach_id = (select coach_id from profiles where id = auth.uid())
  );

create policy "Clients can view resources shared with them specifically"
  on resources for select
  using (client_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

create policy "Coaches can upload their own resource files"
  on storage.objects for insert
  with check (bucket_id = 'resource-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Coaches can read their own resource files"
  on storage.objects for select
  using (bucket_id = 'resource-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Clients can read resource files from their coach"
  on storage.objects for select
  using (
    bucket_id = 'resource-files'
    and (storage.foldername(name))[1]::uuid = (select coach_id from profiles where id = auth.uid())
  );

-- ------------------------------------------------------------
-- BUSINESSES
-- ------------------------------------------------------------
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table business_invites (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  token uuid not null default uuid_generate_v4(),
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked')),
  created_at timestamptz not null default now()
);

alter table profiles add column business_id uuid references businesses(id) on delete set null;

alter table businesses enable row level security;
alter table business_invites enable row level security;

create policy "Coaches in a business can view it"
  on businesses for select
  using (id = (select business_id from profiles where id = auth.uid()));

create policy "Creators manage their business"
  on businesses for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Coaches in the business manage invites for it"
  on business_invites for all
  using (business_id = (select business_id from profiles where id = auth.uid()))
  with check (business_id = (select business_id from profiles where id = auth.uid()));

create policy "Anyone can read a business invite by token to claim it"
  on business_invites for select
  using (true);

-- ------------------------------------------------------------
-- SESSION NOTES
-- ------------------------------------------------------------
create table session_notes (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  note_text text not null default '',
  session_date date,
  created_at timestamptz not null default now()
);

alter table session_notes enable row level security;

create policy "Coaches manage their own session notes"
  on session_notes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
