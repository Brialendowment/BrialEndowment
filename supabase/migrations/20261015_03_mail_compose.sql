-- Founder Console → Site settings → Email → "Write an email".
-- The founder writes a message (optionally acknowledging a contribution, with
-- a PDF) and sends it from one of the brialendowment.org senders. One queued
-- email per recipient, so recipients never see each other.
create or replace function public.be_mail_send_message(p_msg jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  tos jsonb := case when jsonb_typeof(p_msg->'to') = 'array' then p_msg->'to' else '[]'::jsonb end;
  subj text := trim(coalesce(p_msg->>'subject', ''));
  body text := trim(coalesce(p_msg->>'body', ''));
  sender text := coalesce(nullif(p_msg->>'from', ''), 'brial');
  ack jsonb := case when jsonb_typeof(p_msg->'ack') = 'object' then p_msg->'ack' else null end;
  amt numeric; t text; n int := 0; stamp text := extract(epoch from clock_timestamp())::text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if jsonb_array_length(tos) < 1 or jsonb_array_length(tos) > 20 then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  if length(subj) < 1 or length(subj) > 200 or length(body) < 1 or length(body) > 10000 then raise exception 'invalid_message' using errcode = 'P0001'; end if;
  if sender not in ('brial', 'hello', 'receipts') then sender := 'brial'; end if;
  if (select count(*) from be_private.mail_outbox where kind = 'message' and created_at > now() - interval '1 hour') + jsonb_array_length(tos) > 40 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if ack is not null then
    begin amt := round((ack->>'amount')::numeric, 2); exception when others then amt := null; end;
    if amt is null or amt <= 0 or amt > 100000000 then ack := null;
    else ack := jsonb_strip_nulls(jsonb_build_object(
      'name', left(trim(coalesce(ack->>'name', '')), 120), 'amount', amt,
      'programme', left(trim(coalesce(ack->>'programme', '')), 200), 'date', left(coalesce(ack->>'date', ''), 30),
      'reference', left(trim(coalesce(ack->>'reference', '')), 120), 'pdf', coalesce((ack->>'pdf')::boolean, true)));
    end if;
  end if;
  for t in select trim(x) from jsonb_array_elements_text(tos) x loop
    if t !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  end loop;
  for t in select distinct lower(trim(x)) from jsonb_array_elements_text(tos) x loop
    n := n + 1;
    perform be_private.mail_enqueue('message', null, 'msg:' || stamp || ':' || n,
      jsonb_strip_nulls(jsonb_build_object('to', t, 'from', sender, 'subject', subj, 'body', body,
        'sign', coalesce((p_msg->>'sign')::boolean, true), 'ack', ack)));
  end loop;
  return jsonb_build_object('queued', n);
end $$;
revoke all on function public.be_mail_send_message(jsonb) from public, anon;
grant execute on function public.be_mail_send_message(jsonb) to authenticated;
