create type public.wallet_type as enum (
  'CASH',
  'NEGOTIABLE_SECURITY',
  'LONG_TERM',
  'ASSET'
);

create type public.category_type as enum (
  'INCOME',
  'EXPENSE'
);

create type public.entry_nature as enum (
  'OPERATIONAL',
  'PATRIMONIAL'
);

create type public.entry_direction as enum (
  'IN',
  'OUT'
);

create type public.import_status as enum (
  'PENDING',
  'CONFIRMED',
  'CANCELLED'
);

create type public.import_source as enum (
  'NUBANK_ACCOUNT',
  'NUBANK_CREDIT_CARD'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type public.wallet_type not null,
  initial_balance_cents integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_initial_balance_cents_non_negative
    check (initial_balance_cents >= 0)
);

create unique index wallets_user_name_idx on public.wallets (user_id, name);
create index wallets_user_type_idx on public.wallets (user_id, type);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type public.category_type not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_user_name_idx on public.categories (user_id, name);
create index categories_user_type_idx on public.categories (user_id, type);

create table public.economic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index economic_events_user_date_idx
  on public.economic_events (user_id, occurred_on);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_wallet_id uuid not null references public.wallets (id),
  to_wallet_id uuid not null references public.wallets (id),
  amount_cents integer not null,
  occurred_on date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_amount_cents_positive check (amount_cents > 0),
  constraint transfers_distinct_wallets check (from_wallet_id <> to_wallet_id)
);

create index transfers_user_date_idx on public.transfers (user_id, occurred_on);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id),
  category_id uuid references public.categories (id),
  transfer_id uuid references public.transfers (id),
  economic_event_id uuid references public.economic_events (id),
  nature public.entry_nature not null,
  direction public.entry_direction not null,
  amount_cents integer not null,
  occurred_on date not null,
  description text not null,
  external_id text,
  receipt_path text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_amount_cents_positive check (amount_cents > 0)
);

create index entries_user_date_idx on public.entries (user_id, occurred_on);
create index entries_user_wallet_idx on public.entries (user_id, wallet_id);
create unique index entries_user_external_idx
  on public.entries (user_id, external_id)
  where external_id is not null;

create table public.import_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source public.import_source not null,
  status public.import_status not null default 'PENDING',
  file_name text not null,
  default_wallet_id uuid references public.wallets (id),
  default_category_id uuid references public.categories (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_requests_user_status_idx
  on public.import_requests (user_id, status);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_request_id uuid not null references public.import_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  row_number integer not null,
  occurred_on date not null,
  description text not null,
  amount_cents integer not null,
  direction public.entry_direction not null,
  nature public.entry_nature not null default 'OPERATIONAL',
  wallet_id uuid references public.wallets (id),
  category_id uuid references public.categories (id),
  external_id text,
  entry_id uuid references public.entries (id),
  ignored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_rows_amount_cents_positive check (amount_cents > 0)
);

create unique index import_rows_request_row_idx
  on public.import_rows (import_request_id, row_number);

create index import_rows_user_request_idx
  on public.import_rows (user_id, import_request_id);
