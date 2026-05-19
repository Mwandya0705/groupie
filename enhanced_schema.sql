-- Enhanced Supabase Schema for IUU Surveillance and Patrol Monitoring (V2)

-- 1. Vessel Registry (Authorized vs Blacklisted)
create table if not exists vessels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  registration_number text unique not null,
  vessel_type text check (vessel_type in ('fishing', 'cargo', 'passenger', 'research', 'unknown')),
  status text check (status in ('authorized', 'blacklisted', 'investigating')) default 'authorized',
  owner_info text,
  last_sighted timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. Add AI Analysis support to Incidents
alter table incidents add column if not exists ai_analysis jsonb default '{
  "threat_level": "medium",
  "confidence_score": 0.0,
  "detected_objects": [],
  "ai_summary": "Pending analysis..."
}'::jsonb;

-- 3. Alerts system for high-threat incidents
create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references incidents(id) on delete cascade,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  is_resolved boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. Analytical Views for AI Dashboard
create or replace view dashboard_analytics as
select
  type as violation_type,
  count(*) as total_count,
  round(avg((ai_analysis->>'confidence_score')::float)::numeric, 2) as avg_ai_confidence,
  mode() within group (order by (ai_analysis->>'threat_level')) as primary_threat_level
from incidents
group by type;

-- RLS Policies for new tables
alter table public.vessels enable row level security;
alter table public.alerts enable row level security;

create policy "Authenticated users can manage vessels" on public.vessels for all to authenticated using (true);
create policy "Authenticated users can manage alerts" on public.alerts for all to authenticated using (true);
