-- Each announcement can greet the person by name: the founder's screen sends a first name per address
create or replace function public.be_mail_send_announcement(p_msg jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  aud text := coalesce(p_msg->>'audience', '');
  tos jsonb := case when jsonb_typeof(p_msg->'to') = 'array' then p_msg->'to' else '[]'::jsonb end;
  names jsonb := case when jsonb_typeof(p_msg->'names') = 'object' then p_msg->'names' else '{}'::jsonb end;
  subj text := trim(coalesce(p_msg->>'subject', ''));
  body text := trim(coalesce(p_msg->>'body', ''));
  sender text := coalesce(nullif(p_msg->>'from', ''), 'hello');
  t text; n int := 0; skipped int := 0; stamp text := extract(epoch from clock_timestamp())::text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if aud not in ('donor', 'awardee') then raise exception 'invalid_audience' using errcode = 'P0001'; end if;
  if jsonb_array_length(tos) < 1 or jsonb_array_length(tos) > 500 then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  if length(subj) < 1 or length(subj) > 200 or length(body) < 1 or length(body) > 10000 then raise exception 'invalid_message' using errcode = 'P0001'; end if;
  if sender not in ('brial', 'hello', 'receipts') then sender := 'hello'; end if;
  for t in select trim(x) from jsonb_array_elements_text(tos) x loop
    if length(t) > 254 or t !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  end loop;
  if (select count(*) from be_private.mail_outbox where kind = 'announcement' and created_at > now() - interval '24 hours') + jsonb_array_length(tos) > 1000 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  for t in select distinct lower(trim(x)) from jsonb_array_elements_text(tos) x loop
    if exists (select 1 from be_private.mail_unsubscribes u where u.audience = aud and u.email = t and u.active) then skipped := skipped + 1; continue; end if;
    n := n + 1;
    perform be_private.mail_enqueue('announcement', aud, 'ann:' || stamp || ':' || n,
      jsonb_strip_nulls(jsonb_build_object('to', t, 'from', sender, 'subject', subj, 'body', body, 'audience', aud,
        'name', nullif(left(trim(coalesce(names->>t, '')), 60), ''),
        'sign', coalesce((p_msg->>'sign')::boolean, false))));
  end loop;
  return jsonb_build_object('queued', n, 'skipped', skipped);
end $$;
revoke all on function public.be_mail_send_announcement(jsonb) from public, anon;
grant execute on function public.be_mail_send_announcement(jsonb) to authenticated;
