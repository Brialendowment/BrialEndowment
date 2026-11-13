-- Apply ONLY after the site that asks for the current password is live
-- (commit "Scholar account changes ask for the current password" or later).
-- Removes the old version that changed a password without the current one.
drop function if exists public.be_applicant_update_account(text, text, text);
