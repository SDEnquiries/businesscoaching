-- ------------------------------------------------------------
-- Migration 14: focus area and coach feedback on targets
-- Adds a "pillar" (free-text focus area/category, e.g. "Sales",
-- "Team", "Cash flow") and a "coach_feedback" field to each
-- monthly target, so the coach can leave comments/suggestions
-- on a specific month.
-- ------------------------------------------------------------

alter table targets add column if not exists pillar text default '';
alter table targets add column if not exists coach_feedback text default '';
