-- =====================================================================
-- BRIAL ENDOWMENT — migration 3: private documents
-- Additive and safe while the current site is live.
--
-- Scholar documents (KTP / rapor / student card / biometric photo / bills /
-- transcripts / graduation papers) move to a PRIVATE bucket `brial-private`.
-- Nobody can open a private file by link alone: the founder gets short-lived
-- signed links through her Supabase login, a scholar gets signed links for
-- HER OWN files through the `be-files` edge function (session token).
-- Public pictures (showcase selfies, e-book covers, programme photos,
-- og-cover) stay in the public bucket `brial-files`.
-- =====================================================================

-- ---------- private bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brial-private', 'brial-private', false, 2097152,
        array['application/pdf','image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "be private upload"         on storage.objects;
drop policy if exists "be private founder read"   on storage.objects;
drop policy if exists "be private founder update" on storage.objects;
drop policy if exists "be private founder delete" on storage.objects;

-- anyone with the site may upload a NEW document (applicants have no Supabase
-- login), but nobody except the founder can read, list, overwrite or delete.
create policy "be private upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'brial-private' and name like 'docs/%' and name not like 'docs/orphans/%');
create policy "be private founder read" on storage.objects for select to authenticated
  using (bucket_id = 'brial-private' and public.be_is_founder());
create policy "be private founder update" on storage.objects for update to authenticated
  using (bucket_id = 'brial-private' and public.be_is_founder());
create policy "be private founder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'brial-private' and public.be_is_founder());

-- ---------- private paths a scholar session may open (edge function only) ----------
create or replace function public.be_session_private_paths(p_token text) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct q #>> '{}'), '{}'::text[])
    from public.applicants a,
         jsonb_path_query(a.data, 'lax $.**.path') q
   where a.id = be_private.session_applicant(p_token)
     and jsonb_typeof(q) = 'string'
     and (q #>> '{}') like 'docs/%';
$$;

-- ---------- public snapshot: never point at a private file ----------
create or replace function be_private.public_applicant(a public.applicants) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', a.id, 'email', '', 'name', a.name, 'status', a.status, 'created_at', a.created_at,
    'data', jsonb_strip_nulls(jsonb_build_object(
      'scholarStatus', a.data->'scholarStatus',
      'cohort',        a.data->'cohort',
      'scholarId',     a.data->'scholarId',
      'acceptedAt',    a.data->'acceptedAt',
      'deleted',       a.data->'deleted',
      'profile', jsonb_build_object(
        'personal', jsonb_strip_nulls(jsonb_build_object(
          'fullName',      a.data->'profile'->'personal'->'fullName',
          'country',       a.data->'profile'->'personal'->'country',
          'showcasePhoto', case when coalesce(a.data->'profile'->'personal'->'showcasePhoto'->>'path', '') not like 'docs/%'
                                then be_private.pub_file(a.data->'profile'->'personal'->'showcasePhoto') end,
          'photoFile',     case when coalesce(a.data->'profile'->'personal'->'photoFile'->>'type', '') like 'image/%'
                                 and coalesce(a.data->'profile'->'personal'->'photoFile'->>'path', '') not like 'docs/%'
                                then be_private.pub_file(a.data->'profile'->'personal'->'photoFile') end)),
        'university', jsonb_strip_nulls(jsonb_build_object(
          'name',            a.data->'profile'->'university'->'name',
          'program',         a.data->'profile'->'university'->'program',
          'degreeLevel',     a.data->'profile'->'university'->'degreeLevel',
          'currentSemester', a.data->'profile'->'university'->'currentSemester'))),
      'semesters', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'id', s->'id', 'label', s->'label', 'number', s->'number', 'status', s->'status',
                 'paidAt', s->'paidAt',
                 'bill', case when jsonb_typeof(s->'bill') = 'object'
                              then jsonb_build_object('amount', s->'bill'->'amount') end)))
          from jsonb_array_elements(case when jsonb_typeof(a.data->'semesters') = 'array'
                                         then a.data->'semesters' else '[]'::jsonb end) s), '[]'::jsonb)
    )));
$$;

-- ---------- one-time move of the existing files ----------
create table if not exists be_private.file_moves (
  old_path  text primary key,
  new_path  text not null unique,
  kind      text not null,              -- 'ref' (used by a scholar record) | 'orphan' (used nowhere)
  mime      text,
  size      bigint,
  copied    boolean not null default false,
  rewritten boolean not null default false,
  removed   boolean not null default false,
  planned_at timestamptz not null default now()
);

-- Plan (idempotent): every file in the public bucket that a scholar record
-- uses (except showcase selfies) and every unused upload goes private under a
-- NEW random name, so links that leaked from the old site lead nowhere.
create or replace function be_private.plan_file_moves() returns int
language plpgsql volatile set search_path = '' as $$
declare n int;
begin
  with appl as (select string_agg(data::text, ' ') t from public.applicants),
       don  as (select string_agg(data::text, ' ') t from public.donations),
       showcase as (select a.data->'profile'->'personal'->'showcasePhoto'->>'path' p from public.applicants a),
       o as (select name, metadata->>'mimetype' mime, (metadata->>'size')::bigint size
               from storage.objects where bucket_id = 'brial-files' and name like 'uploads/%')
  insert into be_private.file_moves(old_path, new_path, kind, mime, size)
  select o.name,
         case when position(o.name in coalesce((select t from appl), '')) > 0 then 'docs/' else 'docs/orphans/' end
           || encode(extensions.gen_random_bytes(16), 'hex')
           || coalesce('.' || lower(substring(o.name from '\.([A-Za-z0-9]+)$')), ''),
         case when position(o.name in coalesce((select t from appl), '')) > 0 then 'ref' else 'orphan' end,
         o.mime, o.size
    from o
   where o.name not in (select p from showcase where p is not null)
     and position(o.name in coalesce((select t from don), '')) = 0
  on conflict (old_path) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- Rewrite scholar records to the new private paths (only for files already
-- copied). The stored public URL is dropped; the site signs links on demand.
create or replace function be_private.apply_file_moves() returns int
language plpgsql volatile set search_path = '' as $$
declare m record; n int := 0; base text := 'https://sdlrjqdbxxzddgivnjws.supabase.co/storage/v1/object/public/brial-files/';
begin
  for m in select * from be_private.file_moves where kind = 'ref' and copied and not rewritten loop
    update public.applicants
       set data = replace(replace(data::text, '"' || base || m.old_path || '"', 'null'),
                          '"' || m.old_path || '"', '"' || m.new_path || '"')::jsonb
     where position(m.old_path in data::text) > 0;
    update be_private.file_moves set rewritten = true where old_path = m.old_path;
    n := n + 1;
  end loop;
  return n;
end $$;

-- edge-function helpers (service role only)
create or replace function public.be_file_moves_pending() returns table(old_path text, new_path text, mime text)
language sql stable security definer set search_path = '' as $$
  select old_path, new_path, mime from be_private.file_moves where not copied order by old_path;
$$;
create or replace function public.be_file_move_copied(p_old text) returns void
language sql volatile security definer set search_path = '' as $$
  update be_private.file_moves set copied = true where old_path = p_old;
$$;
create or replace function public.be_file_moves_removable() returns setof text
language sql stable security definer set search_path = '' as $$
  select old_path from be_private.file_moves
   where copied and not removed and (kind = 'orphan' or rewritten)
     and exists (select 1 from storage.objects o where o.bucket_id = 'brial-private' and o.name = new_path);
$$;
create or replace function public.be_file_move_removed(p_old text) returns void
language sql volatile security definer set search_path = '' as $$
  update be_private.file_moves set removed = true where old_path = p_old;
$$;

-- ---------- privileges ----------
revoke all on table be_private.file_moves from public, anon, authenticated;
revoke all on function be_private.plan_file_moves(), be_private.apply_file_moves(),
  be_private.public_applicant(public.applicants) from public, anon, authenticated;
revoke all on function public.be_session_private_paths(text), public.be_file_moves_pending(),
  public.be_file_move_copied(text), public.be_file_moves_removable(), public.be_file_move_removed(text)
  from public, anon, authenticated;
grant execute on function public.be_session_private_paths(text), public.be_file_moves_pending(),
  public.be_file_move_copied(text), public.be_file_moves_removable(), public.be_file_move_removed(text)
  to service_role;

select be_private.plan_file_moves();
