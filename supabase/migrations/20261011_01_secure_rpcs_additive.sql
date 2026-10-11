-- =====================================================================
-- BRIAL ENDOWMENT — security migration, step 1 of 2 (ADDITIVE)
-- Safe to apply while the current site is live: nothing the current
-- site relies on is removed. Adds:
--   * founder allow-list + founder-only RLS policies (alongside old ones)
--   * server-side login / signup / save RPCs for scholars (session tokens)
--   * sanitized public snapshot RPC (no NIK, phone, address, DOB, docs)
--   * donation / report submit RPCs
--   * converts the 3 remaining plaintext passwords to the SAME salted
--     SHA-256 format the current site already verifies (logins keep working)
-- No applicant, donation or report content is changed except removing
-- plaintext passwords.
-- =====================================================================

create schema if not exists be_private;
revoke all on schema be_private from public, anon, authenticated;

-- ---------- founder allow-list ----------
create table if not exists be_private.founders (user_id uuid primary key);
insert into be_private.founders(user_id)
  values ('50fe5c41-5985-4414-8dff-489287c30fa8')   -- asifbrial@gmail.com
  on conflict do nothing;

create or replace function public.be_is_founder() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from be_private.founders f where f.user_id = auth.uid());
$$;

-- ---------- scholar sessions + login throttling ----------
create table if not exists be_private.applicant_sessions (
  token_hash   text primary key,
  applicant_id text not null references public.applicants(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '30 days'
);
create table if not exists be_private.login_attempts (
  id    bigserial primary key,
  email text not null,
  ok    boolean not null,
  at    timestamptz not null default now()
);
create index if not exists login_attempts_email_at on be_private.login_attempts (email, at);

-- ---------- password helpers ----------
-- v1 = salted SHA-256, identical to store.js hashPassword() (old site verifies it)
create or replace function be_private.v1_hash(p_password text) returns text
language plpgsql volatile set search_path = '' as $$
declare s text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  return 'v1:' || s || ':' || encode(extensions.digest(s || ':' || p_password, 'sha256'), 'hex');
end $$;

-- bf = bcrypt (used for passwords set through the new RPCs)
create or replace function be_private.bf_hash(p_password text) returns text
language sql volatile set search_path = '' as $$
  select 'bf:' || extensions.crypt(p_password, extensions.gen_salt('bf', 10));
$$;

create or replace function be_private.verify_pw(p_password text, p_hash text, p_plain text)
returns boolean language plpgsql stable set search_path = '' as $$
declare parts text[];
begin
  if p_password is null or p_password = '' then return false; end if;
  if p_hash like 'bf:%' then
    return extensions.crypt(p_password, substr(p_hash, 4)) = substr(p_hash, 4);
  elsif p_hash like 'v1:%' then
    parts := string_to_array(p_hash, ':');
    if array_length(parts, 1) <> 3 then return false; end if;
    return encode(extensions.digest(parts[2] || ':' || p_password, 'sha256'), 'hex') = parts[3];
  elsif p_plain is not null then
    return p_plain = p_password;
  end if;
  return false;
end $$;

-- Never keep a plaintext password: any write that carries one is hashed (v1,
-- which the current site can still verify).
create or replace function be_private.applicants_no_plaintext() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.data->>'password', '') <> '' then
    if coalesce(new.data->>'passwordHash', '') = '' then
      new.data := jsonb_set(new.data, '{passwordHash}', to_jsonb(be_private.v1_hash(new.data->>'password')));
    end if;
    new.data := jsonb_set(new.data, '{password}', 'null'::jsonb);
  end if;
  return new;
end $$;
drop trigger if exists be_no_plaintext on public.applicants;
create trigger be_no_plaintext before insert or update on public.applicants
  for each row execute function be_private.applicants_no_plaintext();

-- convert the existing plaintext rows (fires the trigger above)
update public.applicants set data = data
 where coalesce(data->>'password', '') <> '';

-- ---------- shaping helpers ----------
create or replace function be_private.strip_creds(d jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(d, '{}'::jsonb) - 'password' - 'passwordHash';
$$;

-- full row for the scholar themself (no credentials, no founder notes)
create or replace function be_private.own_row(a public.applicants) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'email', a.email, 'name', a.name, 'status', a.status,
         'data', be_private.strip_creds(a.data) - 'notes', 'created_at', a.created_at);
$$;

create or replace function be_private.pub_file(f jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case when f is null or jsonb_typeof(f) <> 'object' then null
              else jsonb_strip_nulls(jsonb_build_object('path', f->'path', 'key', f->'key', 'url', f->'url', 'type', f->'type')) end;
$$;

-- what the public showcase / homepage metrics need, nothing more
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
          'showcasePhoto', be_private.pub_file(a.data->'profile'->'personal'->'showcasePhoto'),
          'photoFile',     case when coalesce(a.data->'profile'->'personal'->'photoFile'->>'type', '') like 'image/%'
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

create or replace function be_private.is_internal_donation(p_id text, p_name text) returns boolean
language sql immutable set search_path = '' as $$
  select p_id = any (array['LEGACY-SUMMARY','PILLAR-GRANTS','PILLAR-LINKS','PILLAR-STATUS','PAYMENT-CONFIG',
                           'EBOOKS-CATALOG','FOODLAND-CONTENT','WORSHIP-CONTENT','WATER-CONTENT'])
      or p_id like 'PILLAR-CONTENT-%' or left(coalesce(p_name, ''), 2) = '__';
$$;

create or replace function be_private.public_donation(d public.donations) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('id', d.id, 'name', d.name, 'amount', d.amount, 'created_at', d.created_at,
         'data', case when be_private.is_internal_donation(d.id, d.name) then d.data
                      else coalesce(d.data, '{}'::jsonb) - 'email' end);
$$;

create or replace function be_private.session_applicant(p_token text) returns text
language plpgsql stable set search_path = '' as $$
declare aid text;
begin
  select s.applicant_id into aid from be_private.applicant_sessions s
   where s.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and s.expires_at > now();
  if aid is null then raise exception 'invalid_session' using errcode = 'P0001'; end if;
  return aid;
end $$;

create or replace function be_private.new_session(p_applicant_id text) returns text
language plpgsql volatile set search_path = '' as $$
declare tok text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from be_private.applicant_sessions where expires_at < now();
  insert into be_private.applicant_sessions(token_hash, applicant_id)
  values (encode(extensions.digest(tok, 'sha256'), 'hex'), p_applicant_id);
  return tok;
end $$;

create or replace function be_private.next_id(p_prefix text, p_seed int, p_tbl text) returns text
language plpgsql volatile set search_path = '' as $$
declare m int;
begin
  perform pg_advisory_xact_lock(hashtext('be_next_id_' || p_tbl));
  execute format('select max((substring(id from %L))::int) from public.%I where id ~ %L',
                 '^' || p_prefix || '([0-9]+)$', p_tbl, '^' || p_prefix || '[0-9]+$') into m;
  return p_prefix || (greatest(coalesce(m, p_seed - 1), p_seed - 1) + 1);
end $$;

-- =====================================================================
-- PUBLIC RPCs (callable with the anon key)
-- =====================================================================

-- Everything a visitor's browser needs, sanitized.
create or replace function public.be_public_snapshot() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'applicants', coalesce((select jsonb_agg(be_private.public_applicant(a) order by a.created_at desc)
                              from public.applicants a
                             where a.status = 'accepted' and coalesce(a.data->>'deleted', 'false') <> 'true'), '[]'::jsonb),
    'donations',  coalesce((select jsonb_agg(be_private.public_donation(d) order by d.created_at desc)
                              from public.donations d), '[]'::jsonb));
$$;

-- Scholar sign-in: verifies on the server, returns a session token + own row.
create or replace function public.be_applicant_login(p_email text, p_password text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  a public.applicants;
  fails int;
  ok boolean;
begin
  select count(*) into fails from be_private.login_attempts
   where email = e and not login_attempts.ok and at > now() - interval '15 minutes';
  if fails >= 8 then raise exception 'too_many_attempts' using errcode = 'P0001'; end if;

  select * into a from public.applicants where lower(email) = e limit 1;
  ok := a.id is not null and be_private.verify_pw(p_password, a.data->>'passwordHash', a.data->>'password');
  insert into be_private.login_attempts(email, ok) values (e, ok);
  delete from be_private.login_attempts where at < now() - interval '2 days';
  if not ok then return null; end if;

  -- upgrade legacy hashes to bcrypt
  if coalesce(a.data->>'passwordHash', '') not like 'bf:%' then
    perform set_config('be.cred_write', 'on', true);
    update public.applicants
       set data = jsonb_set(data - 'password', '{passwordHash}', to_jsonb(be_private.bf_hash(p_password)))
     where id = a.id
     returning * into a;
  end if;
  return jsonb_build_object('token', be_private.new_session(a.id), 'row', be_private.own_row(a));
end $$;

create or replace function public.be_applicant_logout(p_token text) returns void
language sql volatile security definer set search_path = '' as $$
  delete from be_private.applicant_sessions
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

-- Scholar sign-up. The client sends its fresh document; only `profile` is taken from it.
create or replace function public.be_applicant_signup(p_email text, p_name text, p_password text, p_doc jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  e   text := trim(coalesce(p_email, ''));
  nm  text := left(trim(coalesce(p_name, '')), 200);
  aid text;
  prof jsonb := coalesce(p_doc->'profile', '{}'::jsonb);
  a public.applicants;
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 254 then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'weak_password' using errcode = 'P0001'; end if;
  if octet_length(prof::text) > 200000 then raise exception 'too_large' using errcode = 'P0001'; end if;
  if exists (select 1 from public.applicants where lower(email) = lower(e)) then
    raise exception 'email_exists' using errcode = 'P0001';
  end if;
  aid := be_private.next_id('A-', 2913, 'applicants');
  perform set_config('be.cred_write', 'on', true);
  insert into public.applicants(id, email, name, status, data)
  values (aid, e, nm, 'registered', jsonb_build_object(
    'passwordHash', be_private.bf_hash(p_password),
    'signedUpAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    'submittedAt', null, 'interviewAt', null, 'interviewDoneAt', null, 'acceptedAt', null, 'rejectedAt', null,
    'notes', '', 'profile', prof,
    'scholarId', null, 'cohort', null, 'walletShort', null,
    'scholarStatus', null, 'statusHistory', '[]'::jsonb, 'graduation', null, 'semesters', '[]'::jsonb,
    'isUserSubmitted', true))
  returning * into a;
  return jsonb_build_object('token', be_private.new_session(a.id), 'row', be_private.own_row(a));
end $$;

-- Own row + own reports.
create or replace function public.be_applicant_me(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare aid text := be_private.session_applicant(p_token); a public.applicants;
begin
  select * into a from public.applicants where id = aid;
  if a.id is null then raise exception 'invalid_session' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'row', be_private.own_row(a),
    'reports', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc)
                           from public.reports r where r.applicant_id = aid), '[]'::jsonb));
end $$;

-- Scholar saves their document. The server keeps every founder-controlled
-- field from the stored row; the scholar can only change what the portal lets
-- them change (profile, bill/IP uploads, change requests, submission, graduation).
create or replace function public.be_applicant_save(p_token text, p_doc jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  aid text := be_private.session_applicant(p_token);
  a   public.applicants;
  cur jsonb;
  d   jsonb := coalesce(p_doc, '{}'::jsonb);
  nd  jsonb;
  new_status text;
  sems jsonb := '[]'::jsonb;
  s jsonb; n jsonb;
  reqs jsonb;
  added int := 0;
begin
  if coalesce(d->>'id', '') <> aid then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if octet_length(d::text) > 500000 then raise exception 'too_large' using errcode = 'P0001'; end if;
  select * into a from public.applicants where id = aid for update;
  cur := a.data;
  nd  := cur;

  -- profile (own data)
  if jsonb_typeof(d->'profile') = 'object' then nd := jsonb_set(nd, '{profile}', d->'profile'); end if;

  -- submission: registered -> submitted only
  new_status := a.status;
  if a.status = 'registered' and d->>'status' = 'submitted' then
    new_status := 'submitted';
    nd := jsonb_set(nd, '{submittedAt}', coalesce(d->'submittedAt', 'null'::jsonb));
  end if;

  -- semesters: only bill / IP uploads on existing semesters; payment fields stay
  if jsonb_typeof(cur->'semesters') = 'array' then
    for s in select * from jsonb_array_elements(cur->'semesters') loop
      n := null;
      if jsonb_typeof(d->'semesters') = 'array' then
        select x into n from jsonb_array_elements(d->'semesters') x where x->>'id' = s->>'id' limit 1;
      end if;
      if n is not null then
        if (n->'bill') is distinct from (s->'bill') and coalesce(s->>'paidAt', '') = '' and jsonb_typeof(n->'bill') = 'object' then
          s := jsonb_set(s, '{bill}', n->'bill');
          if n->>'status' = 'bill-uploaded' then s := jsonb_set(s, '{status}', '"bill-uploaded"'); end if;
        end if;
        if (n->'ip') is distinct from (s->'ip') and jsonb_typeof(n->'ip') = 'object' then
          s := jsonb_set(s, '{ip}', n->'ip');
          if n->>'status' = 'completed' then s := jsonb_set(s, '{status}', '"completed"'); end if;
        end if;
      end if;
      sems := sems || jsonb_build_array(s);
    end loop;
    nd := jsonb_set(nd, '{semesters}', sems);
  end if;

  -- change requests: keep all stored ones untouched, accept new ones as pending
  reqs := case when jsonb_typeof(cur->'changeRequests') = 'array' then cur->'changeRequests' else '[]'::jsonb end;
  if jsonb_typeof(d->'changeRequests') = 'array' then
    for n in select * from jsonb_array_elements(d->'changeRequests') loop
      if n->>'id' is not null and not exists (select 1 from jsonb_array_elements(reqs) r where r->>'id' = n->>'id') then
        added := added + 1;
        if added > 5 then exit; end if;
        reqs := jsonb_build_array((n - 'resolvedAt' - 'reason') || '{"status":"pending"}'::jsonb) || reqs;
      end if;
    end loop;
    nd := jsonb_set(nd, '{changeRequests}', reqs);
  end if;

  -- graduation submitted by the scholar
  if d->>'scholarStatus' = 'graduated' and coalesce(cur->>'scholarStatus', '') = 'active' then
    nd := jsonb_set(nd, '{scholarStatus}', '"graduated"');
    nd := jsonb_set(nd, '{graduation}', coalesce(d->'graduation', 'null'::jsonb));
    nd := jsonb_set(nd, '{statusHistory}',
            coalesce(case when jsonb_typeof(cur->'statusHistory') = 'array' then cur->'statusHistory' end, '[]'::jsonb)
            || jsonb_build_array(jsonb_build_object('status', 'graduated',
                 'reason', 'All semesters completed; degree conferred.',
                 'at', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))));
  end if;

  update public.applicants
     set data = nd, status = new_status,
         name = coalesce(nullif(left(trim(coalesce(d->>'name', '')), 200), ''), name)
   where id = aid
   returning * into a;
  return be_private.own_row(a);
end $$;

-- Scholar changes their own email / password.
create or replace function public.be_applicant_update_account(p_token text, p_email text, p_password text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare aid text := be_private.session_applicant(p_token); e text := trim(coalesce(p_email, '')); a public.applicants;
begin
  if e <> '' then
    if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
    if exists (select 1 from public.applicants where lower(email) = lower(e) and id <> aid) then
      raise exception 'email_exists' using errcode = 'P0001';
    end if;
    update public.applicants set email = e where id = aid;
  end if;
  if coalesce(p_password, '') <> '' then
    if length(p_password) < 8 then raise exception 'weak_password' using errcode = 'P0001'; end if;
    perform set_config('be.cred_write', 'on', true);
    update public.applicants
       set data = jsonb_set(data - 'password', '{passwordHash}', to_jsonb(be_private.bf_hash(p_password)))
     where id = aid;
    -- sign out other devices
    delete from be_private.applicant_sessions
     where applicant_id = aid and token_hash <> encode(extensions.digest(p_token, 'sha256'), 'hex');
  end if;
  select * into a from public.applicants where id = aid;
  return be_private.own_row(a);
end $$;

create or replace function public.be_submit_report(p_token text, p_report jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare aid text := be_private.session_applicant(p_token); a public.applicants; rid text; r public.reports;
begin
  select * into a from public.applicants where id = aid;
  if (select count(*) from public.reports where applicant_id = aid and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  rid := be_private.next_id('R-', 5001, 'reports');
  insert into public.reports(id, applicant_id, status, data)
  values (rid, aid, 'open', jsonb_build_object(
    'applicantName', a.name, 'applicantEmail', a.email,
    'subject',  left(coalesce(p_report->>'subject', ''), 300),
    'message',  left(coalesce(p_report->>'message', ''), 5000),
    'category', left(coalesce(p_report->>'category', 'other'), 40),
    'submittedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    'reply', null))
  returning * into r;
  return to_jsonb(r);
end $$;

-- Public donation form: always lands unverified; config rows can't be touched.
create or replace function public.be_submit_donation(p_donation jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  did text := coalesce(p_donation->>'id', '');
  amt numeric;
  dn public.donations;
begin
  if (select count(*) from public.donations
       where created_at > now() - interval '1 hour' and coalesce(data->>'verified', 'false') <> 'true') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  begin amt := round(coalesce((p_donation->>'amount')::numeric, 0), 2);
  exception when others then amt := 0; end;
  if amt <= 0 or amt > 100000000 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('be_next_id_donations'));
  if did !~ '^D-[0-9]{1,9}$' or exists (select 1 from public.donations where id = did) then
    did := be_private.next_id('D-', 8001, 'donations');
  end if;
  insert into public.donations(id, name, amount, data)
  values (did, coalesce(nullif(left(trim(coalesce(p_donation->>'name', '')), 120), ''), 'Anonymous patron'), amt,
    jsonb_build_object(
      'anonymous', coalesce((p_donation->>'anonymous')::boolean, false),
      'message', left(coalesce(p_donation->>'message', ''), 2000),
      'txHash',  left(coalesce(p_donation->>'txHash', ''), 200),
      'email',   left(coalesce(p_donation->>'email', ''), 254),
      'country', left(coalesce(p_donation->>'country', ''), 100),
      'submittedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'verified', false))
  returning * into dn;
  return be_private.public_donation(dn);
end $$;

-- Founder approves a scholar's password-change request (hash computed in browser).
create or replace function public.be_admin_set_password_hash(p_applicant_id text, p_hash text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if coalesce(p_hash, '') !~ '^(v1:[0-9a-f]+:[0-9a-f]{64}|bf:\$2[aby]\$.+)$' then
    raise exception 'invalid_hash' using errcode = 'P0001';
  end if;
  perform set_config('be.cred_write', 'on', true);
  update public.applicants set data = jsonb_set(data - 'password', '{passwordHash}', to_jsonb(p_hash))
   where id = p_applicant_id;
  delete from be_private.applicant_sessions where applicant_id = p_applicant_id;
end $$;

-- ---------- founder-only table policies (old open policies are removed in step 2) ----------
drop policy if exists "founder all applicants" on public.applicants;
drop policy if exists "founder all donations"  on public.donations;
drop policy if exists "founder all reports"    on public.reports;
create policy "founder all applicants" on public.applicants for all to authenticated
  using (public.be_is_founder()) with check (public.be_is_founder());
create policy "founder all donations" on public.donations for all to authenticated
  using (public.be_is_founder()) with check (public.be_is_founder());
create policy "founder all reports" on public.reports for all to authenticated
  using (public.be_is_founder()) with check (public.be_is_founder());

-- ---------- function privileges ----------
revoke all on all functions in schema be_private from public, anon, authenticated;
revoke all on all tables in schema be_private from public, anon, authenticated;
revoke all on all sequences in schema be_private from public, anon, authenticated;
revoke all on function public.be_is_founder(), public.be_public_snapshot(), public.be_applicant_login(text, text),
  public.be_applicant_logout(text), public.be_applicant_signup(text, text, text, jsonb), public.be_applicant_me(text),
  public.be_applicant_save(text, jsonb), public.be_applicant_update_account(text, text, text),
  public.be_submit_report(text, jsonb), public.be_submit_donation(jsonb), public.be_admin_set_password_hash(text, text)
  from public, anon, authenticated;
grant execute on function public.be_is_founder(), public.be_public_snapshot(), public.be_applicant_login(text, text),
  public.be_applicant_logout(text), public.be_applicant_signup(text, text, text, jsonb), public.be_applicant_me(text),
  public.be_applicant_save(text, jsonb), public.be_applicant_update_account(text, text, text),
  public.be_submit_report(text, jsonb), public.be_submit_donation(jsonb)
  to anon, authenticated;
grant execute on function public.be_admin_set_password_hash(text, text) to authenticated;
