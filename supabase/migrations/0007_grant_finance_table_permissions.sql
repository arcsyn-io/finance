grant usage on schema public to authenticated;

grant usage on type
  public.wallet_type,
  public.category_type,
  public.entry_nature,
  public.entry_direction,
  public.import_status,
  public.import_source
to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.wallets,
  public.categories,
  public.economic_events,
  public.transfers,
  public.entries,
  public.import_requests,
  public.import_rows,
  public.cash_flow_configs
to authenticated;
