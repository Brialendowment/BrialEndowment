-- Endowment assets: what the perpetual fund owns (stocks, ETFs, crypto, cash, other).
--
-- One row per holding, with its own transaction history in data.txns (buy, sell, gift in kind,
-- dividend, fee, split), plus two settings rows: PORTFOLIO-POLICY (spending and allocation policy)
-- and PORTFOLIO-NAV (daily value history).
--
-- Founder only. Never part of the public snapshot. Every change is written to the audit log.
-- Holdings are never removed: one that is sold or written off is archived, so the record stays complete.

create table if not exists public.endowment_assets (
  id text primary key check (length(id) between 1 and 60),
  name text not null default '' check (length(name) <= 160),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.endowment_assets enable row level security;

create policy "founder all endowment assets" on public.endowment_assets
  for all to authenticated using (public.be_is_founder()) with check (public.be_is_founder());

-- New tables in public need explicit grants. Read, add and change only: holdings are archived, never removed.
revoke all on public.endowment_assets from public, anon, authenticated;
grant select, insert, update on public.endowment_assets to authenticated;

create or replace function be_private.endowment_assets_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger touch_endowment_assets before update on public.endowment_assets
  for each row execute function be_private.endowment_assets_touch();

create trigger be_audit_endowment_assets after insert or update on public.endowment_assets
  for each row execute function be_private.audit_row();
