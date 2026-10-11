-- =====================================================================
-- BRIAL ENDOWMENT — security migration, step 2 of 2 (LOCKDOWN)
-- Apply ONLY after the new site (store.js using the be_* RPCs) is live.
-- Removes direct anonymous access to the tables and storage listing.
-- No row content is changed.
-- =====================================================================

-- ---------- tables: founder-only ----------
drop policy if exists "anon write applicants" on public.applicants;
drop policy if exists "anon read applicants"  on public.applicants;
drop policy if exists "auth all applicants"   on public.applicants;
drop policy if exists "anon write donations"  on public.donations;
drop policy if exists "anon read donations"   on public.donations;
drop policy if exists "auth all donations"    on public.donations;
drop policy if exists "anon write reports"    on public.reports;
drop policy if exists "anon read reports"     on public.reports;
drop policy if exists "auth all reports"      on public.reports;

alter table public.applicants enable row level security;
alter table public.donations  enable row level security;
alter table public.reports    enable row level security;

revoke all on public.applicants, public.donations, public.reports from anon;

-- ---------- credentials can only change through the dedicated RPCs ----------
-- (a stale admin tab saving an old copy can no longer roll a password back)
create or replace function be_private.applicants_keep_creds() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('be.cred_write', true), '') <> 'on' then
    new.data := (new.data - 'password' - 'passwordHash')
                || jsonb_strip_nulls(jsonb_build_object('passwordHash', old.data->'passwordHash'));
  end if;
  return new;
end $$;
revoke all on function be_private.applicants_keep_creds() from public, anon, authenticated;
drop trigger if exists be_keep_creds on public.applicants;
create trigger be_keep_creds before update on public.applicants
  for each row execute function be_private.applicants_keep_creds();

-- ---------- storage: uploads still allowed, listing/browsing is not ----------
drop policy if exists "anon storage read"   on storage.objects;
drop policy if exists "anon storage upload" on storage.objects;
drop policy if exists "auth storage delete" on storage.objects;
drop policy if exists "auth storage update" on storage.objects;
drop policy if exists "be anon upload"      on storage.objects;
drop policy if exists "be founder read"     on storage.objects;
drop policy if exists "be founder delete"   on storage.objects;
drop policy if exists "be founder update"   on storage.objects;

create policy "be anon upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'brial-files' and name like 'uploads/%');
create policy "be founder read" on storage.objects for select to authenticated
  using (bucket_id = 'brial-files' and public.be_is_founder());
create policy "be founder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'brial-files' and public.be_is_founder());
create policy "be founder update" on storage.objects for update to authenticated
  using (bucket_id = 'brial-files' and public.be_is_founder());
-- Files stay reachable by their direct public link (photos on the site keep
-- working); what is removed is the ability to LIST the bucket and find every
-- KTP / rapor scan.
