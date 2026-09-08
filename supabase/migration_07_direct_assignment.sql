-- ============================================================
-- Migration: Direct coachee assignment/reassignment
-- Run this in Supabase SQL Editor -> New snippet -> Run
--
-- Lets a coach directly assign an archived (unassigned) coachee
-- to ANY teammate they share a business with (not just themselves),
-- and lets a coach transfer one of their own coachees directly to
-- a teammate, in one step, without going through the archive.
-- ============================================================

-- Replace the old "claim archived" policy with a broader one that
-- allows assigning to any teammate sharing a business with the actor.
drop policy if exists "Coaches can claim an archived client" on profiles;

create policy "Coaches can assign an archived client to a teammate"
  on profiles for update
  using (role = 'client' and coach_id is null)
  with check (
    role = 'client'
    and coach_id in (select coach_id from business_members where business_id in (select my_business_ids()))
  );

-- New: a coach can directly transfer one of their OWN coachees to
-- any teammate they share a business with.
create policy "Coaches can transfer their own clients to a teammate"
  on profiles for update
  using (role = 'client' and coach_id = auth.uid())
  with check (
    role = 'client'
    and coach_id in (select coach_id from business_members where business_id in (select my_business_ids()))
  );
