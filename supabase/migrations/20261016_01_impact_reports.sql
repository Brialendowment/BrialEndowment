-- Impact reports (16 Oct 2026)
-- The founder writes one report a year in the Founder Console (Foundation office -> Impact Report).
-- Reports live in the internal donations record IMPACT-REPORTS (name "__impact__"), like the other
-- site settings. Visitors only ever receive PUBLISHED reports, and only their public part:
-- the founder's working copy of the numbers ("snapshot") and private notes never leave the database.

create or replace function be_private.public_impact_reports(p_data jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce((
    select jsonb_agg(r - 'snapshot' - 'notes' order by r->>'year' desc)
      from jsonb_array_elements(case when jsonb_typeof(p_data->'data'->'reports') = 'array'
                                     then p_data->'data'->'reports' else '[]'::jsonb end) r
     where r->>'status' = 'published'), '[]'::jsonb);
$$;

create or replace function be_private.public_donation(d public.donations)
 returns jsonb
 language sql
 stable
 set search_path to ''
as $function$
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
                   else coalesce(d.data, '{}'::jsonb) - 'email' end);
$function$;

-- Light read for the public report page (brialendowment.org/impact/<year>).
create or replace function public.be_public_impact() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select be_private.public_impact_reports(d.data) from public.donations d where d.id = 'IMPACT-REPORTS'), '[]'::jsonb);
$$;
revoke all on function public.be_public_impact() from public;
grant execute on function public.be_public_impact() to anon, authenticated;
