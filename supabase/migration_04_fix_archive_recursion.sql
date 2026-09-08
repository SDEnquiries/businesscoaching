-- ============================================================
-- Migration: Fix recursion in archive policy
-- Run this in Supabase SQL Editor -> New snippet -> Run
-- Fixes a blank dashboard caused by the archive feature's
-- policy checking the profiles table from within a policy
-- ON the profiles table, which Postgres can't evaluate safely.
-- This replaces it with a small helper function instead.
-- ============================================================

create or replace function is_coach()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'coach');
$$;

drop policy if exists "Coaches can view archived (unassigned) clients" on profiles;

create policy "Coaches can view archived (unassigned) clients"
  on profiles for select
  using (role = 'client' and coach_id is null and is_coach());
