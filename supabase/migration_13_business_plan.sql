-- ------------------------------------------------------------
-- Migration 13: expand "business information" into a business plan
-- Replaces the single business_info field on profiles with a
-- dedicated business_plan table covering: current state, vision,
-- focus areas, action steps, and obstacles/support — each with its
-- own coach-feedback field alongside it.
-- ------------------------------------------------------------

create table business_plan (
  client_id uuid primary key references profiles(id) on delete cascade,
  current_state text default '',
  current_state_feedback text default '',
  vision text default '',
  vision_feedback text default '',
  focus_areas text default '',
  focus_areas_feedback text default '',
  action_steps text default '',
  action_steps_feedback text default '',
  obstacles text default '',
  obstacles_feedback text default '',
  updated_at timestamptz not null default now()
);

alter table business_plan enable row level security;

create policy "Clients manage their own business plan"
  on business_plan for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "Coaches manage business plan for their clients"
  on business_plan for all
  using (is_coach_of(client_id))
  with check (is_coach_of(client_id));

create policy "Business teammates can view business plan"
  on business_plan for select
  using (shares_business_with(client_id));

-- Carry forward anything a coachee had already written in the old
-- business_info field, as the "current state" section of their new plan.
insert into business_plan (client_id, current_state)
select id, business_info
from profiles
where role = 'client' and coalesce(business_info, '') <> ''
on conflict (client_id) do nothing;

-- The old field is now folded into business_plan.current_state above.
alter table profiles drop column if exists business_info;
