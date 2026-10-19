-- Read what was sent (19 Oct 2026)
-- * Every email the worker sends is now kept as sent: sender, reply-to, HTML,
--   plain text and the names of its attachments. PDFs are not stored; the
--   worker rebuilds them on request from the same records.
-- * The founder opens an email from the activity list in the Email console.
--   Emails sent before today have no stored copy; the worker rebuilds those
--   from the current records and the console says so.

alter table be_private.mail_outbox
  add column if not exists from_email  text,
  add column if not exists reply_to    text,
  add column if not exists html        text,
  add column if not exists body_text   text,
  add column if not exists attachments jsonb;

-- worker only: keep the copy that went out
create or replace function public.be_mail_store(p_id bigint, p_from text, p_reply_to text, p_html text, p_text text, p_attachments jsonb)
returns void language sql volatile security definer set search_path = '' as $$
  update be_private.mail_outbox
     set from_email  = left(p_from, 320),
         reply_to    = left(p_reply_to, 320),
         html        = left(p_html, 400000),
         body_text   = left(p_text, 200000),
         attachments = case when jsonb_typeof(p_attachments) = 'array' then p_attachments else '[]'::jsonb end
   where id = p_id;
$$;

-- worker only: one outbox row, for the founder's viewer (the worker checks the founder first)
create or replace function public.be_mail_row(p_id bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(o) from be_private.mail_outbox o where o.id = p_id;
$$;

-- the activity list says which rows have something to open
create or replace function public.be_mail_log(p_limit int default 60) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.be_is_founder() then raise exception 'forbidden' using errcode = 'P0001'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
            'id', id, 'kind', kind, 'ref', ref, 'status', status, 'to', to_email, 'subject', subject,
            'attempts', attempts, 'error', last_error, 'createdAt', created_at, 'sentAt', sent_at,
            'stored', html is not null,
            'files', coalesce(jsonb_array_length(attachments), 0)) order by id desc), '[]'::jsonb)
          from (select * from be_private.mail_outbox order by id desc limit least(greatest(coalesce(p_limit, 60), 1), 200)) o);
end $$;

revoke all on function public.be_mail_store(bigint, text, text, text, text, jsonb), public.be_mail_row(bigint) from public, anon, authenticated;
grant execute on function public.be_mail_store(bigint, text, text, text, text, jsonb), public.be_mail_row(bigint) to service_role;
