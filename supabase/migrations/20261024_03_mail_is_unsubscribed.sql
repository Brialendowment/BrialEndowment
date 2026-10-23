-- The email worker checks this right before sending, in case someone unsubscribed while the email waited
create or replace function public.be_mail_is_unsubscribed(p_audience text, p_email text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from be_private.mail_unsubscribes where audience = p_audience and email = lower(trim(coalesce(p_email, ''))) and active);
$$;
revoke all on function public.be_mail_is_unsubscribed(text, text) from public, anon, authenticated;
grant execute on function public.be_mail_is_unsubscribed(text, text) to service_role;
