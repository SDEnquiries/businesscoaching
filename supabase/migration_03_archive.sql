-- ============================================================
-- Migration: Coachee Archive
-- Run this in Supabase SQL Editor -> New snippet -> Run
-- Lets any coach view and reclaim clients who have been removed
-- from a roster (coach_id is null) without needing to see other
-- coaches' still-active clients.
-- ============================================================

create or replace function is_coach()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'coach');
$$;

create policy "Coaches can view archived (unassigned) clients"
  on profiles for select
  using (role = 'client' and coach_id is null and is_coach());

create policy "Coaches can claim an archived client"
  on profiles for update
  using (role = 'client' and coach_id is null)
  with check (coach_id = auth.uid() and role = 'client');
