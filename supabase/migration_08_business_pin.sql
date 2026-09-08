-- ============================================================
-- Migration: Let a coach pin a coachee to one specific business
-- Run this in Supabase SQL Editor -> New snippet -> Run
--
-- Previously a coachee's business was automatically inherited from
-- ALL businesses their coach belongs to. If a coach is in more than
-- one business, this meant a coachee showed up in every one of them,
-- with no way to correct a "wrong invite link" mistake.
--
-- This adds an explicit pin: if set, the coachee belongs to exactly
-- that one business. If left unset, the old automatic behaviour
-- (inherit from coach's businesses) still applies, so nothing breaks
-- for existing coachees.
-- ============================================================

-- profiles.business_id already exists from an earlier migration and
-- is safe to reuse here for this purpose.

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
      -- explicit pin set: only counts if the current user is also in that exact business
      (client_p.business_id is not null and client_p.business_id in (select my_business_ids()))
      or
      -- no explicit pin: fall back to matching via the owning coach's memberships
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
