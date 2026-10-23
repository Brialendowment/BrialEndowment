-- Bitcoin gifts, and USDT into the endowment's own wallet (23 Oct 2026)
-- * The donate page now takes BTC to a self-custody Trust Wallet address
--   (PAYMENT-CONFIG btc). A gift reported with method "btc" and a Bitcoin
--   transaction id (64 hex) is queued like a USDT gift; the be-chain worker
--   reads it from public Bitcoin explorers and values it in US dollars at the
--   price when its block was mined. The reported BTC amount is kept as
--   payment.paid; the ledger amount becomes the dollar value received.
-- * USDT moves from an exchange deposit address to the same self-custody
--   wallet. That address receives on every EVM network, so usdt.anyEvm lets the
--   worker accept Ethereum, BNB Chain, Polygon and Arbitrum; usdt.previous keeps
--   the old exchange address verifiable (on its own network) for late reports.
-- * BTC amounts keep 8 decimals in the gift's payment record.

create or replace function be_private.chain_cfg() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'address', coalesce(u->>'address', ''),
    'network', coalesce(u->>'network', 'ERC-20'),
    'confirmations', coalesce(nullif(u->>'confirmations', '')::int, 12),
    'autoVerify', coalesce((u->>'autoVerify')::boolean, true),
    'enabled', coalesce((u->>'enabled')::boolean, true),
    'anyEvm', coalesce((u->>'anyEvm')::boolean, false),
    'previous', case when jsonb_typeof(u->'previous') = 'array' then u->'previous' else '[]'::jsonb end,
    'btc', jsonb_build_object(
      'address', coalesce(b->>'address', ''),
      'confirmations', coalesce(nullif(b->>'confirmations', '')::int, 2),
      'autoVerify', coalesce((b->>'autoVerify')::boolean, true),
      'enabled', coalesce((b->>'enabled')::boolean, false)))
  from (select coalesce((select data->'data'->'payments'->'usdt' from public.donations where id = 'PAYMENT-CONFIG'), '{}'::jsonb) u,
               coalesce((select data->'data'->'payments'->'btc' from public.donations where id = 'PAYMENT-CONFIG'), '{}'::jsonb) b) x;
$$;

-- automatic checks run while either USDT or BTC has them switched on
create or replace function be_private.chain_auto() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((c->>'autoVerify')::boolean, true) or coalesce((c->'btc'->>'autoVerify')::boolean, true)
  from (select be_private.chain_cfg() c) x;
$$;

-- an EVM hash, or a Bitcoin transaction id on a gift reported as BTC
create or replace function be_private.chain_hash(p_data jsonb) returns text
language sql immutable set search_path = '' as $$
  select case
    when lower(trim(coalesce(p_data->>'txHash', ''))) ~ '^0x[0-9a-f]{64}$' then lower(trim(p_data->>'txHash'))
    when coalesce(p_data->'payment'->>'method', '') = 'btc'
         and lower(regexp_replace(trim(coalesce(p_data->>'txHash', '')), '^0x', '')) ~ '^[0-9a-f]{64}$'
      then lower(regexp_replace(trim(p_data->>'txHash'), '^0x', ''))
  end;
$$;

create or replace function be_private.chain_on_donation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h text := be_private.chain_hash(new.data);
begin
  if not be_private.is_gift(new.id, new.name, new.data) then return null; end if;
  if coalesce(new.data->>'verified', 'false') = 'true' then return null; end if;
  if h is null then return null; end if;
  if tg_op = 'UPDATE' and be_private.chain_hash(old.data) = h
     and exists (select 1 from be_private.chain_checks where donation_id = new.id) then return null; end if;
  insert into be_private.chain_checks (donation_id, tx_hash) values (new.id, h)
  on conflict (donation_id) do update
     set tx_hash = excluded.tx_hash, status = 'queued', reason = null, result = '{}'::jsonb,
         attempts = 0, next_try_at = now(), claimed_at = null
   where be_private.chain_checks.tx_hash <> excluded.tx_hash;
  if be_private.chain_auto() then perform be_private.chain_kick(); end if;
  return null;
end $$;

create or replace function be_private.chain_sweep() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update be_private.chain_checks set status = 'retry' where status = 'checking' and claimed_at < now() - interval '5 minutes';
  if be_private.chain_auto()
     and exists (select 1 from be_private.chain_checks where status in ('queued','waiting','retry') and next_try_at <= now()) then
    perform be_private.chain_kick();
  end if;
end $$;

create or replace function public.be_chain_claim(p_limit int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare cfg jsonb := be_private.chain_cfg(); items jsonb;
begin
  update be_private.chain_checks c set status = 'skipped', reason = 'Verified by hand.', checked_at = now()
   where c.status in ('queued','waiting','retry','checking','review','not_found','error')
     and exists (select 1 from public.donations d where d.id = c.donation_id and coalesce(d.data->>'verified', 'false') = 'true');
  delete from be_private.chain_checks c where not exists (select 1 from public.donations d where d.id = c.donation_id);
  if coalesce(p_limit, 0) <= 0 or not be_private.chain_auto() then
    return jsonb_build_object('config', cfg, 'items', '[]'::jsonb);
  end if;
  with due as (
    select c.donation_id from be_private.chain_checks c
     where c.status in ('queued','waiting','retry') and c.next_try_at <= now()
     order by c.next_try_at
     limit least(p_limit, 20)
     for update skip locked
  ), up as (
    update be_private.chain_checks c set status = 'checking', claimed_at = now(), attempts = c.attempts + 1
      from due where c.donation_id = due.donation_id
    returning c.donation_id, c.tx_hash
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', d.id, 'txHash', up.tx_hash, 'amount', d.amount, 'submittedAt', d.data->>'submittedAt',
           'method', d.data->'payment'->>'method', 'paid', d.data->'payment'->'paid',
           'duplicateOf', (select o.id from public.donations o
                            where o.id <> d.id and be_private.chain_hash(o.data) = up.tx_hash
                              and be_private.is_gift(o.id, o.name, o.data)
                              and (coalesce(o.data->>'verified', 'false') = 'true' or o.created_at < d.created_at)
                            order by o.created_at limit 1))), '[]'::jsonb)
    into items
    from up join public.donations d on d.id = up.donation_id;
  return jsonb_build_object('config', cfg, 'items', items);
end $$;

create or replace function public.be_chain_done(p_id text, p_tx text, p_result jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  d public.donations; c be_private.chain_checks;
  st text := coalesce(p_result->>'status', 'error');
  v_reason text := left(coalesce(p_result->>'reason', ''), 500);
  rec numeric; usd numeric; tok text := coalesce(p_result->>'token', 'USDT'); nxt timestamptz; age interval; dup text;
begin
  select * into c from be_private.chain_checks where donation_id = p_id for update;
  if c.donation_id is null then return jsonb_build_object('ok', false, 'why', 'no_check'); end if;
  select * into d from public.donations where id = p_id for update;
  if d.id is null then delete from be_private.chain_checks where donation_id = p_id; return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  if coalesce(d.data->>'verified', 'false') = 'true' then
    update be_private.chain_checks set status = 'skipped', reason = 'Verified by hand.', checked_at = now() where donation_id = p_id;
    return jsonb_build_object('ok', true, 'status', 'skipped');
  end if;
  if coalesce(be_private.chain_hash(d.data), '') <> lower(coalesce(p_tx, '')) or c.tx_hash <> lower(coalesce(p_tx, '')) then
    update be_private.chain_checks set status = 'queued', next_try_at = now() where donation_id = p_id;
    return jsonb_build_object('ok', false, 'why', 'hash_changed');
  end if;
  age := now() - c.created_at;

  if st = 'verified' then
    select o.id into dup from public.donations o
     where o.id <> d.id and be_private.chain_hash(o.data) = c.tx_hash
       and coalesce(o.data->>'verified', 'false') = 'true' limit 1;
    begin rec := round((p_result->>'received')::numeric, case when tok = 'BTC' then 8 else 2 end); exception when others then rec := null; end;
    -- the ledger is in US dollars: USDT counts one for one, BTC at its price when the block was mined
    begin usd := round(coalesce((p_result->>'valueUsd')::numeric, case when tok = 'BTC' then null else rec end), 2); exception when others then usd := null; end;
    if dup is not null then
      st := 'duplicate'; v_reason := 'The same transaction is already claimed by gift ' || dup || '.';
    elsif rec is null or rec <= 0 or usd is null or usd <= 0 then
      st := 'review'; v_reason := case when rec > 0 then 'Received ' || rec || ' ' || tok || ', but its dollar value could not be read.' else 'The amount received could not be read.' end;
    else
      update public.donations
         set amount = usd,
             data = data || jsonb_build_object(
               'verified', true,
               'verifiedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
               'verifiedBy', 'chain',
               'claimedAmount', d.amount,
               'chain', jsonb_strip_nulls(jsonb_build_object(
                 'network', p_result->>'network', 'chainId', p_result->'chainId', 'token', p_result->>'token',
                 'received', rec, 'valueUsd', usd, 'priceUsd', p_result->'priceUsd', 'from', p_result->>'from', 'block', p_result->'block',
                 'confirmations', p_result->'confirmations', 'blockTime', p_result->>'blockTime',
                 'explorer', p_result->>'explorer')))
       where id = p_id;
      update be_private.chain_checks set status = 'verified', reason = nullif(v_reason, ''), result = p_result, checked_at = now() where donation_id = p_id;
      return jsonb_build_object('ok', true, 'status', 'verified');
    end if;
  end if;

  if st = 'waiting' then
    nxt := now() + interval '2 minutes';
    if age > interval '7 days' then st := 'review'; v_reason := 'Still not confirmed after a week. ' || v_reason; end if;
  elsif st in ('not_found', 'error') then
    -- keep looking for two days (a hash can be reported before its block), backing off
    if age > interval '48 hours' then
      st := case when st = 'error' then 'error' else 'not_found' end;
      nxt := null;
    else
      st := 'retry';
      nxt := now() + least(interval '30 minutes', interval '1 minute' * power(2, least(c.attempts, 5)));
      if coalesce(p_result->>'status', '') = 'not_found' then v_reason := coalesce(nullif(v_reason, ''), 'Not found yet.'); end if;
    end if;
  elsif st not in ('review', 'duplicate', 'manual') then
    st := 'review';
  end if;

  update be_private.chain_checks
     set status = st, reason = nullif(v_reason, ''), result = coalesce(p_result, '{}'::jsonb), checked_at = now(),
         next_try_at = coalesce(nxt, next_try_at)
   where donation_id = p_id;
  return jsonb_build_object('ok', true, 'status', st);
end $$;

create or replace function public.be_chain_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return jsonb_build_object('config', be_private.chain_cfg(), 'checks', coalesce((
    select jsonb_object_agg(c.donation_id, jsonb_strip_nulls(jsonb_build_object(
             'status', c.status, 'reason', c.reason, 'attempts', c.attempts,
             'checkedAt', c.checked_at, 'nextTryAt', case when c.status in ('queued','waiting','retry') then c.next_try_at end,
             'network', c.result->>'network', 'token', c.result->>'token', 'received', c.result->'received', 'valueUsd', c.result->'valueUsd',
             'confirmations', c.result->'confirmations', 'required', c.result->'required', 'explorer', c.result->>'explorer', 'from', c.result->>'from')))
      from be_private.chain_checks c where c.created_at > now() - interval '180 days'), '{}'::jsonb));
end $$;

create or replace function public.be_chain_recheck(p_id text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare d public.donations; h text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select * into d from public.donations where id = p_id;
  if d.id is null or not be_private.is_gift(d.id, d.name, d.data) then raise exception 'not_found' using errcode = 'P0001'; end if;
  if coalesce(d.data->>'verified', 'false') = 'true' then raise exception 'already_verified' using errcode = 'P0001'; end if;
  h := be_private.chain_hash(d.data);
  if h is null then raise exception 'not_a_chain_hash' using errcode = 'P0001'; end if;
  insert into be_private.chain_checks (donation_id, tx_hash) values (p_id, h)
  on conflict (donation_id) do update
     set tx_hash = excluded.tx_hash, status = 'queued', reason = null, attempts = 0, next_try_at = now(), claimed_at = null,
         result = '{}'::jsonb, created_at = now();
  perform be_private.chain_kick();
  return jsonb_build_object('ok', true);
end $$;

revoke all on function be_private.chain_auto(), be_private.chain_hash(jsonb) from public, anon, authenticated;

create or replace function public.be_submit_donation(p_donation jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  did text := coalesce(p_donation->>'id', '');
  amt numeric;
  dn public.donations;
  p jsonb := case when jsonb_typeof(p_donation->'payment') = 'object' then p_donation->'payment' else null end;
  pay jsonb := null;
begin
  if (select count(*) from public.donations
       where created_at > now() - interval '1 hour' and coalesce(data->>'verified', 'false') <> 'true') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  begin amt := round(coalesce((p_donation->>'amount')::numeric, 0), 2);
  exception when others then amt := 0; end;
  if amt <= 0 or amt > 100000000 then raise exception 'invalid_amount' using errcode = 'P0001'; end if;
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
  perform pg_advisory_xact_lock(hashtext('be_next_id_donations'));
  if did !~ '^D-[0-9]{1,9}$' or exists (select 1 from public.donations where id = did) then
    did := be_private.next_id('D-', 8001, 'donations');
  end if;
  insert into public.donations(id, name, amount, data)
  values (did, coalesce(nullif(left(trim(coalesce(p_donation->>'name', '')), 120), ''), 'Anonymous patron'), amt,
    jsonb_build_object(
      'anonymous', coalesce((p_donation->>'anonymous')::boolean, false),
      'message', left(coalesce(p_donation->>'message', ''), 2000),
      'txHash',  left(trim(coalesce(p_donation->>'txHash', '')), 200),
      'email',   left(coalesce(p_donation->>'email', ''), 254),
      'country', left(coalesce(p_donation->>'country', ''), 100),
      'submittedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'verified', false)
    || case when pay is not null then jsonb_build_object('payment', pay) else '{}'::jsonb end)
  returning * into dn;
  return be_private.public_donation(dn);
end $$;
