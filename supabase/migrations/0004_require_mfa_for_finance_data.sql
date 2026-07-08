drop policy if exists "Profiles require aal2" on public.profiles;
drop policy if exists "Wallets require aal2" on public.wallets;
drop policy if exists "Categories require aal2" on public.categories;
drop policy if exists "Economic events require aal2" on public.economic_events;
drop policy if exists "Transfers require aal2" on public.transfers;
drop policy if exists "Entries require aal2" on public.entries;
drop policy if exists "Import requests require aal2" on public.import_requests;
drop policy if exists "Import rows require aal2" on public.import_rows;
drop policy if exists "Receipts require aal2" on storage.objects;

create policy "Profiles require aal2"
  on public.profiles
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Wallets require aal2"
  on public.wallets
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Categories require aal2"
  on public.categories
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Economic events require aal2"
  on public.economic_events
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Transfers require aal2"
  on public.transfers
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Entries require aal2"
  on public.entries
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Import requests require aal2"
  on public.import_requests
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Import rows require aal2"
  on public.import_rows
  as restrictive
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Receipts require aal2"
  on storage.objects
  as restrictive
  to authenticated
  using (
    bucket_id <> 'receipts'
    or (select auth.jwt()->>'aal') = 'aal2'
  )
  with check (
    bucket_id <> 'receipts'
    or (select auth.jwt()->>'aal') = 'aal2'
  );
