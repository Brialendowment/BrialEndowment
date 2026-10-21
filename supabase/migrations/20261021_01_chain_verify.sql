-- Automatic verification of USDT gifts (21 Oct 2026)
-- * A gift reported with an EVM transaction hash (0x + 64 hex) is queued in
--   be_private.chain_checks. The be-chain worker reads the transaction from
--   public RPC nodes and reports back through be_chain_done().
-- * When the transfer checks out, be_chain_done() marks the gift verified, sets
--   its amount to what actually arrived (the reported amount is kept as
--   claimedAmount) and records the on-chain evidence. The existing trigger
--   be_private.mail_on_donation() then issues the receipt number and emails it.
-- * Anything that does not check out stays unverified with a reason for the
--   founder. The founder can switch the whole thing off in Payment channels
--   (PAYMENT-CONFIG usdt.autoVerify = false) and can ask for a fresh check.
-- * Polling: a cron job every 2 minutes pokes the worker only while a check is due.

create table if not exists be_private.chain_checks (
  donation_id text primary key,
  tx_hash     text not null,
  status      text not null default 'queued'
              check (status in ('queued','checking','waiting','retry','verified','review','duplicate','not_found','manual','error','skipped')),
  reason      text,
  result      jsonb not null default '{}'::jsonb,
  attempts    int not null default 0,
  next_try_at timestamptz not null default now(),
  claimed_at  timestamptz,
  checked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists chain_checks_due on be_private.chain_checks (status, next_try_at);
alter table be_private.chain_checks enable row level security;
revoke all on be_private.chain_checks from public, anon, authenticated;

create or replace function be_private.chain_cfg() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'address', coalesce(u->>'address', ''),
    'network', coalesce(u->>'network', 'ERC-20'),
    'confirmations', coalesce(nullif(u->>'confirmations', '')::int, 12),
    'autoVerify', coalesce((u->>'autoVerify')::boolean, true),
    'enabled', coalesce((u->>'enabled')::boolean, true))
  from (select coalesce((select data->'data'->'payments'->'usdt' from public.donations where id = 'PAYMENT-CONFIG'), '{}'::jsonb) u) x;
$$;

-- Poke the worker once per transaction (after commit). Never blocks a write.
create or replace function be_private.chain_kick() returns void
language plpgsql security definer set search_path = '' as $$
declare s text;
begin
  if current_setting('be.chain_kicked', true) = 'on' then return; end if;
  perform set_config('be.chain_kicked', 'on', true);
  select hook_secret into s from be_private.mail_settings where id = 1;
  perform net.http_post(
    url := 'https://sdlrjqdbxxzddgivnjws.supabase.co/functions/v1/be-chain',
    body := '{"action":"sweep"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-be-hook', s),
    timeout_milliseconds := 60000);
exception when others then
  null;
end $$;

-- Queue (or re-queue, when the hash changes) every unverified gift that carries an EVM hash.
create or replace function be_private.chain_on_donation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h text := lower(trim(coalesce(new.data->>'txHash', '')));
begin
  if not be_private.is_gift(new.id, new.name, new.data) then return null; end if;
  if coalesce(new.data->>'verified', 'false') = 'true' then return null; end if;
  if h !~ '^0x[0-9a-f]{64}$' then return null; end if;
  if tg_op = 'UPDATE' and lower(trim(coalesce(old.data->>'txHash', ''))) = h
     and exists (select 1 from be_private.chain_checks where donation_id = new.id) then return null; end if;
  insert into be_private.chain_checks (donation_id, tx_hash) values (new.id, h)
  on conflict (donation_id) do update
     set tx_hash = excluded.tx_hash, status = 'queued', reason = null, result = '{}'::jsonb,
         attempts = 0, next_try_at = now(), claimed_at = null
   where be_private.chain_checks.tx_hash <> excluded.tx_hash;
  if (be_private.chain_cfg()->>'autoVerify')::boolean then perform be_private.chain_kick(); end if;
  return null;
end $$;

drop trigger if exists be_chain_donation on public.donations;
create trigger be_chain_donation after insert or update on public.donations
  for each row execute function be_private.chain_on_donation();

create or replace function be_private.chain_sweep() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update be_private.chain_checks set status = 'retry' where status = 'checking' and claimed_at < now() - interval '5 minutes';
  if (be_private.chain_cfg()->>'autoVerify')::boolean
     and exists (select 1 from be_private.chain_checks where status in ('queued','waiting','retry') and next_try_at <= now()) then
    perform be_private.chain_kick();
  end if;
end $$;

do $$ begin
  perform cron.unschedule('be-chain-sweep');
exception when others then null; end $$;
select cron.schedule('be-chain-sweep', '*/2 * * * *', $$select be_private.chain_sweep()$$);

-- ---------- worker (service role) ----------
-- Claims due checks. p_limit = 0 returns only the configuration.
create or replace function public.be_chain_claim(p_limit int) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare cfg jsonb := be_private.chain_cfg(); items jsonb;
begin
  -- gifts verified by hand in the meantime need no check
  update be_private.chain_checks c set status = 'skipped', reason = 'Verified by hand.', checked_at = now()
   where c.status in ('queued','waiting','retry','checking','review','not_found','error')
     and exists (select 1 from public.donations d where d.id = c.donation_id and coalesce(d.data->>'verified', 'false') = 'true');
  delete from be_private.chain_checks c where not exists (select 1 from public.donations d where d.id = c.donation_id);
  if coalesce(p_limit, 0) <= 0 or not (cfg->>'autoVerify')::boolean then
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
           'duplicateOf', (select o.id from public.donations o
                            where o.id <> d.id and lower(trim(coalesce(o.data->>'txHash', ''))) = up.tx_hash
                              and be_private.is_gift(o.id, o.name, o.data)
                              and (coalesce(o.data->>'verified', 'false') = 'true' or o.created_at < d.created_at)
                            order by o.created_at limit 1))), '[]'::jsonb)
    into items
    from up join public.donations d on d.id = up.donation_id;
  return jsonb_build_object('config', cfg, 'items', items);
end $$;

-- Applies one result. Verifies the gift only if it is still unverified, still
-- carries the same hash, and no other verified gift claims that transaction.
create or replace function public.be_chain_done(p_id text, p_tx text, p_result jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  d public.donations; c be_private.chain_checks;
  st text := coalesce(p_result->>'status', 'error');
  v_reason text := left(coalesce(p_result->>'reason', ''), 500);
  rec numeric; nxt timestamptz; age interval; dup text;
begin
  select * into c from be_private.chain_checks where donation_id = p_id for update;
  if c.donation_id is null then return jsonb_build_object('ok', false, 'why', 'no_check'); end if;
  select * into d from public.donations where id = p_id for update;
  if d.id is null then delete from be_private.chain_checks where donation_id = p_id; return jsonb_build_object('ok', false, 'why', 'gone'); end if;
  if coalesce(d.data->>'verified', 'false') = 'true' then
    update be_private.chain_checks set status = 'skipped', reason = 'Verified by hand.', checked_at = now() where donation_id = p_id;
    return jsonb_build_object('ok', true, 'status', 'skipped');
  end if;
  if lower(trim(coalesce(d.data->>'txHash', ''))) <> lower(coalesce(p_tx, '')) or c.tx_hash <> lower(coalesce(p_tx, '')) then
    update be_private.chain_checks set status = 'queued', next_try_at = now() where donation_id = p_id;
    return jsonb_build_object('ok', false, 'why', 'hash_changed');
  end if;
  age := now() - c.created_at;

  if st = 'verified' then
    select o.id into dup from public.donations o
     where o.id <> d.id and lower(trim(coalesce(o.data->>'txHash', ''))) = c.tx_hash
       and coalesce(o.data->>'verified', 'false') = 'true' limit 1;
    begin rec := round((p_result->>'received')::numeric, 2); exception when others then rec := null; end;
    if dup is not null then
      st := 'duplicate'; v_reason := 'The same transaction is already claimed by gift ' || dup || '.';
    elsif rec is null or rec <= 0 then
      st := 'review'; v_reason := 'The amount received could not be read.';
    else
      update public.donations
         set amount = rec,
             data = data || jsonb_build_object(
               'verified', true,
               'verifiedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
               'verifiedBy', 'chain',
               'claimedAmount', d.amount,
               'chain', jsonb_strip_nulls(jsonb_build_object(
                 'network', p_result->>'network', 'chainId', p_result->'chainId', 'token', p_result->>'token',
                 'received', rec, 'from', p_result->>'from', 'block', p_result->'block',
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

-- ---------- founder ----------
create or replace function public.be_chain_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return jsonb_build_object('config', be_private.chain_cfg(), 'checks', coalesce((
    select jsonb_object_agg(c.donation_id, jsonb_strip_nulls(jsonb_build_object(
             'status', c.status, 'reason', c.reason, 'attempts', c.attempts,
             'checkedAt', c.checked_at, 'nextTryAt', case when c.status in ('queued','waiting','retry') then c.next_try_at end,
             'network', c.result->>'network', 'received', c.result->'received', 'confirmations', c.result->'confirmations',
             'required', c.result->'required', 'explorer', c.result->>'explorer', 'from', c.result->>'from')))
      from be_private.chain_checks c where c.created_at > now() - interval '180 days'), '{}'::jsonb));
end $$;

-- Ask for a fresh check of one gift now (also queues a gift reported before automatic checks existed).
create or replace function public.be_chain_recheck(p_id text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare d public.donations; h text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select * into d from public.donations where id = p_id;
  if d.id is null or not be_private.is_gift(d.id, d.name, d.data) then raise exception 'not_found' using errcode = 'P0001'; end if;
  if coalesce(d.data->>'verified', 'false') = 'true' then raise exception 'already_verified' using errcode = 'P0001'; end if;
  h := lower(trim(coalesce(d.data->>'txHash', '')));
  if h !~ '^0x[0-9a-f]{64}$' then raise exception 'not_a_chain_hash' using errcode = 'P0001'; end if;
  insert into be_private.chain_checks (donation_id, tx_hash) values (p_id, h)
  on conflict (donation_id) do update
     set tx_hash = excluded.tx_hash, status = 'queued', reason = null, attempts = 0, next_try_at = now(), claimed_at = null,
         result = '{}'::jsonb, created_at = now();
  perform be_private.chain_kick();
  return jsonb_build_object('ok', true);
end $$;

-- ---------- grants ----------
revoke all on function
  be_private.chain_cfg(), be_private.chain_kick(), be_private.chain_on_donation(), be_private.chain_sweep(),
  public.be_chain_claim(int), public.be_chain_done(text, text, jsonb), public.be_chain_status(), public.be_chain_recheck(text)
from public, anon, authenticated;
grant execute on function public.be_chain_claim(int), public.be_chain_done(text, text, jsonb) to service_role;
grant execute on function public.be_chain_status(), public.be_chain_recheck(text) to authenticated;
