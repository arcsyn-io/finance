alter table if exists public.profiles enable row level security;
alter table if exists public.wallets enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.economic_events enable row level security;
alter table if exists public.transfers enable row level security;
alter table if exists public.entries enable row level security;
alter table if exists public.import_requests enable row level security;
alter table if exists public.import_rows enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;

create policy "Profiles are readable by owner"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Profiles are insertable by owner"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

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

drop policy if exists "Categories are readable by owner" on public.categories;
drop policy if exists "Categories are insertable by owner" on public.categories;
drop policy if exists "Categories are updatable by owner" on public.categories;
drop policy if exists "Categories are deletable by owner" on public.categories;

create policy "Categories are readable by owner"
  on public.categories
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Categories are insertable by owner"
  on public.categories
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Categories are updatable by owner"
  on public.categories
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Categories are deletable by owner"
  on public.categories
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Economic events are readable by owner" on public.economic_events;
drop policy if exists "Economic events are insertable by owner" on public.economic_events;
drop policy if exists "Economic events are updatable by owner" on public.economic_events;
drop policy if exists "Economic events are deletable by owner" on public.economic_events;

create policy "Economic events are readable by owner"
  on public.economic_events
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Economic events are insertable by owner"
  on public.economic_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Economic events are updatable by owner"
  on public.economic_events
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Economic events are deletable by owner"
  on public.economic_events
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Transfers are readable by owner" on public.transfers;
drop policy if exists "Transfers are insertable by owner" on public.transfers;
drop policy if exists "Transfers are updatable by owner" on public.transfers;
drop policy if exists "Transfers are deletable by owner" on public.transfers;

create policy "Transfers are readable by owner"
  on public.transfers
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Transfers are insertable by owner"
  on public.transfers
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.wallets from_wallet
      where from_wallet.id = from_wallet_id
        and from_wallet.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.wallets to_wallet
      where to_wallet.id = to_wallet_id
        and to_wallet.user_id = auth.uid()
    )
  );

create policy "Transfers are updatable by owner"
  on public.transfers
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.wallets from_wallet
      where from_wallet.id = from_wallet_id
        and from_wallet.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.wallets to_wallet
      where to_wallet.id = to_wallet_id
        and to_wallet.user_id = auth.uid()
    )
  );

create policy "Transfers are deletable by owner"
  on public.transfers
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Entries are readable by owner" on public.entries;
drop policy if exists "Entries are insertable by owner" on public.entries;
drop policy if exists "Entries are updatable by owner" on public.entries;
drop policy if exists "Entries are deletable by owner" on public.entries;

create policy "Entries are readable by owner"
  on public.entries
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Entries are insertable by owner"
  on public.entries
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.wallets
      where wallets.id = wallet_id
        and wallets.user_id = auth.uid()
    )
    and (
      category_id is null
      or exists (
        select 1
        from public.categories
        where categories.id = category_id
          and categories.user_id = auth.uid()
      )
    )
  );

create policy "Entries are updatable by owner"
  on public.entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.wallets
      where wallets.id = wallet_id
        and wallets.user_id = auth.uid()
    )
    and (
      category_id is null
      or exists (
        select 1
        from public.categories
        where categories.id = category_id
          and categories.user_id = auth.uid()
      )
    )
  );

create policy "Entries are deletable by owner"
  on public.entries
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Import requests are readable by owner" on public.import_requests;
drop policy if exists "Import requests are insertable by owner" on public.import_requests;
drop policy if exists "Import requests are updatable by owner" on public.import_requests;
drop policy if exists "Import requests are deletable by owner" on public.import_requests;

create policy "Import requests are readable by owner"
  on public.import_requests
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Import requests are insertable by owner"
  on public.import_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Import requests are updatable by owner"
  on public.import_requests
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Import requests are deletable by owner"
  on public.import_requests
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Import rows are readable by owner" on public.import_rows;
drop policy if exists "Import rows are insertable by owner" on public.import_rows;
drop policy if exists "Import rows are updatable by owner" on public.import_rows;
drop policy if exists "Import rows are deletable by owner" on public.import_rows;

create policy "Import rows are readable by owner"
  on public.import_rows
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Import rows are insertable by owner"
  on public.import_rows
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.import_requests
      where import_requests.id = import_request_id
        and import_requests.user_id = auth.uid()
    )
  );

create policy "Import rows are updatable by owner"
  on public.import_rows
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.import_requests
      where import_requests.id = import_request_id
        and import_requests.user_id = auth.uid()
    )
  );

create policy "Import rows are deletable by owner"
  on public.import_rows
  for delete
  to authenticated
  using (user_id = auth.uid());
