-- Founder Console: two-step verification, recovery codes and an activity log (16 Oct 2026)
--
-- * Once the founder has a verified authenticator (TOTP) factor, every founder
--   permission (tables, storage, mail RPCs) needs a session that passed the
--   code step (aal2). A stolen password alone opens nothing.
-- * Ten one-time recovery codes, stored as bcrypt hashes. Using one removes the
--   authenticator so the founder can sign in and set it up again.
-- * Last resort: the Supabase dashboard (Authentication > Users) can always
--   delete the factor.
-- * Activity log: founder changes to applicants, donations and reports, plus
--   security events. Only field names are logged, never values.

-- ---------------------------------------------------------------- activity log
create table if not exists be_private.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_at on be_private.audit_log (at desc);

create or replace function be_private.audit(p_action text, p_target text, p_detail jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into be_private.audit_log(actor, actor_email, action, target, detail)
  values (auth.uid(), (select u.email from auth.users u where u.id = auth.uid()), p_action, p_target, coalesce(p_detail, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------- founder checks
create or replace function be_private.is_founder_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from be_private.founders f where f.user_id = auth.uid());
$$;

create or replace function be_private.founder_has_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.mfa_factors m where m.user_id = auth.uid() and m.status = 'verified');
$$;

create or replace function public.be_is_founder() returns boolean
language sql stable security definer set search_path = '' as $$
  select be_private.is_founder_member()
     and (coalesce(auth.jwt()->>'aal', '') = 'aal2' or not be_private.founder_has_mfa());
$$;

-- ---------------------------------------------------------------- recovery codes
create table if not exists be_private.founder_recovery (
  id bigserial primary key,
  user_id uuid not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists founder_recovery_user on be_private.founder_recovery (user_id);

create or replace function be_private.norm_code(p text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Replace the founder's recovery codes (needs a verified authenticator and the code step).
create or replace function public.be_founder_set_recovery(p_codes text[]) returns int
language plpgsql security definer set search_path = '' as $$
declare c text; n int := 0;
begin
  if not public.be_is_founder() or not be_private.founder_has_mfa() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_codes, 1), 0) not between 8 and 20 then raise exception 'invalid_codes' using errcode = 'P0001'; end if;
  -- old codes stop working but stay on record
  update be_private.founder_recovery set used_at = now() where user_id = auth.uid() and used_at is null;
  foreach c in array p_codes loop
    if length(be_private.norm_code(c)) < 10 then raise exception 'invalid_codes' using errcode = 'P0001'; end if;
    insert into be_private.founder_recovery(user_id, code_hash) values (auth.uid(), be_private.bf_hash(be_private.norm_code(c)));
    n := n + 1;
  end loop;
  perform be_private.audit('security.recovery_codes_created', null, jsonb_build_object('count', n));
  return n;
end $$;

-- Use a recovery code at sign in: removes the authenticator so the founder can enter and set it up again.
create or replace function public.be_founder_use_recovery(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r record; fails int; hit bigint;
begin
  if not be_private.is_founder_member() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select count(*) into fails from be_private.audit_log
   where actor = auth.uid() and action = 'security.recovery_code_failed' and at > now() - interval '1 hour';
  if fails >= 5 then raise exception 'too_many_attempts' using errcode = 'P0001'; end if;
  for r in select id, code_hash from be_private.founder_recovery where user_id = auth.uid() and used_at is null loop
    if be_private.verify_pw(be_private.norm_code(p_code), r.code_hash, null) then hit := r.id; exit; end if;
  end loop;
  if hit is null then
    perform be_private.audit('security.recovery_code_failed', null, '{}'::jsonb);
    return false;
  end if;
  update be_private.founder_recovery set used_at = now() where id = hit;
  delete from auth.mfa_factors where user_id = auth.uid();
  perform be_private.audit('security.recovery_code_used', null,
    jsonb_build_object('remaining', (select count(*) from be_private.founder_recovery where user_id = auth.uid() and used_at is null)));
  return true;
end $$;

create or replace function public.be_founder_security() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when public.be_is_founder() then jsonb_build_object(
    'mfa', be_private.founder_has_mfa(),
    'recoveryLeft', (select count(*) from be_private.founder_recovery where user_id = auth.uid() and used_at is null),
    'recoveryCreatedAt', (select max(created_at) from be_private.founder_recovery where user_id = auth.uid()))
  else null end;
$$;

-- Events the console reports itself (sign in, authenticator added or removed).
create or replace function public.be_founder_log(p_action text, p_detail jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not be_private.is_founder_member() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_action not in ('security.signed_in', 'security.authenticator_added', 'security.authenticator_removed', 'security.signed_out') then
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;
  perform be_private.audit(p_action, null, coalesce(p_detail, '{}'::jsonb) - 'secret' - 'code');
end $$;

create or replace function public.be_founder_activity(p_limit int) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when public.be_is_founder() then coalesce((
    select jsonb_agg(jsonb_build_object('id', l.id, 'at', l.at, 'by', l.actor_email, 'action', l.action, 'target', l.target, 'detail', l.detail) order by l.at desc)
      from (select * from be_private.audit_log order by at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) l), '[]'::jsonb)
  else null end;
$$;

-- ---------------------------------------------------------------- change triggers
create or replace function be_private.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  o jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  n jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  changed jsonb; d jsonb := '{}'::jsonb;
begin
  if not be_private.is_founder_member() then return null; end if;
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(k order by k), '[]'::jsonb) into changed
      from (select jsonb_object_keys(coalesce(n->'data', '{}'::jsonb)) k
            union select jsonb_object_keys(coalesce(o->'data', '{}'::jsonb))) keys
     where (n->'data'->k) is distinct from (o->'data'->k);
    if changed = '[]'::jsonb and (n - 'data' - 'updated_at') = (o - 'data' - 'updated_at') then return null; end if;
    d := jsonb_build_object('fields', changed);
    if (n->>'status') is distinct from (o->>'status') then d := d || jsonb_build_object('status', jsonb_build_object('from', o->>'status', 'to', n->>'status')); end if;
  end if;
  d := d || jsonb_strip_nulls(jsonb_build_object('name', coalesce(n->>'name', o->>'name')));
  perform be_private.audit(tg_table_name || '.' || lower(tg_op), coalesce(n->>'id', o->>'id'), d);
  return null;
end $$;

create trigger be_audit_applicants after insert or update or delete on public.applicants
  for each row execute function be_private.audit_row();
create trigger be_audit_donations after insert or update or delete on public.donations
  for each row execute function be_private.audit_row();
create trigger be_audit_reports after insert or update or delete on public.reports
  for each row execute function be_private.audit_row();

revoke all on function public.be_founder_set_recovery(text[]), public.be_founder_use_recovery(text), public.be_founder_security(),
  public.be_founder_log(text, jsonb), public.be_founder_activity(int) from public, anon;
grant execute on function public.be_founder_set_recovery(text[]), public.be_founder_use_recovery(text), public.be_founder_security(),
  public.be_founder_log(text, jsonb), public.be_founder_activity(int) to authenticated;
