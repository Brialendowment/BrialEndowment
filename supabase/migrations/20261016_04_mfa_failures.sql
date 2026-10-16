-- Founder Console: record wrong authenticator codes in the activity log (16 Oct 2026)
--
-- Supabase Auth keeps every code check in auth.mfa_challenges. A challenge that
-- was never verified means a wrong code was typed. This is read on the server,
-- so someone who knows the password cannot hide their attempts by skipping the
-- website and calling Supabase directly.

create or replace function be_private.sync_mfa_failures() returns void
language sql security definer set search_path = '' as $$
  insert into be_private.audit_log(at, actor, actor_email, action, target, detail)
  select ch.created_at, f.user_id, u.email, 'security.authenticator_code_failed', null,
         jsonb_strip_nulls(jsonb_build_object('challenge', ch.id::text, 'ip', host(ch.ip_address)))
    from auth.mfa_challenges ch
    join auth.mfa_factors f on f.id = ch.factor_id
    join be_private.founders b on b.user_id = f.user_id
    left join auth.users u on u.id = f.user_id
   where ch.verified_at is null
     and ch.created_at < now() - interval '2 minutes'
     and not exists (select 1 from be_private.audit_log l
                      where l.action = 'security.authenticator_code_failed'
                        and l.detail->>'challenge' = ch.id::text);
$$;

create or replace function public.be_founder_activity(p_limit int) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then return null; end if;
  perform be_private.sync_mfa_failures();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', l.id, 'at', l.at, 'by', l.actor_email, 'action', l.action, 'target', l.target, 'detail', l.detail - 'challenge') order by l.at desc)
      from (select * from be_private.audit_log order by at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) l), '[]'::jsonb);
end $$;

create or replace function public.be_founder_security() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then return null; end if;
  perform be_private.sync_mfa_failures();
  return jsonb_build_object(
    'mfa', be_private.founder_has_mfa(),
    'recoveryLeft', (select count(*) from be_private.founder_recovery where user_id = auth.uid() and used_at is null),
    'recoveryCreatedAt', (select max(created_at) from be_private.founder_recovery where user_id = auth.uid()),
    'failedCodes7d', (select count(*) from be_private.audit_log
                       where action in ('security.authenticator_code_failed', 'security.recovery_code_failed')
                         and at > now() - interval '7 days'));
end $$;

revoke all on function be_private.sync_mfa_failures() from public, anon, authenticated;
revoke all on function public.be_founder_activity(int), public.be_founder_security() from public, anon;
grant execute on function public.be_founder_activity(int), public.be_founder_security() to authenticated;
