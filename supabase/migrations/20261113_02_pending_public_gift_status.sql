-- 13 Nov 2026 (second change of the day; replaces part 1 of 20261113_01)
-- 1. Pending gifts are public again: every visitor sees a reported gift marked
--    Pending until the founder or the on-chain check verifies it. The site counts
--    only verified gifts in its totals.
-- 2. While a gift is pending, its free-text message is withheld from the public
--    snapshot (name, amount, date and reference still show). The message appears
--    once the gift is verified, so an unchecked form entry cannot publish text.
-- 3. be_gift_status(id): what a donor may know about their gift's check, so the
--    site can show live progress (searching, confirmations, verified, in review).
--    It returns no private detail: no email, sender, review reason or wallet.

create or replace function public.be_public_snapshot()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select jsonb_build_object(
    'applicants', coalesce((select jsonb_agg(be_private.public_applicant(a) order by a.created_at desc)
                              from public.applicants a
                             where a.status = 'accepted' and coalesce(a.data->>'deleted', 'false') <> 'true'), '[]'::jsonb),
    'donations',  coalesce((select jsonb_agg(be_private.public_donation(d) order by d.created_at desc)
                              from public.donations d), '[]'::jsonb));
$function$;

do $do$
declare
  def text;
  a1 text := $a$else (coalesce(d.data, '{}'::jsonb) - 'email') #- '{payment,sender}' #- '{payment,ref}' end);$a$;
begin
  select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'be_private' and p.proname = 'public_donation';
  if def is null then raise exception 'public_donation not found'; end if;
  if position($m$- 'message'$m$ in def) > 0 then return; end if;            -- already applied
  if position(a1 in def) = 0 then raise exception 'public_donation has changed; update this migration'; end if;
  def := replace(def, a1,
       $r$when d.id ~ '^D-[0-9]+$' and coalesce(d.data->>'verified', 'false') <> 'true' then
                     (coalesce(d.data, '{}'::jsonb) - 'email' - 'message') #- '{payment,sender}' #- '{payment,ref}'
                   $r$ || a1);
  execute def;
end
$do$;

create or replace function public.be_gift_status(p_id text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare d public.donations; c be_private.chain_checks;
begin
  if coalesce(p_id, '') !~ '^D-[0-9]{1,9}$' then return null; end if;
  select * into d from public.donations where id = p_id;
  if d.id is null then return jsonb_build_object('state', 'gone'); end if;
  if coalesce(d.data->>'verified', 'false') = 'true' then
    return jsonb_strip_nulls(jsonb_build_object('state', 'verified', 'by', d.data->>'verifiedBy', 'amount', d.amount,
      'network', d.data->'chain'->>'network', 'explorer', d.data->'chain'->>'explorer'));
  end if;
  select * into c from be_private.chain_checks where donation_id = p_id;
  if c.donation_id is null then return jsonb_build_object('state', 'pending'); end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'state', case when c.status = 'waiting' then 'confirming'
                  when c.status in ('queued', 'retry') then 'searching'
                  else 'review' end,
    'network', case when c.status = 'waiting' then c.result->>'network' end,
    'confirmations', case when c.status = 'waiting' then c.result->'confirmations' end,
    'required', case when c.status = 'waiting' then c.result->'required' end,
    'explorer', case when c.status = 'waiting' then c.result->>'explorer' end));
end
$function$;
revoke all on function public.be_gift_status(text) from public;
grant execute on function public.be_gift_status(text) to anon, authenticated;
