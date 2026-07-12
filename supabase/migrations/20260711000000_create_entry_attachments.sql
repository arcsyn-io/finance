create table if not exists public.entry_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  original_file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entry_attachments_entry_idx
  on public.entry_attachments(entry_id);

create index if not exists entry_attachments_user_entry_idx
  on public.entry_attachments(user_id, entry_id);

create unique index if not exists entry_attachments_user_object_idx
  on public.entry_attachments(user_id, object_path);

alter table public.entry_attachments enable row level security;

drop policy if exists "Entry attachments are readable by owner" on public.entry_attachments;
drop policy if exists "Entry attachments are insertable by owner" on public.entry_attachments;
drop policy if exists "Entry attachments are removable by owner" on public.entry_attachments;

create policy "Entry attachments are readable by owner"
  on public.entry_attachments
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Entry attachments are insertable by owner"
  on public.entry_attachments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.entries e
      where e.id = entry_id
        and e.user_id = auth.uid()
    )
  );

create policy "Entry attachments are removable by owner"
  on public.entry_attachments
  for delete
  to authenticated
  using (user_id = auth.uid());
