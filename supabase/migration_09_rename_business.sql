-- ============================================================
-- Migration: Let any business member rename the business
-- Run this in Supabase SQL Editor -> New snippet -> Run
-- Previously only the original creator could edit a business's
-- name. This lets any current member fix typos or rename it.
-- ============================================================

create policy "Business members can rename their business"
  on businesses for update
  using (id in (select my_business_ids()))
  with check (id in (select my_business_ids()));
