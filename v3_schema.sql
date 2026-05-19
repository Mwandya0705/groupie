-- Enhanced Supabase Schema V3 - System Administration & Advanced Monitoring

-- 1. Profiles & User Management
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  email text,
  role text default 'operator' check (role in ('admin', 'operator', 'supervisor', 'guest')),
  department text,
  last_login timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  action text not null,
  resource text not null,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- 3. Sync Monitoring
create table if not exists sync_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  device_id text,
  last_sync_at timestamp with time zone default now(),
  status text check (status in ('success', 'failed', 'pending')),
  records_synced integer default 0,
  error_message text
);

-- 4. Roles and Permissions (Simple RBAC)
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  permissions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Seed basic roles
insert into roles (name, permissions) values 
('System Administrator', '["*"]'),
('Patrol Officer', '["read:incidents", "create:incidents", "read:vessels"]'),
('Analyst', '["read:analytics", "read:reports"]')
on conflict (name) do nothing;

-- 5. Trigger for Profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'username',
    new.email,
    case 
      when new.email = 'iuuadmin@gmail.com' then 'admin'
      when new.raw_user_meta_data->>'role' = 'admin' then 'operator'
      else coalesce(new.raw_user_meta_data->>'role', 'operator')
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- RLS Policies
alter table profiles enable row level security;
alter table audit_logs enable row level security;
alter table sync_logs enable row level security;
alter table roles enable row level security;

create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update their own profiles" on profiles for update using (auth.uid() = id);
create policy "Admins can view audit logs" on audit_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can view sync logs" on sync_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Roles are viewable by authenticated" on roles for select to authenticated using (true);
