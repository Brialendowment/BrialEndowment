-- Consent to the Terms and Privacy Policy (16 Oct 2026)
-- * New accounts cannot be created without consent (terms + data, and guardian
--   agreement for applicants aged 14 to 17).
-- * Existing scholars must confirm in the Scholar Portal; until they do, the
--   server refuses every save from their account.
-- * Bump be_private.consent_version() when the policy changes in a way that
--   matters: everyone is asked again at their next sign in.

create or replace function be_private.consent_version() returns text
language sql immutable set search_path = '' as $$ select '2026-10-16'::text $$;

create or replace function be_private.has_consent(d jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(d->'consent'->>'version', '') = be_private.consent_version()
     and coalesce((d->'consent'->>'terms')::boolean, false)
     and coalesce((d->'consent'->>'data')::boolean, false)
     and (not coalesce((d->'consent'->>'minor')::boolean, false) or coalesce((d->'consent'->>'guardian')::boolean, false));
$$;

-- Validates what the browser sent and stamps it with the server's time.
create or replace function be_private.clean_consent(p jsonb, p_via text) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  c jsonb;
  minor boolean := coalesce((p->>'minor')::boolean, false);
begin
  if jsonb_typeof(p) <> 'object'
     or coalesce(p->>'version', '') <> be_private.consent_version()
     or not coalesce((p->>'terms')::boolean, false)
     or not coalesce((p->>'data')::boolean, false)
     or (minor and not coalesce((p->>'guardian')::boolean, false)) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;
  c := jsonb_build_object('version', be_private.consent_version(), 'terms', true, 'data', true,
         'minor', minor, 'guardian', minor and coalesce((p->>'guardian')::boolean, false),
         'via', p_via, 'at', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
  return c;
end $$;

create or replace function public.be_applicant_signup(p_email text, p_name text, p_password text, p_doc jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  e   text := trim(coalesce(p_email, ''));
  nm  text := left(trim(coalesce(p_name, '')), 200);
  aid text;
  prof jsonb := coalesce(p_doc->'profile', '{}'::jsonb);
  cons jsonb;
  a public.applicants;
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 254 then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'weak_password' using errcode = 'P0001'; end if;
  if octet_length(prof::text) > 200000 then raise exception 'too_large' using errcode = 'P0001'; end if;
  cons := be_private.clean_consent(p_doc->'consent', 'signup');
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
    'isUserSubmitted', true,
    'consent', cons, 'consentHistory', jsonb_build_array(cons)))
  returning * into a;
  return jsonb_build_object('token', be_private.new_session(a.id), 'row', be_private.own_row(a));
end $function$;

-- Existing account confirms the current Terms and Privacy Policy.
create or replace function public.be_applicant_consent(p_token text, p_consent jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  aid text := be_private.session_applicant(p_token);
  a public.applicants;
  cons jsonb := be_private.clean_consent(p_consent, 'portal');
begin
  if aid is null then raise exception 'invalid_session' using errcode = 'P0001'; end if;
  perform set_config('be.consent_write', 'on', true);
  update public.applicants
     set data = jsonb_set(jsonb_set(data, '{consent}', cons), '{consentHistory}',
                 coalesce(case when jsonb_typeof(data->'consentHistory') = 'array' then data->'consentHistory' end, '[]'::jsonb) || jsonb_build_array(cons))
   where id = aid
   returning * into a;
  return be_private.own_row(a);
end $function$;
-- Consent can only be written by signup (insert) and be_applicant_consent.
-- Any other update (founder console, scholar saves) keeps the stored record.
create or replace function be_private.applicants_keep_consent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('be.consent_write', true), '') <> 'on' then
    new.data := (new.data - 'consent' - 'consentHistory')
                || jsonb_strip_nulls(jsonb_build_object('consent', old.data->'consent', 'consentHistory', old.data->'consentHistory'));
  end if;
  return new;
end $$;
create trigger be_keep_consent before update on public.applicants
  for each row execute function be_private.applicants_keep_consent();

revoke all on function public.be_applicant_consent(text, jsonb) from public;
grant execute on function public.be_applicant_consent(text, jsonb) to anon, authenticated;

create or replace function public.be_applicant_save(p_token text, p_doc jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
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
  if not be_private.has_consent(cur) then raise exception 'consent_required' using errcode = 'P0001'; end if;
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
end $function$;
