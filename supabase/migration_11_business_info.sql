-- ============================================================
-- Migration: Business information (replaces Homework)
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- Adds a single free-text field per coachee describing their
-- business and how they want it to grow. Either the coachee or
-- their coach can write to it — same permissions as the existing
-- "bio" field, so no new RLS policies are needed (the existing
-- "Users can update their own profile" and "Coaches can manage
-- their own clients' profile fields" policies already cover any
-- column on a profiles row, including this new one).
-- ============================================================

alter table profiles add column business_info text default '';
