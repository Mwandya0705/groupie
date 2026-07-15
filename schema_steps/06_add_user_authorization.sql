-- ---------------------------------------------------------------------
-- 06. USER AUTHORIZATION CLEARANCE CONTROL
-- Add user authorization/approval controls for system administrators
-- ---------------------------------------------------------------------

-- 1. Add authorized column to profiles table
alter table public.profiles add column if not exists authorized boolean default false;

-- 2. Automatically authorize the initial administrator
update public.profiles set authorized = true where email = 'iuuadmin@gmail.com';

-- 3. Update trigger function to handle authorized default on signup
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
