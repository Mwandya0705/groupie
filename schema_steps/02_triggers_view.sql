-- STEP 2 of 5 — view, new-user trigger, auto-alert trigger. Run after step 1.

create or replace view public.dashboard_analytics as
select
  type as violation_type,
  count(*) as total_count,
  round(avg((ai_analysis->>'confidence_score')::float)::numeric, 2) as avg_ai_confidence,
  mode() within group (order by (ai_analysis->>'threat_level')) as primary_threat_level
from public.incidents
group by type;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.email,
    case when new.email = 'iuuadmin@gmail.com' then 'admin'
         else coalesce(new.raw_user_meta_data->>'role', 'operator') end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_high_threat_incident()
returns trigger as $$
declare lvl text := coalesce(new.ai_analysis->>'threat_level', 'medium');
begin
  if lvl in ('high','critical') then
    insert into public.alerts (incident_id, severity, message)
    values (new.id, lvl, 'Auto-alert: ' || new.type || ' flagged ' || upper(lvl) || ' threat by AI.');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_incident_high_threat on public.incidents;
create trigger on_incident_high_threat
  after insert on public.incidents
  for each row execute function public.handle_high_threat_incident();
