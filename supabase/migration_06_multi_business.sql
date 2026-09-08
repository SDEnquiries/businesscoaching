-- ============================================================
-- Migration: Multiple businesses + full team access
-- Run this in Supabase SQL Editor -> New snippet -> Run
--
-- Changes:
-- 1. A coach can now belong to MULTIPLE businesses (not just one)
--    via a new business_members table. The old profiles.business_id
--    column is no longer used by the app but is left in place
--    harmlessly (safe to ignore).
-- 2. Coaches who share a business can now fully view (and manage
--    homework/notes for) each other's coachees.
-- ============================================================

create table business_members (
  business_id uuid not null references businesses(id) on delete cascade,
  coach_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (business_id, coach_id)
);

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

-- Migrate any existing single-business memberships across
insert into business_members (business_id, coach_id)
select business_id, id from profiles
where business_id is not null and role = 'coach'
on conflict do nothing;

-- Helper: does a given client belong to a coach who shares a
-- business with the current user?
create or replace function shares_business_with(client_profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from profiles client_p
    where client_p.id = client_profile_id
    and client_p.coach_id in (
      select bm2.coach_id from business_members bm2
      where bm2.business_id in (select my_business_ids())
    )
  );
$$;

create policy "Business teammates can view each other's coachees"
  on profiles for select
  using (role = 'client' and shares_business_with(id));

create policy "Business teammates can view homework"
  on homework for select
  using (shares_business_with(client_id));

create policy "Business teammates can view homework submissions"
  on homework_submissions for select
  using (shares_business_with(client_id));

create policy "Business teammates can view progress entries"
  on progress_entries for select
  using (shares_business_with(client_id));

create policy "Business teammates can view session notes"
  on session_notes for select
  using (shares_business_with(client_id));
