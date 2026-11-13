-- 13 Nov 2026
-- 1. The public snapshot carries confirmed gifts only.
--    A gift recorded through the public form (id D-<number>) stays out of the
--    snapshot until the founder, or the on-chain check, has verified it. Until now
--    an unverified entry (any name, message and amount) reached every visitor.
--    Configuration rows that share the table are unaffected. The founder console
--    reads the table directly, so pending gifts still appear there for review.
-- 2. New scholar accounts are rate limited: 5 an hour from one network address,
--    40 an hour in all. The address is kept only as a hash, for two days.
--    Over the limit the function raises 'rate_limited', which the site explains.

create or replace function public.be_public_snapshot()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select jsonb_build_object(
    'applicants', coalesce((select jsonb_agg(be_private.public_applicant(a) order by a.created_at desc)
                              from public.applicants a
                             where a.status = 'accepted' and coalesce(a.data->>'deleted', 'false') <> 'true'), '[]'::jsonb),
    'donations',  coalesce((select jsonb_agg(be_private.public_donation(d) order by d.created_at desc)
                              from public.donations d
                             where not (d.id ~ '^D-[0-9]+$' and coalesce(d.data->>'verified', 'false') <> 'true')), '[]'::jsonb));
$function$;

create table if not exists be_private.signup_log (
  id      bigint generated always as identity primary key,
  ip_hash text,
  at      timestamptz not null default now()
);
alter table be_private.signup_log enable row level security;
revoke all on be_private.signup_log from public, anon, authenticated;
create index if not exists signup_log_at on be_private.signup_log (at);

-- Hash of the caller's network address, or null when the request carries none.
create or replace function be_private.client_ip_hash()
 returns text
 language plpgsql
 stable
 set search_path to ''
as $function$
declare h json; ip text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  if h is null then return null; end if;
  ip := nullif(trim(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1))), '');
  if ip is null then return null; end if;
  return encode(extensions.digest(ip || ':be-signup', 'sha256'), 'hex');
end
$function$;
revoke all on function be_private.client_ip_hash() from public, anon, authenticated;

-- Add the limit to be_applicant_signup without retyping the function: the two
-- anchors below must exist in the current definition, otherwise nothing changes.
do $do$
declare
  def text;
  a1 text := E'  a public.applicants;\nbegin';
  a2 text := E'  aid := be_private.next_id(''A-'', 2913, ''applicants'');';
begin
  select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'be_applicant_signup';
  def := replace(def, E'\r\n', E'\n');
  if def is null then raise exception 'be_applicant_signup not found'; end if;
  if position('signup_log' in def) > 0 then return; end if;            -- already applied
  if position(a1 in def) = 0 or position(a2 in def) = 0 then
    raise exception 'be_applicant_signup has changed; update this migration';
  end if;
  def := replace(def, a1, E'  a public.applicants;\n  ih text;\nbegin');
  def := replace(def, a2,
       E'  ih := be_private.client_ip_hash();\n'
    || E'  delete from be_private.signup_log where at < now() - interval ''2 days'';\n'
    || E'  if (ih is not null and (select count(*) from be_private.signup_log where ip_hash = ih and at > now() - interval ''1 hour'') >= 5)\n'
    || E'     or (select count(*) from be_private.signup_log where at > now() - interval ''1 hour'') >= 40 then\n'
    || E'    raise exception ''rate_limited'' using errcode = ''P0001'';\n'
    || E'  end if;\n'
    || E'  insert into be_private.signup_log(ip_hash) values (ih);\n'
    || a2);
  execute def;
end
$do$;
