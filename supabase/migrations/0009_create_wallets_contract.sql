do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'wallet_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.wallet_type as enum (
      'CASH',
      'CREDIT_CARD',
      'NEGOTIABLE_SECURITY',
      'LONG_TERM',
      'ASSET'
    );
  end if;
end $$;

alter type public.wallet_type add value if not exists 'CREDIT_CARD';

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  legacy_id integer,
  name text not null,
  type public.wallet_type not null,
  initial_balance_cents integer not null default 0,
  active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets
  add column if not exists legacy_id integer,
  add column if not exists initial_balance_cents integer not null default 0,
  add column if not exists active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.wallets
  drop constraint if exists wallets_initial_balance_cents_non_negative;

create unique index if not exists wallets_user_name_idx
  on public.wallets (user_id, name);

create index if not exists wallets_user_type_idx
  on public.wallets (user_id, type);

create unique index if not exists wallets_user_legacy_id_idx
  on public.wallets (user_id, legacy_id)
  where legacy_id is not null;

alter table public.wallets enable row level security;

drop policy if exists "Wallets are readable by owner" on public.wallets;
drop policy if exists "Wallets are insertable by owner" on public.wallets;
drop policy if exists "Wallets are updatable by owner" on public.wallets;
drop policy if exists "Wallets are deletable by owner" on public.wallets;

create policy "Wallets are readable by owner"
  on public.wallets
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Wallets are insertable by owner"
  on public.wallets
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Wallets are updatable by owner"
  on public.wallets
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Wallets are deletable by owner"
  on public.wallets
  for delete
  to authenticated
  using (user_id = auth.uid());
