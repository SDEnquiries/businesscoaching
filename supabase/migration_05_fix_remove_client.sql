-- ============================================================
-- Migration: Fix "Remove from roster" not working
-- Run this in Supabase SQL Editor -> New snippet -> Run
-- There was no permission allowing a coach to update a client's
-- profile to release them (set coach_id to null), so the Remove
-- button was silently doing nothing. This adds that permission.
-- ============================================================

create policy "Coaches can release their own clients"
  on profiles for update
  using (role = 'client' and coach_id = auth.uid())
  with check (coach_id is null);
