-- How a gift was paid (21 Oct 2026)
-- * The donate form now records the method: USDT (checked on chain), a bank
--   transfer in Rupiah, or a card payment through Lynk. be_submit_donation keeps
--   a sanitised "payment" object: method, currency, amount paid in that
--   currency, the rate used for the USD estimate, and for bank or card the
--   transfer time, the sender's account name and the Lynk order reference.
-- * The sender's name and the order reference never leave the database for
--   visitors (public_donation strips them).
-- * A gift the founder records by hand (founderEntry) does not send the
--   "new gift reported" alert to the founder; verifying it issues the receipt
--   as usual.

create or replace function be_private.try_num(p text) returns numeric
language plpgsql immutable set search_path = '' as $$
begin
  return nullif(trim(coalesce(p, '')), '')::numeric;
exception when others then
  return null;
end $$;

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
      'method',   case when p->>'method' in ('usdt', 'bank', 'card') then p->>'method' end,
      'currency', case when p->>'currency' in ('USD', 'USDT', 'IDR', 'TRY') then p->>'currency' end,
      'paid',     round(least(greatest(be_private.try_num(p->>'paid'), 0), 1e13), 2),
      'rate',     round(least(greatest(be_private.try_num(p->>'rate'), 0), 1e7), 4),
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
      'txHash',  left(coalesce(p_donation->>'txHash', ''), 200),
      'email',   left(coalesce(p_donation->>'email', ''), 254),
      'country', left(coalesce(p_donation->>'country', ''), 100),
      'submittedAt', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'verified', false)
    || case when pay is not null then jsonb_build_object('payment', pay) else '{}'::jsonb end)
  returning * into dn;
  return be_private.public_donation(dn);
end $$;

create or replace function be_private.public_donation(d donations)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', d.id, 'name', d.name, 'amount', d.amount, 'created_at', d.created_at,
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
                   else (coalesce(d.data, '{}'::jsonb) - 'email') #- '{payment,sender}' #- '{payment,ref}' end);
$$;

create or replace function be_private.mail_on_donation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare was_v boolean := false; is_v boolean; n text; sub timestamptz;
begin
  if not be_private.is_gift(new.id, new.name, new.data) then return null; end if;
  is_v := coalesce(new.data->>'verified', 'false') = 'true';
  if tg_op = 'UPDATE' then was_v := coalesce(old.data->>'verified', 'false') = 'true'; end if;

  if tg_op = 'INSERT' and not is_v and coalesce(new.data->>'founderEntry', 'false') <> 'true' then
    begin sub := (new.data->>'submittedAt')::timestamptz; exception when others then sub := null; end;
    -- a restored backup re-inserts old gifts: only fresh reports alert the founder
    if coalesce(sub, now()) > now() - interval '2 days' then
      perform be_private.mail_enqueue('donation_reported', new.id, 'donrep:' || new.id);
    end if;
  end if;

  if tg_op = 'UPDATE' and is_v and not was_v then
    n := be_private.issue_receipt(new.id);
    if n is not null and coalesce(new.data->>'email', '') ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      perform be_private.mail_enqueue('receipt', new.id, 'receipt:' || new.id, jsonb_build_object('no', n));
    end if;
  end if;
  return null;
end $$;

revoke all on function be_private.try_num(text) from public, anon, authenticated;
