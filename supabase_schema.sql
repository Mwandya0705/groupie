-- Supabase Schema for IUU Surveillance and Patrol Monitoring

-- 1. Patrols table
create table patrols (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  patrol_type text not null check (patrol_type in ('land', 'water')),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  route jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 2. Incidents table
create table incidents (
  id uuid primary key default uuid_generate_v4(),
  patrol_id uuid not null references patrols(id) on delete cascade,
  type text not null,
  description text,
  latitude float8 not null,
  longitude float8 not null,
  created_at timestamp with time zone default now()
);

-- 3. Evidence table (for images)
create table evidence (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references incidents(id) on delete cascade,
  image_url text not null,
  created_at timestamp with time zone default now()
);

-- Storage configuration notes:
-- 1. Go to the Supabase Dashboard -> Storage.
-- 2. Create a NEW bucket named 'evidence' and make it PUBLIC.
-- 3. Run the following SQL in the 'SQL Editor' to enable uploads:

-- Allow authenticated users to upload to the 'evidence' bucket
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence');

-- Allow everyone to read evidence (since it's a public surveillance dashboard)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'evidence');

-- Enable RLS on the evidence table and allow authenticated access
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access"
ON public.evidence FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
