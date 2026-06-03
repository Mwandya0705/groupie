-- STEP 1 of 5 — extension + all tables. Run this first.
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  username    text unique,
  email       text,
  role        text default 'operator' check (role in ('admin','operator','supervisor','guest')),
  department  text,
  last_login  timestamptz,
  created_at  timestamptz default now()
);

create table if not exists public.patrols (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  patrol_type text not null check (patrol_type in ('land','water')),
  start_time  timestamptz not null,
  end_time    timestamptz,
  route       jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.incidents (
  id          uuid primary key default uuid_generate_v4(),
  patrol_id   uuid references public.patrols(id) on delete cascade,
  type        text not null,
  description text,
  latitude    float8 not null,
  longitude   float8 not null,
  ai_analysis jsonb default '{"threat_level":"medium","confidence_score":0.0,"detected_objects":[],"ai_summary":"Pending analysis..."}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.incidents
  add column if not exists ai_analysis jsonb default '{"threat_level":"medium","confidence_score":0.0,"detected_objects":[],"ai_summary":"Pending analysis..."}'::jsonb;

create table if not exists public.evidence (
  id          uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  image_url   text not null,
  created_at  timestamptz default now()
);

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

create table if not exists public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  incident_id uuid references public.incidents(id) on delete cascade,
  severity    text check (severity in ('low','medium','high','critical')),
  message     text not null,
  is_resolved boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.sync_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id),
  device_id       text,
  last_sync_at    timestamptz default now(),
  status          text check (status in ('success','failed','pending')),
  records_synced  integer default 0,
  error_message   text
);

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  action      text not null,
  resource    text not null,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz default now()
);

create table if not exists public.roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  permissions jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);
