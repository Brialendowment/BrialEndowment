-- Email: receipts and notices.
--
-- How it works
--   1. Triggers on donations / applicants / reports notice an event (a gift is
--      verified, an application is submitted, a bill is paid …) and put ONE row
--      in be_private.mail_outbox. A unique "dedupe" key makes every event send
--      at most once, even if the same change is saved twice or a backup is
--      restored.
--   2. The trigger pokes the be-mail edge function (pg_net, after commit). The
--      function claims the queued rows, builds each email from the database
--      (never from browser input), sends it through Resend and records the
--      result. A cron sweep every 10 minutes retries anything left behind.
--   3. Receipt numbers (BE-YYYY-NNNN) are issued by the database when a gift is
--      verified, in order, with no gaps from races.
--
-- Nothing here is reachable by visitors: be_private is not exposed, the
-- founder RPCs check be_is_founder(), the worker RPCs are service_role only.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- tables ----------
create table if not exists be_private.mail_outbox (
  id          bigint generated always as identity primary key,
  kind        text not null,
  ref         text,
  payload     jsonb not null default '{}'::jsonb,
  dedupe      text not null unique,
  status      text not null default 'pending' check (status in ('pending','sending','sent','skipped','failed')),
  attempts    int not null default 0,
  next_try_at timestamptz,
  claimed_at  timestamptz,
  to_email    text,
  subject     text,
  resend_id   text,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index if not exists mail_outbox_queue on be_private.mail_outbox (status, id);
create index if not exists mail_outbox_ref on be_private.mail_outbox (ref, kind);

create table if not exists be_private.receipts (
  no          text primary key,
  donation_id text not null unique,
  year        int not null,
  seq         int not null,
  amount      numeric not null,
  donor_name  text,
  issued_at   timestamptz not null default now(),
  unique (year, seq)
);

create table if not exists be_private.mail_settings (
  id          int primary key default 1 check (id = 1),
  settings    jsonb not null default '{}'::jsonb,
  hook_secret text not null default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  updated_at  timestamptz not null default now()
);
insert into be_private.mail_settings (id, settings)
values (1, jsonb_build_object('founderTo', 'hello@brialendowment.org', 'paused', false, 'kinds', '{}'::jsonb))
on conflict (id) do nothing;

alter table be_private.mail_outbox  enable row level security;
alter table be_private.receipts     enable row level security;
alter table be_private.mail_settings enable row level security;
revoke all on be_private.mail_outbox, be_private.receipts, be_private.mail_settings from public, anon, authenticated;

-- ---------- helpers ----------
create or replace function be_private.is_gift(p_id text, p_name text, p_data jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select not be_private.is_internal_donation(p_id, p_name)
     and p_id not like 'SALE-%'
     and not (coalesce(p_data, '{}'::jsonb) ? 'sale');
$$;

-- Poke the worker once per transaction. Never lets a failure block the write.
create or replace function be_private.mail_kick() returns void
language plpgsql security definer set search_path = '' as $$
declare s text;
begin
  if current_setting('be.mail_kicked', true) = 'on' then return; end if;
  perform set_config('be.mail_kicked', 'on', true);
  select hook_secret into s from be_private.mail_settings where id = 1;
  perform net.http_post(
    url := 'https://sdlrjqdbxxzddgivnjws.supabase.co/functions/v1/be-mail',
    body := '{"action":"drain"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-be-hook', s),
    timeout_milliseconds := 15000);
exception when others then
  null;
end $$;

create or replace function be_private.mail_enqueue(p_kind text, p_ref text, p_dedupe text, p_payload jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into be_private.mail_outbox (kind, ref, dedupe, payload)
  values (p_kind, p_ref, left(p_dedupe, 400), coalesce(p_payload, '{}'::jsonb))
  on conflict (dedupe) do nothing;
  get diagnostics n = row_count;
  if n > 0 then perform be_private.mail_kick(); end if;
  return n > 0;
end $$;

-- Issue (or return) the receipt number of a verified gift.
create or replace function be_private.issue_receipt(p_donation_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare d public.donations; y int; s int; n text; vat timestamptz;
begin
  select no into n from be_private.receipts where donation_id = p_donation_id;
  if n is not null then return n; end if;
  select * into d from public.donations where id = p_donation_id;
  if d.id is null or coalesce(d.data->>'verified', 'false') <> 'true' or not be_private.is_gift(d.id, d.name, d.data) then
    return null;
  end if;
  begin vat := (d.data->>'verifiedAt')::timestamptz; exception when others then vat := null; end;
  y := extract(year from (coalesce(vat, now()) at time zone 'utc'))::int;
  perform pg_advisory_xact_lock(hashtext('be_receipt_seq'));
  select no into n from be_private.receipts where donation_id = p_donation_id;
  if n is not null then return n; end if;
  select coalesce(max(seq), 0) + 1 into s from be_private.receipts where year = y;
  n := 'BE-' || y || '-' || lpad(s::text, 4, '0');
  insert into be_private.receipts (no, donation_id, year, seq, amount, donor_name, issued_at)
  values (n, d.id, y, s, d.amount, d.name, coalesce(vat, now()));
  return n;
end $$;

-- ---------- triggers ----------
create or replace function be_private.mail_on_donation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare was_v boolean := false; is_v boolean; n text; sub timestamptz;
begin
  if not be_private.is_gift(new.id, new.name, new.data) then return null; end if;
  is_v := coalesce(new.data->>'verified', 'false') = 'true';
  if tg_op = 'UPDATE' then was_v := coalesce(old.data->>'verified', 'false') = 'true'; end if;

  if tg_op = 'INSERT' and not is_v then
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

create or replace function be_private.mail_on_applicant() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  sem jsonb; osem jsonb; r jsonb; orq jsonb;
  ss_old text := coalesce(old.data->>'scholarStatus', '');
  ss_new text := coalesce(new.data->>'scholarStatus', '');
  last_at text;
begin
  if coalesce(new.data->>'deleted', 'false') = 'true' then return null; end if;

  if new.status is distinct from old.status then
    if new.status = 'submitted' then
      perform be_private.mail_enqueue('application_submitted', new.id, 'appsub:' || new.id || ':' || coalesce(new.data->>'submittedAt', ''));
      perform be_private.mail_enqueue('application_received', new.id, 'apprcv:' || new.id || ':' || coalesce(new.data->>'submittedAt', ''));
    elsif new.status = 'accepted' then
      perform be_private.mail_enqueue('accepted', new.id, 'acc:' || new.id);
    elsif new.status = 'rejected' then
      perform be_private.mail_enqueue('rejected', new.id, 'rej:' || new.id || ':' || coalesce(new.data->>'rejectedAt', ''));
    end if;
  end if;

  if new.status = 'interview-scheduled' and (
       old.status is distinct from 'interview-scheduled'
       or (new.data->>'interviewAt') is distinct from (old.data->>'interviewAt')
       or (new.data->>'meetingLink') is distinct from (old.data->>'meetingLink')) then
    perform be_private.mail_enqueue('interview', new.id,
      'int:' || new.id || ':' || coalesce(new.data->>'interviewAt', '') || ':' || md5(coalesce(new.data->>'meetingLink', '')));
  end if;

  for sem in select x from jsonb_array_elements(case when jsonb_typeof(new.data->'semesters') = 'array' then new.data->'semesters' else '[]'::jsonb end) x loop
    osem := null;
    select x into osem from jsonb_array_elements(case when jsonb_typeof(old.data->'semesters') = 'array' then old.data->'semesters' else '[]'::jsonb end) x
     where x->>'id' = sem->>'id' limit 1;
    if sem->>'status' = 'paid' and coalesce(osem->>'status', '') <> 'paid' then
      perform be_private.mail_enqueue('tuition_paid', new.id, 'paid:' || new.id || ':' || (sem->>'id') || ':' || coalesce(sem->>'paidAt', ''), jsonb_build_object('sem', sem->>'id'));
    elsif sem->>'status' = 'bill-uploaded' and coalesce(osem->>'status', '') <> 'bill-uploaded' then
      perform be_private.mail_enqueue('bill_uploaded', new.id, 'bill:' || new.id || ':' || (sem->>'id') || ':' || coalesce(sem->'bill'->>'uploadedAt', ''), jsonb_build_object('sem', sem->>'id'));
    elsif sem->>'status' = 'completed' and coalesce(osem->>'status', '') <> 'completed' then
      perform be_private.mail_enqueue('ip_uploaded', new.id, 'ip:' || new.id || ':' || (sem->>'id') || ':' || coalesce(sem->'ip'->>'uploadedAt', ''), jsonb_build_object('sem', sem->>'id'));
    end if;
  end loop;

  if ss_new <> ss_old and ss_old <> '' and ss_new <> '' then
    select h->>'at' into last_at from jsonb_array_elements(case when jsonb_typeof(new.data->'statusHistory') = 'array' then new.data->'statusHistory' else '[]'::jsonb end) h
     order by h->>'at' desc nulls last limit 1;
    perform be_private.mail_enqueue('scholar_status', new.id, 'ss:' || new.id || ':' || ss_new || ':' || coalesce(last_at, ''), jsonb_build_object('status', ss_new, 'from', ss_old));
    if ss_new = 'graduated' then
      perform be_private.mail_enqueue('graduation', new.id, 'grad:' || new.id || ':' || coalesce(last_at, ''));
    end if;
  end if;

  for r in select x from jsonb_array_elements(case when jsonb_typeof(new.data->'changeRequests') = 'array' then new.data->'changeRequests' else '[]'::jsonb end) x loop
    orq := null;
    select x into orq from jsonb_array_elements(case when jsonb_typeof(old.data->'changeRequests') = 'array' then old.data->'changeRequests' else '[]'::jsonb end) x
     where x->>'id' = r->>'id' limit 1;
    if r->>'status' = 'pending' and orq is null then
      perform be_private.mail_enqueue('change_requested', new.id, 'chg:' || new.id || ':' || (r->>'id'), jsonb_build_object('req', r->>'id'));
    elsif r->>'status' in ('approved', 'rejected') and coalesce(orq->>'status', '') = 'pending' then
      perform be_private.mail_enqueue('change_resolved', new.id, 'chgr:' || new.id || ':' || (r->>'id'), jsonb_build_object('req', r->>'id'));
    end if;
  end loop;
  return null;
end $$;

create or replace function be_private.mail_on_report() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform be_private.mail_enqueue('report_new', new.id, 'rep:' || new.id);
  elsif coalesce(new.data->'reply'->>'text', '') <> ''
        and (new.data->'reply'->>'at') is distinct from (old.data->'reply'->>'at') then
    perform be_private.mail_enqueue('report_reply', new.id, 'reply:' || new.id || ':' || coalesce(new.data->'reply'->>'at', ''));
  end if;
  return null;
end $$;

create or replace trigger be_mail_donation after insert or update on public.donations
  for each row execute function be_private.mail_on_donation();
create or replace trigger be_mail_applicant after update on public.applicants
  for each row execute function be_private.mail_on_applicant();
create or replace trigger be_mail_report after insert or update on public.reports
  for each row execute function be_private.mail_on_report();

-- ---------- worker RPCs (service_role only) ----------
create or replace function public.be_mail_worker_ctx() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('settings', settings, 'secret', hook_secret,
    'sent24h', (select count(*) from be_private.mail_outbox where status = 'sent' and sent_at > now() - interval '24 hours'))
  from be_private.mail_settings where id = 1;
$$;

create or replace function public.be_mail_claim(p_limit int) returns jsonb
language sql volatile security definer set search_path = '' as $$
  with c as (
    select id from be_private.mail_outbox
     where status = 'pending' and (next_try_at is null or next_try_at <= now())
     order by (kind = 'receipt') desc, id
     limit greatest(1, least(coalesce(p_limit, 10), 50))
     for update skip locked),
  u as (
    update be_private.mail_outbox o set status = 'sending', attempts = o.attempts + 1, claimed_at = now()
      from c where o.id = c.id
    returning o.*)
  select coalesce(jsonb_agg(to_jsonb(u.*) order by (u.kind = 'receipt') desc, u.id), '[]'::jsonb) from u;
$$;

create or replace function public.be_mail_done(p_id bigint, p_status text, p_to text, p_subject text, p_resend_id text, p_error text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  update be_private.mail_outbox set
    status = case when p_status = 'retry' then (case when attempts >= 4 then 'failed' else 'pending' end)
                  when p_status = 'wait' then 'pending' else p_status end,
    attempts = case when p_status = 'wait' then greatest(attempts - 1, 0) else attempts end,
    next_try_at = case when p_status = 'retry' then now() + make_interval(mins => 5 * attempts)
                       when p_status = 'wait' then now() + interval '30 minutes' else next_try_at end,
    to_email = coalesce(p_to, to_email),
    subject = coalesce(p_subject, subject),
    resend_id = coalesce(p_resend_id, resend_id),
    last_error = case when p_status in ('sent') then null else left(p_error, 500) end,
    sent_at = case when p_status = 'sent' then now() else sent_at end
  where id = p_id;
end $$;

create or replace function public.be_mail_receipt(p_donation_id text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare n text; r be_private.receipts;
begin
  n := be_private.issue_receipt(p_donation_id);
  if n is null then return null; end if;
  select * into r from be_private.receipts where no = n;
  return to_jsonb(r);
end $$;

-- ---------- founder RPCs ----------
create or replace function public.be_mail_settings() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return (select settings from be_private.mail_settings where id = 1);
end $$;

create or replace function public.be_mail_save_settings(p_settings jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare s jsonb; t text;
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  t := trim(coalesce(p_settings->>'founderTo', ''));
  if t !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then t := 'hello@brialendowment.org'; end if;
  s := jsonb_build_object(
    'founderTo', left(t, 254),
    'paused', coalesce((p_settings->>'paused')::boolean, false),
    'kinds', case when jsonb_typeof(p_settings->'kinds') = 'object' then p_settings->'kinds' else '{}'::jsonb end);
  update be_private.mail_settings set settings = s, updated_at = now() where id = 1;
  -- un-pausing releases what waited
  if not (s->>'paused')::boolean then perform be_private.mail_kick(); end if;
  return s;
end $$;

create or replace function public.be_mail_log(p_limit int default 60) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'id', id, 'kind', kind, 'ref', ref, 'status', status, 'to', to_email, 'subject', subject,
            'attempts', attempts, 'error', last_error, 'createdAt', created_at, 'sentAt', sent_at) order by id desc), '[]'::jsonb)
          from (select * from be_private.mail_outbox order by id desc limit least(greatest(coalesce(p_limit, 60), 1), 200)) o);
end $$;

create or replace function public.be_receipts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'donationId', r.donation_id, 'no', r.no, 'issuedAt', r.issued_at,
            'mail', (select jsonb_build_object('status', o.status, 'to', o.to_email, 'sentAt', o.sent_at, 'error', o.last_error, 'createdAt', o.created_at)
                       from be_private.mail_outbox o where o.kind = 'receipt' and o.ref = r.donation_id order by o.id desc limit 1))), '[]'::jsonb)
          from be_private.receipts r);
end $$;

-- Send (or send again) the receipt of a verified gift. p_to overrides the
-- address once, e.g. when the donor asks for a copy elsewhere.
create or replace function public.be_mail_send_receipt(p_donation_id text, p_to text default null) returns jsonb
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
    jsonb_build_object('no', n, 'to', t, 'copy', true));
  return jsonb_build_object('no', n, 'to', t);
end $$;

create or replace function public.be_mail_send_test() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  if (select count(*) from be_private.mail_outbox where kind = 'test' and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  perform be_private.mail_enqueue('test', null, 'test:' || extract(epoch from clock_timestamp())::text);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- sweep: retries and stuck rows ----------
create or replace function be_private.mail_sweep() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update be_private.mail_outbox set status = 'pending' where status = 'sending' and claimed_at < now() - interval '10 minutes';
  if exists (select 1 from be_private.mail_outbox where status = 'pending' and (next_try_at is null or next_try_at <= now())) then
    perform be_private.mail_kick();
  end if;
end $$;

do $$ begin
  perform cron.unschedule('be-mail-sweep');
exception when others then null; end $$;
select cron.schedule('be-mail-sweep', '*/10 * * * *', $$select be_private.mail_sweep()$$);

-- ---------- grants ----------
revoke all on function
  be_private.is_gift(text, text, jsonb), be_private.mail_kick(), be_private.mail_enqueue(text, text, text, jsonb),
  be_private.issue_receipt(text), be_private.mail_on_donation(), be_private.mail_on_applicant(), be_private.mail_on_report(),
  be_private.mail_sweep(),
  public.be_mail_worker_ctx(), public.be_mail_claim(int), public.be_mail_done(bigint, text, text, text, text, text), public.be_mail_receipt(text),
  public.be_mail_settings(), public.be_mail_save_settings(jsonb), public.be_mail_log(int), public.be_receipts(),
  public.be_mail_send_receipt(text, text), public.be_mail_send_test()
from public, anon, authenticated;
grant execute on function
  public.be_mail_worker_ctx(), public.be_mail_claim(int), public.be_mail_done(bigint, text, text, text, text, text), public.be_mail_receipt(text)
to service_role;
grant execute on function
  public.be_mail_settings(), public.be_mail_save_settings(jsonb), public.be_mail_log(int), public.be_receipts(),
  public.be_mail_send_receipt(text, text), public.be_mail_send_test()
to authenticated;

-- ---------- receipt numbers for gifts verified before today (no emails) ----------
do $$
declare d record;
begin
  for d in select id from public.donations
            where coalesce(data->>'verified', 'false') = 'true' and be_private.is_gift(id, name, data)
            order by case when data->>'verifiedAt' ~ '^\d{4}-\d{2}-\d{2}' then (data->>'verifiedAt')::timestamptz else created_at end, created_at
  loop
    perform be_private.issue_receipt(d.id);
  end loop;
end $$;

-- start paused: sending begins once RESEND_API_KEY is stored and the founder un-pauses (or the setup step does)
update be_private.mail_settings set settings = jsonb_set(settings, '{paused}', 'true') where id = 1;
