alter table public.entries
  drop constraint if exists entries_amount_cents_positive;

alter table public.entries
  drop constraint if exists entries_amount_cents_nonnegative;

alter table public.entries
  add constraint entries_amount_cents_nonnegative
  check (amount_cents >= 0);
