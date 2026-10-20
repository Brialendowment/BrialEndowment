-- Food & Land becomes Reforestation & Land (20 Oct 2026)
-- * The pillar key stays "foodland" (and the address /foodland); only the name changes.
-- * Grants recorded under "Food & Land" keep their history under the new name.
--   The site also maps the old name on read, so a cached copy shows the same thing.
-- * The two journal entries on the page named the pillar; they now use the new name.
-- * Food & Clothing (PILLAR-CONTENT-FOODCLOTHING) needs no schema: it is an internal
--   content row like the other PILLAR-CONTENT-* rows, already public through
--   be_private.is_internal_donation.

update public.donations
   set data = jsonb_set(data, '{data,grants}',
         (select coalesce(jsonb_agg(case when g->>'pillar' = 'Food & Land'
                                         then jsonb_set(g, '{pillar}', '"Reforestation & Land"') else g end
                                    order by ord), '[]'::jsonb)
            from jsonb_array_elements(data->'data'->'grants') with ordinality as t(g, ord)))
 where id = 'PILLAR-GRANTS'
   and jsonb_typeof(data->'data'->'grants') = 'array';

update public.donations
   set data = replace(data::text, 'Food & Land', 'Reforestation & Land')::jsonb
 where id = 'FOODLAND-CONTENT';
