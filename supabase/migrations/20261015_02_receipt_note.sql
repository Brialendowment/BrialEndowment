-- Receipts can carry a personal note from the founder (shown above the
-- receipt details). A copy is flagged only when the same address already got it.
create or replace function public.be_mail_send_receipt(p_donation_id text, p_to text, p_note text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare n text; d public.donations; t text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  select * into d from public.donations where id = p_donation_id;
  if d.id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  n := be_private.issue_receipt(p_donation_id);
  if n is null then raise exception 'not_verified' using errcode = 'P0001'; end if;
  t := trim(coalesce(nullif(p_to, ''), d.data->>'email', ''));
  if t !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  perform be_private.mail_enqueue('receipt', p_donation_id, 'receipt:' || p_donation_id || ':' || extract(epoch from clock_timestamp())::text,
    jsonb_strip_nulls(jsonb_build_object('no', n, 'to', t,
      'copy', exists (select 1 from be_private.mail_outbox o where o.kind = 'receipt' and o.ref = p_donation_id and o.status = 'sent' and o.to_email = t),
      'note', nullif(left(trim(coalesce(p_note, '')), 2000), ''))));
  return jsonb_build_object('no', n, 'to', t);
end $$;
revoke all on function public.be_mail_send_receipt(text, text, text) from public, anon;
grant execute on function public.be_mail_send_receipt(text, text, text) to authenticated;
