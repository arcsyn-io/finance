alter type public.wallet_type add value if not exists 'CREDIT_CARD';
alter type public.import_status add value if not exists 'PENDING_REVIEW';
alter type public.import_source add value if not exists 'NUBANK_CSV';
alter type public.import_source add value if not exists 'NU_CONTA_CSV';

alter table public.wallets
  add column if not exists legacy_id integer,
  add column if not exists active boolean not null default true;

create unique index if not exists wallets_user_legacy_id_idx
  on public.wallets (user_id, legacy_id)
  where legacy_id is not null;

alter table public.categories
  add column if not exists legacy_id integer,
  add column if not exists active boolean not null default true;

create unique index if not exists categories_user_legacy_id_idx
  on public.categories (user_id, legacy_id)
  where legacy_id is not null;

alter table public.transfers
  add column if not exists legacy_id integer,
  add column if not exists from_category_id uuid references public.categories (id),
  add column if not exists to_category_id uuid references public.categories (id);

create unique index if not exists transfers_user_legacy_id_idx
  on public.transfers (user_id, legacy_id)
  where legacy_id is not null;

alter table public.entries
  alter column description drop not null,
  add column if not exists legacy_id integer,
  add column if not exists economic_event text;

drop index if exists public.entries_user_external_idx;

create unique index if not exists entries_user_wallet_external_idx
  on public.entries (user_id, wallet_id, external_id)
  where external_id is not null;

create unique index if not exists entries_user_legacy_id_idx
  on public.entries (user_id, legacy_id)
  where legacy_id is not null;

alter table public.import_requests
  add column if not exists legacy_id integer,
  add column if not exists nature public.entry_nature,
  add column if not exists economic_event text,
  add column if not exists confirmed_at timestamptz;

create unique index if not exists import_requests_user_legacy_id_idx
  on public.import_requests (user_id, legacy_id)
  where legacy_id is not null;

alter table public.import_rows
  alter column description drop not null,
  alter column nature drop not null,
  alter column nature drop default,
  add column if not exists legacy_id integer,
  add column if not exists valid boolean not null default true,
  add column if not exists validation_errors text,
  add column if not exists economic_event text;

create unique index if not exists import_rows_user_legacy_id_idx
  on public.import_rows (user_id, legacy_id)
  where legacy_id is not null;

create table if not exists public.cash_flow_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  legacy_id integer,
  reference_month text not null,
  opening_balance_cents integer not null,
  minimum_cash_cents integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cash_flow_configs_user_reference_month_idx
  on public.cash_flow_configs (user_id, reference_month);

create unique index if not exists cash_flow_configs_user_legacy_id_idx
  on public.cash_flow_configs (user_id, legacy_id)
  where legacy_id is not null;

alter table public.cash_flow_configs enable row level security;

drop policy if exists "Cash flow configs are readable by owner" on public.cash_flow_configs;
drop policy if exists "Cash flow configs are insertable by owner" on public.cash_flow_configs;
drop policy if exists "Cash flow configs are updatable by owner" on public.cash_flow_configs;
drop policy if exists "Cash flow configs are deletable by owner" on public.cash_flow_configs;

create policy "Cash flow configs are readable by owner"
  on public.cash_flow_configs
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and auth.jwt()->>'aal' = 'aal2'
  );

create policy "Cash flow configs are insertable by owner"
  on public.cash_flow_configs
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and auth.jwt()->>'aal' = 'aal2'
  );

create policy "Cash flow configs are updatable by owner"
  on public.cash_flow_configs
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and auth.jwt()->>'aal' = 'aal2'
  )
  with check (
    user_id = auth.uid()
    and auth.jwt()->>'aal' = 'aal2'
  );

create policy "Cash flow configs are deletable by owner"
  on public.cash_flow_configs
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and auth.jwt()->>'aal' = 'aal2'
  );
