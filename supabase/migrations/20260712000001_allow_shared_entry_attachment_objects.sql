drop index if exists public.entry_attachments_user_object_idx;

create unique index if not exists entry_attachments_user_entry_object_idx
  on public.entry_attachments(user_id, entry_id, object_path);
