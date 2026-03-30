-- Migration 002: Leads table with RLS policies

create extension if not exists "pgcrypto";

-- Create leads table if it doesn't exist
create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references gyms(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  source       text not null default 'other'
                 check (source in ('website','instagram','facebook','referral','walk_in','other')),
  status       text not null default 'new'
                 check (status in ('new','contacted','trial_booked','converted','lost')),
  notes        text,
  assigned_pt_id uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for common queries
create index if not exists leads_gym_id_idx on leads(gym_id);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_assigned_pt_id_idx on leads(assigned_pt_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table leads enable row level security;

-- Helper: get the gym_id for the authenticated owner
create or replace function auth_gym_id()
returns uuid language sql security definer stable as $$
  select gym_id from users where id = auth.uid() limit 1
$$;

-- RLS: owners can see all leads for their gym
create policy "owners_see_gym_leads"
  on leads for all
  using (gym_id = auth_gym_id());

-- RLS: PTs see leads assigned to them OR all leads in their gym
create policy "pts_see_leads"
  on leads for select
  using (
    assigned_pt_id = auth.uid()
    or gym_id = auth_gym_id()
  );

-- RLS: anonymous insert for public lead capture (via service role override)
-- Public lead capture should use service role key on the server side.
-- This policy allows anon inserts when the gym_id is valid.
create policy "anon_insert_leads"
  on leads for insert
  with check (true);
