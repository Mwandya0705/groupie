-- STEP 4 of 5 — evidence storage bucket + policies. Run after step 3.
-- If THIS step gives a permission error, skip it and instead create the
-- bucket manually: Dashboard → Storage → New bucket → name "evidence" → Public.

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
