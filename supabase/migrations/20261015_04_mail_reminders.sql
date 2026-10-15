-- Automatic reminders (runs every hour; each reminder goes out once).
--   interview_reminder  applicant   ~24 h before the interview
--   bill_reminder       scholar     on the UKT-season dates: upload next semester's bill
--   results_reminder    scholar     on the results-season dates: upload IP/KHS of a paid semester
--   bill_due            founder     a bill waits: deadline in N days, deadline passed, or waiting > N days
-- Season dates are founder-editable (Site settings → Email → Reminders), in
-- Jakarta time, and fire from 09:00 WIB. Nothing is queued while sending is paused.

create or replace function be_private.safe_ts(t text) returns timestamptz
language plpgsql immutable set search_path = '' as $$
begin return t::timestamptz; exception when others then return null; end $$;
create or replace function be_private.safe_date(t text) returns date
language plpgsql immutable set search_path = '' as $$
begin return t::date; exception when others then return null; end $$;

create or replace function be_private.mail_reminders() returns int
language plpgsql security definer set search_path = '' as $$
declare
  st jsonb := (select settings from be_private.mail_settings where id = 1);
  rem jsonb := coalesce(st->'reminders', '{}'::jsonb);
  -- an empty list means "never"; a missing list means the defaults
  bill_dates text[] := case when jsonb_typeof(rem->'billDates') = 'array'
                            then coalesce((select array_agg(x) from jsonb_array_elements_text(rem->'billDates') x), '{}'::text[])
                            else array['01-10', '01-25', '07-25', '08-10'] end;
  res_dates text[] := case when jsonb_typeof(rem->'resultDates') = 'array'
                           then coalesce((select array_agg(x) from jsonb_array_elements_text(rem->'resultDates') x), '{}'::text[])
                           else array['02-05', '02-20', '07-10', '07-25'] end;
  grace int := greatest(1, least(coalesce(nullif(rem->>'billGraceDays', '')::int, 5), 30));
  jkt timestamp := now() at time zone 'Asia/Jakarta';
  today date := (now() at time zone 'Asia/Jakarta')::date;
  mmdd text := to_char(now() at time zone 'Asia/Jakarta', 'MM-DD');
  morning boolean := extract(hour from now() at time zone 'Asia/Jakarta') >= 9;
  a record; sem jsonb; ia timestamptz; due date; up timestamptz; paid timestamptz; stage text; n int := 0;
begin
  if coalesce((st->>'paused')::boolean, false) then return 0; end if;
  for a in select id, email, status, data from public.applicants where coalesce(data->>'deleted', 'false') <> 'true' loop
    if a.status = 'interview-scheduled' then
      ia := be_private.safe_ts(a.data->>'interviewAt');
      if ia is not null and ia > now() + interval '1 hour' and ia <= now() + interval '26 hours'
         and not exists (select 1 from be_private.mail_outbox o where o.kind = 'interview' and o.ref = a.id and o.created_at > now() - interval '8 hours') then
        if be_private.mail_enqueue('interview_reminder', a.id, 'intrem:' || a.id || ':' || (a.data->>'interviewAt')) then n := n + 1; end if;
      end if;
    end if;
    continue when a.status <> 'accepted' or coalesce(a.data->>'scholarStatus', 'active') <> 'active';
    for sem in select x from jsonb_array_elements(case when jsonb_typeof(a.data->'semesters') = 'array' then a.data->'semesters' else '[]'::jsonb end) x loop
      if sem->>'status' = 'current' and morning and mmdd = any(bill_dates) then
        if be_private.mail_enqueue('bill_reminder', a.id, 'billrem:' || a.id || ':' || (sem->>'id') || ':' || today, jsonb_build_object('sem', sem->>'id')) then n := n + 1; end if;
      elsif sem->>'status' = 'paid' and morning and mmdd = any(res_dates) then
        paid := be_private.safe_ts(sem->>'paidAt');
        if paid is null or paid < now() - interval '45 days' then
          if be_private.mail_enqueue('results_reminder', a.id, 'iprem:' || a.id || ':' || (sem->>'id') || ':' || today, jsonb_build_object('sem', sem->>'id')) then n := n + 1; end if;
        end if;
      elsif sem->>'status' = 'bill-uploaded' then
        due := be_private.safe_date(sem->'bill'->>'dueDate');
        up := be_private.safe_ts(sem->'bill'->>'uploadedAt');
        stage := null;
        if due is not null then
          if due < today then stage := 'overdue';
          elsif due - today <= 1 then stage := 'last';
          elsif due - today <= grace then stage := 'soon';
          end if;
          if stage is not null then
            if be_private.mail_enqueue('bill_due', a.id, 'billdue:' || a.id || ':' || (sem->>'id') || ':' || due || ':' || stage,
                 jsonb_build_object('sem', sem->>'id', 'stage', stage)) then n := n + 1; end if;
          end if;
        elsif up is not null and up < now() - make_interval(days => grace) then
          if be_private.mail_enqueue('bill_due', a.id, 'billdue:' || a.id || ':' || (sem->>'id') || ':wait:' || to_char(jkt, 'IYYY-IW'),
               jsonb_build_object('sem', sem->>'id', 'stage', 'waiting')) then n := n + 1; end if;
        end if;
      end if;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function be_private.mail_reminders(), be_private.safe_ts(text), be_private.safe_date(text) from public, anon, authenticated;

-- settings now carry the reminder calendar
create or replace function public.be_mail_save_settings(p_settings jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare s jsonb; t text;
  r jsonb := coalesce(p_settings->'reminders', (select settings->'reminders' from be_private.mail_settings where id = 1), '{}'::jsonb);
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  t := trim(coalesce(p_settings->>'founderTo', ''));
  if t !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then t := 'hello@brialendowment.org'; end if;
  s := jsonb_build_object(
    'founderTo', left(t, 254),
    'paused', coalesce((p_settings->>'paused')::boolean, false),
    'kinds', case when jsonb_typeof(p_settings->'kinds') = 'object' then p_settings->'kinds' else '{}'::jsonb end,
    'reminders', jsonb_build_object(
      'billDates', coalesce((select jsonb_agg(distinct x order by x) from jsonb_array_elements_text(case when jsonb_typeof(r->'billDates') = 'array' then r->'billDates' else '[]'::jsonb end) x
                             where x ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'), '[]'::jsonb),
      'resultDates', coalesce((select jsonb_agg(distinct x order by x) from jsonb_array_elements_text(case when jsonb_typeof(r->'resultDates') = 'array' then r->'resultDates' else '[]'::jsonb end) x
                             where x ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'), '[]'::jsonb),
      'billGraceDays', greatest(1, least(coalesce(nullif(r->>'billGraceDays', '')::int, 5), 30))));
  update be_private.mail_settings set settings = s, updated_at = now() where id = 1;
  if not (s->>'paused')::boolean then perform be_private.mail_kick(); end if;
  return s;
end $$;

update be_private.mail_settings
   set settings = settings || jsonb_build_object('reminders', jsonb_build_object(
         'billDates', '["01-10","01-25","07-25","08-10"]'::jsonb,
         'resultDates', '["02-05","02-20","07-10","07-25"]'::jsonb,
         'billGraceDays', 5))
 where id = 1 and not (settings ? 'reminders');

select cron.schedule('be-mail-reminders', '5 * * * *', $$select be_private.mail_reminders()$$);
