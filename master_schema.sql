-- =====================================================================
--  IUU Surveillance & Patrol Monitoring — MASTER SCHEMA
--  Paste this WHOLE file into Supabase Studio → SQL Editor → Run.
--  It is idempotent: safe to run more than once.
--  It creates every table the mobile app AND the web dashboard need,
--  with the exact columns/keys both sides read, plus RLS, storage
--  policies, and an auto-alert trigger for high-threat incidents.
-- =====================================================================

-- Needed for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PROFILES  (one row per auth user; created automatically on signup)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  username    text unique,
  email       text,
  role        text default 'operator' check (role in ('admin','operator','supervisor','guest')),
  authorized  boolean default false,
  department  text,
  last_login  timestamptz,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2. PATROLS  (a tracked mission with a GPS route)
-- ---------------------------------------------------------------------
create table if not exists public.patrols (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  patrol_type text not null check (patrol_type in ('land','water')),
  start_time  timestamptz not null,
  end_time    timestamptz,
  route       jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 3. INCIDENTS  (a reported violation; this is what posts to the dashboard)
--    ai_analysis keys MUST match what the web reads:
--    threat_level, confidence_score, detected_objects, ai_summary
-- ---------------------------------------------------------------------
create table if not exists public.incidents (
  id          uuid primary key default uuid_generate_v4(),
  patrol_id   uuid references public.patrols(id) on delete cascade,
  type        text not null,
  description text,
  latitude    float8 not null,
  longitude   float8 not null,
  ai_analysis jsonb default '{
    "threat_level": "medium",
    "confidence_score": 0.0,
    "detected_objects": [],
    "ai_summary": "Pending analysis..."
  }'::jsonb,
  created_at  timestamptz default now()
);

-- If incidents already existed without ai_analysis, add it now.
alter table public.incidents
  add column if not exists ai_analysis jsonb default '{
    "threat_level": "medium",
    "confidence_score": 0.0,
    "detected_objects": [],
    "ai_summary": "Pending analysis..."
  }'::jsonb;

-- ---------------------------------------------------------------------
-- 4. EVIDENCE  (image attached to an incident)
-- ---------------------------------------------------------------------
create table if not exists public.evidence (
  id          uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  image_url   text not null,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 5. VESSELS  (registry the mobile "Vessel Lookup" screen searches)
-- ---------------------------------------------------------------------
create table if not exists public.vessels (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  registration_number text unique not null,
  vessel_type         text check (vessel_type in ('fishing','cargo','passenger','research','unknown')) default 'unknown',
  status              text check (status in ('authorized','blacklisted','investigating')) default 'authorized',
  owner_info          text,
  last_sighted        timestamptz,
  created_at          timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 6. ALERTS  (auto-raised for high/critical incidents)
-- ---------------------------------------------------------------------
create table if not exists public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  incident_id uuid references public.incidents(id) on delete cascade,
  severity    text check (severity in ('low','medium','high','critical')),
  message     text not null,
  is_resolved boolean default false,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 7. SYNC LOGS  (mobile writes one row each time it flushes its vault)
-- ---------------------------------------------------------------------
create table if not exists public.sync_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id),
  device_id       text,
  last_sync_at    timestamptz default now(),
  status          text check (status in ('success','failed','pending')),
  records_synced  integer default 0,
  error_message   text
);

-- ---------------------------------------------------------------------
-- 8. AUDIT LOGS
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  action      text not null,
  resource    text not null,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 9. ROLES (simple RBAC reference)
-- ---------------------------------------------------------------------
create table if not exists public.roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  permissions jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

insert into public.roles (name, permissions) values
  ('System Administrator', '["*"]'),
  ('Patrol Officer', '["read:incidents","create:incidents","read:vessels"]'),
  ('Analyst', '["read:analytics","read:reports"]')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 10. ANALYTICS VIEW (used by AI dashboard summaries)
-- ---------------------------------------------------------------------
create or replace view public.dashboard_analytics as
select
  type as violation_type,
  count(*) as total_count,
  round(avg((ai_analysis->>'confidence_score')::float)::numeric, 2) as avg_ai_confidence,
  mode() within group (order by (ai_analysis->>'threat_level')) as primary_threat_level
from public.incidents
group by type;

-- ---------------------------------------------------------------------
-- 11. NEW-USER TRIGGER  (auto-create a profile row on signup)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email, role, authorized)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.email,
    case
      when new.email = 'iuuadmin@gmail.com' then 'admin'
      else coalesce(new.raw_user_meta_data->>'role', 'operator')
    end,
    case
      when new.email = 'iuuadmin@gmail.com' then true
      else false
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 12. AUTO-ALERT TRIGGER  (raise an alert when AI flags high/critical)
-- ---------------------------------------------------------------------
create or replace function public.handle_high_threat_incident()
returns trigger as $$
declare
  lvl text := coalesce(new.ai_analysis->>'threat_level', 'medium');
begin
  if lvl in ('high','critical') then
    insert into public.alerts (incident_id, severity, message)
    values (
      new.id,
      lvl,
      'Auto-alert: ' || new.type || ' flagged ' || upper(lvl) || ' threat by AI.'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_incident_high_threat on public.incidents;
create trigger on_incident_high_threat
  after insert on public.incidents
  for each row execute function public.handle_high_threat_incident();

-- =====================================================================
--  ROW LEVEL SECURITY
--  Authenticated officers can read/write operational data; profiles are
--  publicly readable so the login-by-username lookup works.
-- =====================================================================
alter table public.profiles   enable row level security;
alter table public.patrols    enable row level security;
alter table public.incidents  enable row level security;
alter table public.evidence   enable row level security;
alter table public.vessels    enable row level security;
alter table public.alerts     enable row level security;
alter table public.sync_logs  enable row level security;
alter table public.audit_logs enable row level security;
alter table public.roles      enable row level security;

-- helper: drop-then-create so re-runs don't error
do $$
begin
  -- PROFILES
  drop policy if exists "profiles read"   on public.profiles;
  drop policy if exists "profiles update" on public.profiles;
  drop policy if exists "profiles insert" on public.profiles;
  create policy "profiles read"   on public.profiles for select using (true);
  create policy "profiles update" on public.profiles for update using (auth.uid() = id);
  create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);

  -- PATROLS
  drop policy if exists "patrols all" on public.patrols;
  create policy "patrols all" on public.patrols for all to authenticated using (true) with check (true);

  -- INCIDENTS
  drop policy if exists "incidents all" on public.incidents;
  create policy "incidents all" on public.incidents for all to authenticated using (true) with check (true);

  -- EVIDENCE
  drop policy if exists "evidence all" on public.evidence;
  create policy "evidence all" on public.evidence for all to authenticated using (true) with check (true);

  -- VESSELS
  drop policy if exists "vessels all" on public.vessels;
  create policy "vessels all" on public.vessels for all to authenticated using (true) with check (true);

  -- ALERTS
  drop policy if exists "alerts all" on public.alerts;
  create policy "alerts all" on public.alerts for all to authenticated using (true) with check (true);

  -- SYNC LOGS
  drop policy if exists "sync_logs all" on public.sync_logs;
  create policy "sync_logs all" on public.sync_logs for all to authenticated using (true) with check (true);

  -- AUDIT LOGS
  drop policy if exists "audit read"   on public.audit_logs;
  drop policy if exists "audit insert" on public.audit_logs;
  create policy "audit read"   on public.audit_logs for select to authenticated using (true);
  create policy "audit insert" on public.audit_logs for insert to authenticated with check (true);

  -- ROLES
  drop policy if exists "roles read" on public.roles;
  create policy "roles read" on public.roles for select to authenticated using (true);
end $$;

-- =====================================================================
--  STORAGE: 'evidence' bucket for incident photos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do update set public = true;

do $$
begin
  drop policy if exists "evidence upload" on storage.objects;
  drop policy if exists "evidence read"   on storage.objects;
  create policy "evidence upload" on storage.objects
    for insert to authenticated with check (bucket_id = 'evidence');
  create policy "evidence read" on storage.objects
    for select to public using (bucket_id = 'evidence');
end $$;

-- =====================================================================
--  OPTIONAL SEED DATA — a few vessels so the lookup screen isn't empty.
-- =====================================================================
insert into public.vessels (name, registration_number, vessel_type, status, owner_info) values
  ('Sea Harvester',  'TZ-FISH-0091', 'fishing',  'authorized',    'Coastal Fisheries Co-op'),
  ('Night Drifter',  'XX-0000-BLK',  'unknown',  'blacklisted',   'Unknown / flagged in 2024'),
  ('Blue Mariner',   'TZ-CARGO-7782','cargo',    'investigating', 'Mariner Logistics Ltd')
on conflict (registration_number) do nothing;

-- Done. Mobile app and web dashboard now share the same tables.
