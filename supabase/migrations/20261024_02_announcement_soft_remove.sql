-- Removing a contact or subscribing again keeps the row and marks it, so the history stays.
alter table be_private.mail_contacts add column if not exists removed_at timestamptz;
alter table be_private.mail_unsubscribes add column if not exists active boolean not null default true;

create or replace function public.be_mail_contacts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'contacts', (select coalesce(jsonb_agg(jsonb_build_object('audience', audience, 'email', email, 'name', name, 'addedAt', added_at) order by added_at desc), '[]'::jsonb) from be_private.mail_contacts where removed_at is null),
    'unsubscribed', (select coalesce(jsonb_agg(jsonb_build_object('audience', audience, 'email', email, 'at', at)), '[]'::jsonb) from be_private.mail_unsubscribes where active));
end $$;

create or replace function public.be_mail_contact_add(p_audience text, p_email text, p_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := trim(coalesce(p_email, '')); n text := nullif(left(trim(coalesce(p_name, '')), 120), '');
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_audience not in ('donor', 'awardee') then raise exception 'invalid_audience' using errcode = 'P0001'; end if;
  if length(e) > 254 or e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  insert into be_private.mail_contacts (audience, email, name) values (p_audience, e, n)
  on conflict (audience, lower(email)) do update set name = coalesce(excluded.name, be_private.mail_contacts.name), removed_at = null, added_at = case when be_private.mail_contacts.removed_at is not null then now() else be_private.mail_contacts.added_at end;
  return jsonb_build_object('audience', p_audience, 'email', e, 'name', n);
end $$;

create or replace function public.be_mail_contact_remove(p_audience text, p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update be_private.mail_contacts set removed_at = now()
   where audience = p_audience and lower(email) = lower(trim(coalesce(p_email, ''))) and removed_at is null;
end $$;

-- Used only by the email worker (service role) when someone unsubscribes or subscribes again
create or replace function public.be_mail_unsub_set(p_audience text, p_email text, p_on boolean, p_source text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if p_audience not in ('donor', 'awardee') or e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  insert into be_private.mail_unsubscribes (audience, email, source, active, at) values (p_audience, e, left(p_source, 40), p_on, now())
  on conflict (audience, email) do update set active = excluded.active, at = now(), source = excluded.source;
end $$;

create or replace function public.be_mail_send_announcement(p_msg jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  aud text := coalesce(p_msg->>'audience', '');
  tos jsonb := case when jsonb_typeof(p_msg->'to') = 'array' then p_msg->'to' else '[]'::jsonb end;
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
      jsonb_build_object('to', t, 'from', sender, 'subject', subj, 'body', body, 'audience', aud,
        'sign', coalesce((p_msg->>'sign')::boolean, false)));
  end loop;
  return jsonb_build_object('queued', n, 'skipped', skipped);
end $$;

revoke all on function public.be_mail_contact_remove(text, text) from public, anon;
grant execute on function public.be_mail_contact_remove(text, text) to authenticated;
revoke all on function public.be_mail_unsub_set(text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.be_mail_unsub_set(text, text, boolean, text) to service_role;
