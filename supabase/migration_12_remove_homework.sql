-- ------------------------------------------------------------
-- Migration 12: remove the homework feature
-- The coachee-facing "homework" area has been replaced by a
-- "business information" free-text field (see migration 11).
-- This migration is OPTIONAL clean-up for existing installs: it
-- drops the now-unused homework tables, policies, and storage
-- bucket. Nothing in the app reads these anymore, so it's safe to
-- run whenever you like — or skip it if you'd rather keep the old
-- data around for reference.
-- ------------------------------------------------------------

drop policy if exists "Coaches manage homework for their clients" on homework;
drop policy if exists "Clients can view their own homework" on homework;
drop policy if exists "Clients can update status of their own homework" on homework;
drop policy if exists "Business teammates can view homework" on homework;

drop policy if exists "Clients manage their own submissions" on homework_submissions;
drop policy if exists "Coaches can view submissions from their clients" on homework_submissions;
drop policy if exists "Business teammates can view homework submissions" on homework_submissions;

drop table if exists homework_submissions;
drop table if exists homework;

drop policy if exists "Clients can upload their own homework files" on storage.objects;
drop policy if exists "Clients can read their own homework files" on storage.objects;
drop policy if exists "Coaches can read their clients' homework files" on storage.objects;

delete from storage.buckets where id = 'homework-files';
