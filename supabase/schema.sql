-- ============================================================
-- Coaching Portal — Database Schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES
-- One row per user (coach or client). Linked 1:1 to Supabase Auth.
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach', 'client')),
  full_name text not null default '',
  avatar_url text,
  bio text default '',
  coach_id uuid references profiles(id) on delete set null, -- set only for clients
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INVITES
-- A coach invites a client by email; client claims it on signup.
-- ------------------------------------------------------------
create table invites (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  token uuid not null default uuid_generate_v4(),
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HOMEWORK
-- Assigned by a coach to a specific client.
-- ------------------------------------------------------------
create table homework (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'submitted', 'reviewed')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HOMEWORK SUBMISSIONS
-- Client's response: text + optional file/image.
-- ------------------------------------------------------------
create table homework_submissions (
  id uuid primary key default uuid_generate_v4(),
  homework_id uuid not null references homework(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  text_response text default '',
  file_url text,
  submitted_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROGRESS ENTRIES
-- Client's ongoing journal + structured tracking (mood/rating).
-- ------------------------------------------------------------
create table progress_entries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references profiles(id) on delete cascade,
  title text default '',
  journal_text text default '',
  mood_rating int check (mood_rating between 1 and 10),
  metrics jsonb default '{}'::jsonb, -- flexible structured fields, e.g. {"energy": 7, "sleep_hours": 6.5}
  photo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- This is what actually enforces privacy between coaches/clients
-- at the database level, independent of the app's UI code.
-- ============================================================

alter table profiles enable row level security;
alter table invites enable row level security;
alter table homework enable row level security;
alter table homework_submissions enable row level security;
alter table progress_entries enable row level security;

-- Helper: is the current user a coach, and whose client is X?
create or replace function is_coach_of(client_profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = client_profile_id
    and coach_id = auth.uid()
  );
$$;

-- Helper: is the current user a coach at all? (used by the archive feature)
create or replace function is_coach()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'coach'
  );
$$;

-- ---- PROFILES ----
create policy "Users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Coaches can view their own clients' profiles"
  on profiles for select
  using (coach_id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert their own profile on signup"
  on profiles for insert
  with check (id = auth.uid());

create policy "Clients can view basic info of available coaches"
  on profiles for select
  using (role = 'coach');

create policy "Coaches can view archived (unassigned) clients"
  on profiles for select
  using (role = 'client' and coach_id is null and is_coach());

-- ---- INVITES ----
create policy "Coaches manage their own invites"
  on invites for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Anyone can read an invite by token to claim it"
  on invites for select
  using (true);

-- ---- HOMEWORK ----
create policy "Coaches manage homework for their clients"
  on homework for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "Clients can view their own homework"
  on homework for select
  using (client_id = auth.uid());

create policy "Clients can update status of their own homework"
  on homework for update
  using (client_id = auth.uid());

-- ---- HOMEWORK SUBMISSIONS ----
create policy "Clients manage their own submissions"
  on homework_submissions for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Coaches can view submissions from their clients"
  on homework_submissions for select
  using (is_coach_of(client_id));

-- ---- PROGRESS ENTRIES ----
create policy "Clients manage their own progress entries"
  on progress_entries for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Coaches can view progress entries of their clients"
  on progress_entries for select
  using (is_coach_of(client_id));

-- ------------------------------------------------------------
-- RESOURCES
-- Coach-shared links, documents, or videos. Either visible to
-- ALL of the coach's clients, or targeted at one specific client.
-- ------------------------------------------------------------
create table resources (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade, -- null = visible to all of this coach's clients
  title text not null,
  description text default '',
  resource_type text not null default 'link' check (resource_type in ('link', 'file', 'video')),
  url text, -- external link or video URL
  file_url text, -- path in resource-files storage bucket, if an uploaded file
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
-- Groups multiple coaches together under one organisation, via
-- a many-to-many membership table, so a coach can belong to more
-- than one business and reports can be rolled up per business.
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

create table business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (business_id, coach_id)
);

-- Optional explicit business pin for a client, letting a coach pin a
-- coachee to one specific business rather than inheriting all of the
-- owning coach's businesses (see shares_business_with() below).
alter table profiles add column business_id uuid references businesses(id) on delete set null;

alter table businesses enable row level security;
alter table business_invites enable row level security;
alter table business_members enable row level security;

-- Helper: which business IDs does the current user belong to?
create or replace function my_business_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select business_id from business_members where coach_id = auth.uid();
$$;

-- Helper: does a given client belong to a business the current user
-- is also in? Respects an explicit per-coachee business pin if set,
-- otherwise falls back to inheriting from the owning coach's businesses.
create or replace function shares_business_with(client_profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles client_p
    where client_p.id = client_profile_id
    and (
      (client_p.business_id is not null and client_p.business_id in (select my_business_ids()))
      or
      (client_p.business_id is null and client_p.coach_id in (
        select bm2.coach_id from business_members bm2
        where bm2.business_id in (select my_business_ids())
      ))
    )
  );
$$;

create policy "Coaches can manage their own clients' profile fields"
  on profiles for update
  using (role = 'client' and coach_id = auth.uid())
  with check (role = 'client' and coach_id = auth.uid());

create policy "Coaches in a business can view it"
  on businesses for select
  using (id in (select my_business_ids()));

create policy "Creators manage their business"
  on businesses for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Business members can rename their business"
  on businesses for update
  using (id in (select my_business_ids()))
  with check (id in (select my_business_ids()));

create policy "Coaches in the business manage invites for it"
  on business_invites for all
  using (business_id in (select my_business_ids()))
  with check (business_id in (select my_business_ids()));

create policy "Anyone can read a business invite by token to claim it"
  on business_invites for select
  using (true);

create policy "Members can view their own memberships"
  on business_members for select
  using (coach_id = auth.uid());

create policy "Members can view fellow members in their businesses"
  on business_members for select
  using (business_id in (select my_business_ids()));

create policy "Coaches can join a business"
  on business_members for insert
  with check (coach_id = auth.uid());

create policy "Coaches can leave a business"
  on business_members for delete
  using (coach_id = auth.uid());

create policy "Business teammates can view each other's coachees"
  on profiles for select
  using (role = 'client' and shares_business_with(id));

create policy "Coaches can release their own clients"
  on profiles for update
  using (role = 'client' and coach_id = auth.uid())
  with check (coach_id is null);

create policy "Coaches can assign an archived client to a teammate"
  on profiles for update
  using (role = 'client' and coach_id is null)
  with check (
    role = 'client'
    and coach_id in (select coach_id from business_members where business_id in (select my_business_ids()))
  );

create policy "Coaches can transfer their own clients to a teammate"
  on profiles for update
  using (role = 'client' and coach_id = auth.uid())
  with check (
    role = 'client'
    and coach_id in (select coach_id from business_members where business_id in (select my_business_ids()))
  );

create policy "Business teammates can view homework"
  on homework for select
  using (shares_business_with(client_id));

create policy "Business teammates can view homework submissions"
  on homework_submissions for select
  using (shares_business_with(client_id));

create policy "Business teammates can view progress entries"
  on progress_entries for select
  using (shares_business_with(client_id));

-- ------------------------------------------------------------
-- SESSION NOTES
-- Notes a coach keeps about a client. Visible to business
-- teammates who share access to that client; never to the client.
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

-- ------------------------------------------------------------
-- TARGETS
-- A rolling target plan per client: one target per calendar month
-- (title, optional numeric target/actual, status). Either the
-- client or their coach can set or update a month's target; there
-- is no hard cap on how many months can exist, so a plan can run
-- past 12 months if the client wants to keep going.
-- ------------------------------------------------------------
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

create policy "Business teammates can view session notes"
  on session_notes for select
  using (shares_business_with(client_id));

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('homework-files', 'homework-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Avatar policies: publicly readable, only owner can upload/update their own folder (named by their user id)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Homework files: owner (client) can upload/read; their coach can read
create policy "Clients can upload their own homework files"
  on storage.objects for insert
  with check (bucket_id = 'homework-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Clients can read their own homework files"
  on storage.objects for select
  using (bucket_id = 'homework-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Coaches can read their clients' homework files"
  on storage.objects for select
  using (bucket_id = 'homework-files' and is_coach_of(((storage.foldername(name))[1])::uuid));

-- Progress photos: same pattern
create policy "Clients can upload their own progress photos"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Clients can read their own progress photos"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Coaches can read their clients' progress photos"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and is_coach_of(((storage.foldername(name))[1])::uuid));
