-- Announcements to donors and awardees, from the Founder Console's Email page.
--
-- * mail_contacts: addresses the founder adds by hand (a donor who gave offline, a guardian),
--   on top of the people the records already know (donors from their gifts, awardees from
--   their scholar record).
-- * mail_unsubscribes: people who used the unsubscribe link. They are never emailed an
--   announcement again unless they subscribe again themselves.
-- * be_mail_send_announcement: queues one email per person (no one sees the other addresses).
--   The email worker sends them within the daily sending limit; the rest wait and go out later.

create table if not exists be_private.mail_contacts (
  id bigserial primary key,
  audience text not null check (audience in ('donor', 'awardee')),
  email text not null check (length(email) between 3 and 254),
  name text check (name is null or length(name) <= 120),
  added_at timestamptz not null default now()
);
create unique index if not exists mail_contacts_audience_email on be_private.mail_contacts (audience, lower(email));
alter table be_private.mail_contacts enable row level security;

create table if not exists be_private.mail_unsubscribes (
  audience text not null check (audience in ('donor', 'awardee')),
  email text not null,
  at timestamptz not null default now(),
  source text,
  primary key (audience, email)
);
alter table be_private.mail_unsubscribes enable row level security;

-- Everything the founder's announcement screen needs that is not already in the records
create or replace function public.be_mail_contacts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'contacts', (select coalesce(jsonb_agg(jsonb_build_object('audience', audience, 'email', email, 'name', name, 'addedAt', added_at) order by added_at desc), '[]'::jsonb) from be_private.mail_contacts),
    'unsubscribed', (select coalesce(jsonb_agg(jsonb_build_object('audience', audience, 'email', email, 'at', at)), '[]'::jsonb) from be_private.mail_unsubscribes));
end $$;

create or replace function public.be_mail_contact_add(p_audience text, p_email text, p_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := trim(coalesce(p_email, '')); n text := nullif(left(trim(coalesce(p_name, '')), 120), '');
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if p_audience not in ('donor', 'awardee') then raise exception 'invalid_audience' using errcode = 'P0001'; end if;
  if length(e) > 254 or e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = 'P0001'; end if;
  insert into be_private.mail_contacts (audience, email, name) values (p_audience, e, n)
  on conflict (audience, lower(email)) do update set name = coalesce(excluded.name, be_private.mail_contacts.name);
  return jsonb_build_object('audience', p_audience, 'email', e, 'name', n);
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
  -- a safety net against a double click or a runaway loop: at most 1,000 announcement emails a day
  if (select count(*) from be_private.mail_outbox where kind = 'announcement' and created_at > now() - interval '24 hours') + jsonb_array_length(tos) > 1000 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  for t in select distinct lower(trim(x)) from jsonb_array_elements_text(tos) x loop
    if exists (select 1 from be_private.mail_unsubscribes u where u.audience = aud and u.email = t) then skipped := skipped + 1; continue; end if;
    n := n + 1;
    perform be_private.mail_enqueue('announcement', aud, 'ann:' || stamp || ':' || n,
      jsonb_build_object('to', t, 'from', sender, 'subject', subj, 'body', body, 'audience', aud,
        'sign', coalesce((p_msg->>'sign')::boolean, false)));
  end loop;
  return jsonb_build_object('queued', n, 'skipped', skipped);
end $$;

revoke all on function public.be_mail_contacts() from public, anon;
revoke all on function public.be_mail_contact_add(text, text, text) from public, anon;
revoke all on function public.be_mail_send_announcement(jsonb) from public, anon;
grant execute on function public.be_mail_contacts() to authenticated;
grant execute on function public.be_mail_contact_add(text, text, text) to authenticated;
grant execute on function public.be_mail_send_announcement(jsonb) to authenticated;

