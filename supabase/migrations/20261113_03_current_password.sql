-- 13 Nov 2026
-- A scholar must give their current password to change their sign-in email or
-- password. Until now a signed-in browser alone was enough, so anyone holding an
-- unlocked phone or laptop could take the account over.
--
-- This is a NEW four-argument version. The three-argument one stays until the new
-- site is live (the old pages still call it), then 20261113_04 removes it.
--
-- A wrong current password is not raised as an error: it is returned as
-- {"error": "wrong_password"} so the failed attempt is kept and counted. Eight
-- failures in fifteen minutes pause further tries, as for sign-in.

create or replace function public.be_applicant_update_account(p_token text, p_email text, p_password text, p_current text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  aid text := be_private.session_applicant(p_token);
  e text := trim(coalesce(p_email, ''));
  a public.applicants;
  fails int;
begin
  select * into a from public.applicants where id = aid;
  if a.id is null then raise exception 'invalid_session' using errcode = 'P0001'; end if;
  if e = '' and coalesce(p_password, '') = '' then return be_private.own_row(a); end if;

  select count(*) into fails from be_private.login_attempts
   where email = lower(a.email) and not login_attempts.ok and at > now() - interval '15 minutes';
  if fails >= 8 then raise exception 'too_many_attempts' using errcode = 'P0001'; end if;
  if not be_private.verify_pw(coalesce(p_current, ''), a.data->>'passwordHash', a.data->>'password') then
    insert into be_private.login_attempts(email, ok) values (lower(a.email), false);
    return jsonb_build_object('error', 'wrong_password');
  end if;

  if e <> '' then
    if e !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' or length(e) > 254 then raise exception 'invalid_email' using errcode = 'P0001'; end if;
    if exists (select 1 from public.applicants where lower(email) = lower(e) and id <> aid) then
      raise exception 'email_exists' using errcode = 'P0001';
    end if;
    update public.applicants set email = e where id = aid;
  end if;
  if coalesce(p_password, '') <> '' then
    if length(p_password) < 8 then raise exception 'weak_password' using errcode = 'P0001'; end if;
    perform set_config('be.cred_write', 'on', true);
    update public.applicants
       set data = jsonb_set(data - 'password', '{passwordHash}', to_jsonb(be_private.bf_hash(p_password)))
     where id = aid;
    -- sign out other devices
    delete from be_private.applicant_sessions
     where applicant_id = aid and token_hash <> encode(extensions.digest(p_token, 'sha256'), 'hex');
  end if;
  select * into a from public.applicants where id = aid;
  return be_private.own_row(a);
end
$function$;
revoke all on function public.be_applicant_update_account(text, text, text, text) from public;
grant execute on function public.be_applicant_update_account(text, text, text, text) to anon, authenticated;
