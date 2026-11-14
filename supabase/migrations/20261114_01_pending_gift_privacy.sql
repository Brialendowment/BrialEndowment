-- 14 Nov 2026
-- 1. Pending gifts reveal less in the public snapshot. Until a gift is verified the
--    visitor sees it as "Pending gift": the donor's name, message, email, country,
--    sender and reference are withheld. A transaction hash is shown only when it
--    looks like a real one (64 hex characters, optional 0x); any other free text is
--    replaced by a fixed label taken from the payment method. Verified gifts and
--    configuration rows are unchanged.
-- 2. be_submit_donation checks its input on the server: the email must look like an
--    email, a USDT or BTC transaction hash must have the right shape, and one
--    network address may submit 6 gifts an hour (on top of the global 30 an hour).
--    The address is kept only as a hash, for two days. Over the limit the function
--    raises 'rate_limited'; bad input raises 'invalid_email' or 'invalid_hash'.
-- 3. be_applicant_save ignores change requests of type 'password'.

-- 1. Public view of a donation row.
create or replace function be_private.public_donation(d public.donations)
 returns jsonb
 language sql
 stable
 set search_path to ''
as $function$
  select jsonb_build_object('id', d.id,
         'name', case when d.id ~ '^D-[0-9]+$' and coalesce(d.data->>'verified', 'false') <> 'true'
                           and not be_private.is_internal_donation(d.id, d.name)
                      then 'Pending gift' else d.name end,
         'amount', d.amount, 'created_at', d.created_at,
         'data', case
                   when d.id = 'SITE-CONTACT' then
                     jsonb_build_object('contact', jsonb_build_object('items',
                       coalesce((select jsonb_agg(x)
                                   from jsonb_array_elements(case when jsonb_typeof(d.data->'contact'->'items') = 'array'
                                                                  then d.data->'contact'->'items' else '[]'::jsonb end) x
                                  where x->>'shown' = 'true'), '[]'::jsonb)))
                   when d.id = 'IMPACT-REPORTS' then
                     jsonb_build_object('data', jsonb_build_object('reports', be_private.public_impact_reports(d.data)))
                   when be_private.is_internal_donation(d.id, d.name) then d.data
                   when d.id ~ '^D-[0-9]+$' and coalesce(d.data->>'verified', 'false') <> 'true' then
                     ((coalesce(d.data, '{}'::jsonb) - 'email' - 'message' - 'country') #- '{payment,sender}' #- '{payment,ref}')
                     || jsonb_build_object('txHash',
                          case when coalesce(d.data->>'txHash', '') ~ '^(0x)?[0-9a-fA-F]{64}$' then d.data->>'txHash'
                               else case d.data->'payment'->>'method'
                                      when 'bank' then 'Bank transfer'
                                      when 'qris' then 'QRIS'
                                      when 'wire' then 'Bank wire'
                                      when 'card' then 'Card via Lynk'
                                      else '' end
                          end)
                   else (coalesce(d.data, '{}'::jsonb) - 'email') #- '{payment,sender}' #- '{payment,ref}' end);
$function$;

-- 2. Per-address log for the donation form.
create table if not exists be_private.donation_log (
  id      bigint generated always as identity primary key,
  ip_hash text,
  at      timestamptz not null default now()
);
alter table be_private.donation_log enable row level security;
revoke all on table be_private.donation_log from public, anon, authenticated;
create index if not exists donation_log_at on be_private.donation_log (at);

create or replace function public.be_submit_donation(p_donation jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  did text := coalesce(p_donation->>'id', '');
  amt numeric;
  dn public.donations;
  p jsonb := case when jsonb_typeof(p_donation->'payment') = 'object' then p_donation->'payment' else null end;
  pay jsonb := null;
  em text := trim(coalesce(p_donation->>'email', ''));
  txh text := left(trim(coalesce(p_donation->>'txHash', '')), 200);
  ih text;
begin
  if (select count(*) from public.donations
       where created_at > now() - interval '1 hour' and coalesce(data->>'verified', 'false') <> 'true') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  begin amt := round(coalesce((p_donation->>'amount')::numeric, 0), 2);
  exception when others then amt := 0; end;
  if amt <= 0 or amt > 100000000 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
  if em <> '' and (length(em) > 254 or em !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]{2,}$') then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;
  if p is not null then
    pay := jsonb_strip_nulls(jsonb_build_object(
      'method',   case when p->>'method' in ('usdt', 'bank', 'card', 'qris', 'wire', 'btc') then p->>'method' end,
      'currency', case when p->>'currency' in ('USD', 'USDT', 'IDR', 'TRY', 'EUR', 'SGD', 'BTC') then p->>'currency' end,
      'paid',     round(least(greatest(be_private.try_num(p->>'paid'), 0), 1e13), 8),
      'rate',     round(least(greatest(be_private.try_num(p->>'rate'), 0), 1e9), 4),
      'paidAt',   nullif(left(coalesce(p->>'paidAt', ''), 40), ''),
      'sender',   nullif(left(trim(coalesce(p->>'sender', '')), 120), ''),
      'ref',      nullif(left(trim(coalesce(p->>'ref', '')), 120), '')));
    if pay = '{}'::jsonb then pay := null; end if;
  end if;
  if pay->>'method' = 'usdt' and txh !~ '^0x[0-9a-fA-F]{64}$' then
    raise exception 'invalid_hash' using errcode = 'P0001';
  end if;
  if pay->>'method' = 'btc' and regexp_replace(txh, '^0[xX]', '') !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'invalid_hash' using errcode = 'P0001';
  end if;
  ih := be_private.client_ip_hash();
  delete from be_private.donation_log where at < now() - interval '2 days';
  if ih is not null and (select count(*) from be_private.donation_log where ip_hash = ih and at > now() - interval '1 hour') >= 6 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into be_private.donation_log(ip_hash) values (ih);
  perform pg_advisory_xact_lock(hashtext('be_next_id_donations'));
  if did !~ '^D-[0-9]{1,9}$' or exists (select 1 from public.donations where id = did) then
    did := be_private.next_id('D-', 8001, 'donations');
  end if;
  insert into public.donations(id, name, amount, data)
  values (did, coalesce(nullif(left(trim(coalesce(p_donation->>'name', '')), 120), ''), 'Anonymous patron'), amt,
    jsonb_build_object(
      'anonymous', coalesce((p_donation->>'anonymous')::boolean, false),
      'message', left(coalesce(p_donation->>'message', ''), 2000),
      'txHash',  txh,
      'email',   left(em, 254),
      'country', left(coalesce(p_donation->>'country', ''), 100),
      'submittedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'verified', false)
    || case when pay is not null then jsonb_build_object('payment', pay) else '{}'::jsonb end)
  returning * into dn;
  return be_private.public_donation(dn);
end $function$;

revoke all on function public.be_submit_donation(jsonb) from public;
grant execute on function public.be_submit_donation(jsonb) to anon, authenticated;

-- 3. Ignore password change requests. The anchor must exist in the current
--    definition, otherwise nothing changes and the migration fails.
do $do$
declare
  def text;
  a1 text := $a$if n->>'id' is not null and not exists (select 1 from jsonb_array_elements(reqs) r where r->>'id' = n->>'id') then$a$;
begin
  select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'be_applicant_save';
  if def is null then raise exception 'be_applicant_save not found'; end if;
  def := replace(def, E'\r\n', E'\n');
  if position($m$<> 'password'$m$ in def) > 0 then return; end if;            -- already applied
  if position(a1 in def) = 0 then raise exception 'be_applicant_save has changed; update this migration'; end if;
  def := replace(def, a1, replace(a1, ' then', $r$ and coalesce(n->>'type', '') <> 'password' then$r$));
  execute def;
end
$do$;
