-- Impact Report on a schedule (18 Nov 2026)
--
-- 20 December, 09:00 WIB  the be-impact worker prepares that year's report (status "review"),
--                          writes first words from the numbers, and emails the founder.
-- The founder reads it in the Founder Console and either edits it or approves it.
-- 1 January, 08:00 WIB     an approved report is published by the worker with the final
--                          numbers to 31 December, and emailed to the donors (if chosen).
--                          A report that is still waiting is not published; the founder is
--                          reminded every three days until it is approved.
--
-- Every write to the reports now goes through be_private.impact_put: it locks the record,
-- replaces one year's report only, and refuses a write made from an out-of-date copy
-- ("stale"), so the founder's screen and the scheduled worker can never overwrite each other.

-- Visitors never receive the working fields of a report
create or replace function be_private.public_impact_reports(p_data jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce((
    select jsonb_agg(r - 'snapshot' - 'notes' - 'rev' - 'mailDonors' - 'mailSubject' - 'mailBody' - 'autoDraftedAt'
                       - 'approvedAt' - 'reviewSince' - 'emailedCount' order by r->>'year' desc)
      from jsonb_array_elements(case when jsonb_typeof(p_data->'data'->'reports') = 'array'
                                     then p_data->'data'->'reports' else '[]'::jsonb end) r
     where r->>'status' = 'published'), '[]'::jsonb);
$$;

create or replace function be_private.impact_put(p_report jsonb, p_rev int, p_server boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  y int; reps jsonb; cur jsonb; nr jsonb; out_ jsonb; st text; cst text;
begin
  if jsonb_typeof(p_report) <> 'object' then raise exception 'invalid_report' using errcode = 'P0001'; end if;
  begin y := (p_report->>'year')::int; exception when others then y := null; end;
  if y is null or y < 2024 or y > 2100 then raise exception 'invalid_report' using errcode = 'P0001'; end if;
  st := coalesce(p_report->>'status', 'draft');
  if st not in ('draft', 'review', 'approved', 'published') then raise exception 'invalid_report' using errcode = 'P0001'; end if;
  if octet_length(p_report::text) > 400000 then raise exception 'too_large' using errcode = 'P0001'; end if;

  insert into public.donations (id, name, amount, data)
  values ('IMPACT-REPORTS', '__impact__', 0, jsonb_build_object('data', jsonb_build_object('reports', '[]'::jsonb)))
  on conflict (id) do nothing;
  select case when jsonb_typeof(d.data->'data'->'reports') = 'array' then d.data->'data'->'reports' else '[]'::jsonb end
    into reps from public.donations d where d.id = 'IMPACT-REPORTS' for update;
  select r into cur from jsonb_array_elements(reps) r where (r->>'year') = y::text limit 1;
  if coalesce((cur->>'rev')::int, 0) <> coalesce(p_rev, 0) then raise exception 'stale' using errcode = 'P0001'; end if;
  cst := coalesce(cur->>'status', '');

  if not p_server then
    -- only the schedule publishes; the founder approves
    if st = 'published' and cst <> 'published' then raise exception 'publish_by_schedule' using errcode = 'P0001'; end if;
    -- a published report keeps the numbers frozen on publication day
    if st = 'published' then
      nr := p_report || jsonb_build_object('snapshot', cur->'snapshot', 'publishedAt', cur->'publishedAt',
                                           'emailedAt', cur->'emailedAt', 'emailedCount', cur->'emailedCount', 'autoPublished', cur->'autoPublished');
    else
      nr := p_report;
    end if;
  else
    nr := p_report;
  end if;

  nr := nr || jsonb_build_object('rev', coalesce((cur->>'rev')::int, 0) + 1, 'updatedAt', to_jsonb(now()));
  out_ := coalesce((select jsonb_agg(r order by (r->>'year')::int) from jsonb_array_elements(reps) r where (r->>'year') <> y::text), '[]'::jsonb)
          || jsonb_build_array(nr);
  update public.donations set data = jsonb_build_object('data', jsonb_build_object('reports', out_))
   where id = 'IMPACT-REPORTS';
  return out_;
end $$;

-- The founder's save (Founder Console → Impact Report)
create or replace function public.be_impact_save(p_report jsonb, p_rev int) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return be_private.impact_put(p_report, p_rev, false);
end $$;

-- The email worker (service role only)
create or replace function public.be_impact_server_put(p_report jsonb, p_rev int) returns jsonb
language sql security definer set search_path = '' as $$ select be_private.impact_put(p_report, p_rev, true) $$;

create or replace function public.be_impact_server_mail(p_kind text, p_ref text, p_dedupe text, p_payload jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  -- founder notes go out as "message" (to the founder's alert address), donor letters as "announcement"
  if p_kind not in ('message', 'announcement') then raise exception 'invalid_kind' using errcode = 'P0001'; end if;
  return be_private.mail_enqueue(p_kind, p_ref, p_dedupe, coalesce(p_payload, '{}'::jsonb));
end $$;

-- Who receives the report: everyone with a verified gift, and the donors the founder added
-- by hand, minus anyone who unsubscribed. Same rule as the founder's announcement screen.
create or replace function public.be_impact_server_donors() returns jsonb
language sql stable security definer set search_path = '' as $$
  with gifts as (
    select lower(trim(d.data->>'email')) as email, trim(d.data->>'email') as raw_email,
           case when coalesce(d.data->>'anonymous', 'false') = 'true' then '' else coalesce(d.name, '') end as name,
           coalesce(d.data->>'submittedAt', d.created_at::text) as at
      from public.donations d
     where not be_private.is_internal_donation(d.id, d.name)
       and d.id not like 'SALE-%' and d.id not like 'ENT-%'
       and not (d.data->'data' ? 'sale') and not (d.data->'data' ? 'enterprise')
       and coalesce(d.data->>'verified', 'false') = 'true'
       and coalesce(d.data->>'email', '') ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ), people as (
    select distinct on (email) email, raw_email, name from gifts order by email, (name = ''), at desc
  ), manual as (
    select lower(trim(c.email)) as email, trim(c.email) as raw_email, coalesce(c.name, '') as name
      from be_private.mail_contacts c where c.audience = 'donor'
  ), everyone as (
    select * from people
    union all
    select m.* from manual m where not exists (select 1 from people p where p.email = m.email)
  )
  select coalesce(jsonb_agg(jsonb_build_object('email', e.raw_email, 'name', e.name) order by e.email), '[]'::jsonb)
    from everyone e
   where not exists (select 1 from be_private.mail_unsubscribes u where u.audience = 'donor' and lower(u.email) = e.email);
$$;

revoke all on function be_private.impact_put(jsonb, int, boolean) from public, anon, authenticated;
revoke all on function public.be_impact_save(jsonb, int) from public, anon;
grant execute on function public.be_impact_save(jsonb, int) to authenticated;
revoke all on function public.be_impact_server_put(jsonb, int) from public, anon, authenticated;
revoke all on function public.be_impact_server_mail(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.be_impact_server_donors() from public, anon, authenticated;
grant execute on function public.be_impact_server_put(jsonb, int) to service_role;
grant execute on function public.be_impact_server_mail(text, text, text, jsonb) to service_role;
grant execute on function public.be_impact_server_donors() to service_role;

-- Hourly nudge to the worker, only when there is something to do: December and January,
-- or a report that is waiting or approved.
create or replace function be_private.impact_kick() returns void
language plpgsql security definer set search_path = '' as $$
declare s text; m int := extract(month from now() at time zone 'Asia/Jakarta');
begin
  if m not in (12, 1) and not exists (
      select 1 from public.donations d, jsonb_array_elements(case when jsonb_typeof(d.data->'data'->'reports') = 'array' then d.data->'data'->'reports' else '[]'::jsonb end) r
       where d.id = 'IMPACT-REPORTS' and r->>'status' in ('review', 'approved')) then
    return;
  end if;
  select hook_secret into s from be_private.mail_settings where id = 1;
  perform net.http_post(
    url := 'https://sdlrjqdbxxzddgivnjws.supabase.co/functions/v1/be-impact',
    body := '{"action":"tick"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-be-hook', s),
    timeout_milliseconds := 30000);
exception when others then null;
end $$;
revoke all on function be_private.impact_kick() from public, anon, authenticated;

select cron.unschedule('be-impact-tick') where exists (select 1 from cron.job where jobname = 'be-impact-tick');
select cron.schedule('be-impact-tick', '20 * * * *', $$select be_private.impact_kick()$$);
