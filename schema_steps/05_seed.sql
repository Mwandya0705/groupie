-- STEP 5 of 5 — seed roles + a few vessels so screens aren't empty. Run last.

insert into public.roles (name, permissions) values
  ('System Administrator', '["*"]'),
  ('Patrol Officer', '["read:incidents","create:incidents","read:vessels"]'),
  ('Analyst', '["read:analytics","read:reports"]')
on conflict (name) do nothing;

insert into public.vessels (name, registration_number, vessel_type, status, owner_info) values
  ('Sea Harvester',  'TZ-FISH-0091', 'fishing',  'authorized',    'Coastal Fisheries Co-op'),
  ('Night Drifter',  'XX-0000-BLK',  'unknown',  'blacklisted',   'Unknown / flagged in 2024'),
  ('Blue Mariner',   'TZ-CARGO-7782','cargo',    'investigating', 'Mariner Logistics Ltd')
on conflict (registration_number) do nothing;
