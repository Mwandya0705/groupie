-- STEP 3 of 5 — Row Level Security. Run after step 2.

alter table public.profiles   enable row level security;
alter table public.patrols    enable row level security;
alter table public.incidents  enable row level security;
alter table public.evidence   enable row level security;
alter table public.vessels    enable row level security;
alter table public.alerts     enable row level security;
alter table public.sync_logs  enable row level security;
alter table public.audit_logs enable row level security;
alter table public.roles      enable row level security;

do $$
begin
  drop policy if exists "profiles read"   on public.profiles;
  drop policy if exists "profiles update" on public.profiles;
  drop policy if exists "profiles insert" on public.profiles;
  create policy "profiles read"   on public.profiles for select using (true);
  create policy "profiles update" on public.profiles for update using (auth.uid() = id);
  create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);

  drop policy if exists "patrols all" on public.patrols;
  create policy "patrols all" on public.patrols for all to authenticated using (true) with check (true);

  drop policy if exists "incidents all" on public.incidents;
  create policy "incidents all" on public.incidents for all to authenticated using (true) with check (true);

  drop policy if exists "evidence all" on public.evidence;
  create policy "evidence all" on public.evidence for all to authenticated using (true) with check (true);

  drop policy if exists "vessels all" on public.vessels;
  create policy "vessels all" on public.vessels for all to authenticated using (true) with check (true);

  drop policy if exists "alerts all" on public.alerts;
  create policy "alerts all" on public.alerts for all to authenticated using (true) with check (true);

  drop policy if exists "sync_logs all" on public.sync_logs;
  create policy "sync_logs all" on public.sync_logs for all to authenticated using (true) with check (true);

  drop policy if exists "audit read"   on public.audit_logs;
  drop policy if exists "audit insert" on public.audit_logs;
  create policy "audit read"   on public.audit_logs for select to authenticated using (true);
  create policy "audit insert" on public.audit_logs for insert to authenticated with check (true);

  drop policy if exists "roles read" on public.roles;
  create policy "roles read" on public.roles for select to authenticated using (true);
end $$;
