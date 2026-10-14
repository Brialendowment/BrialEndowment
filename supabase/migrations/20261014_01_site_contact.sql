-- Footer contact & social links (row id SITE-CONTACT, managed in the Founder
-- Portal → Site settings). Items the founder hides never leave the database:
-- the public snapshot only carries items with "shown": true.
create or replace function be_private.is_internal_donation(p_id text, p_name text)
 returns boolean
 language sql
 immutable
 set search_path to ''
as $function$
  select p_id = any (array['LEGACY-SUMMARY','PILLAR-GRANTS','PILLAR-LINKS','PILLAR-STATUS','PAYMENT-CONFIG',
                           'EBOOKS-CATALOG','FOODLAND-CONTENT','WORSHIP-CONTENT','WATER-CONTENT','SITE-CONTACT'])
      or p_id like 'PILLAR-CONTENT-%' or left(coalesce(p_name, ''), 2) = '__';
$function$;

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
                   when be_private.is_internal_donation(d.id, d.name) then d.data
                   else coalesce(d.data, '{}'::jsonb) - 'email' end);
$function$;
