-- QRIS (22 Oct 2026)
-- The donate page now shows the endowment's static QRIS (DANA Bisnis, NMID
-- ID1026621752462, MCC 8398). A gift paid by QRIS is reported with method
-- "qris" and checked by the founder against the DANA Bisnis transactions.

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
      'method',   case when p->>'method' in ('usdt', 'bank', 'card', 'qris') then p->>'method' end,
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
