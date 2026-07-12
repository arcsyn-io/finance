create table if not exists public.import_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  import_request_id uuid not null references public.import_requests(id) on delete cascade,
  import_row_id uuid references public.import_rows(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  original_file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists import_attachments_request_idx
  on public.import_attachments(import_request_id);

create index if not exists import_attachments_row_idx
  on public.import_attachments(import_row_id);

create index if not exists import_attachments_user_request_idx
  on public.import_attachments(user_id, import_request_id);

create unique index if not exists import_attachments_user_object_idx
  on public.import_attachments(user_id, object_path);

alter table public.import_attachments enable row level security;

drop policy if exists "Import attachments are readable by owner" on public.import_attachments;
drop policy if exists "Import attachments are insertable by owner" on public.import_attachments;
drop policy if exists "Import attachments are removable by owner" on public.import_attachments;

create policy "Import attachments are readable by owner"
  on public.import_attachments
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Import attachments are insertable by owner"
  on public.import_attachments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.import_requests request
      where request.id = import_request_id
        and request.user_id = auth.uid()
    )
    and (
      import_row_id is null
      or exists (
        select 1
        from public.import_rows row
        where row.id = import_row_id
          and row.import_request_id = import_request_id
          and row.user_id = auth.uid()
      )
    )
  );

create policy "Import attachments are removable by owner"
  on public.import_attachments
  for delete
  to authenticated
  using (user_id = auth.uid());
