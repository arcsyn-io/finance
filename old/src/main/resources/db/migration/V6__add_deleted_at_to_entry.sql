ALTER TABLE entry ADD COLUMN deleted_at TEXT;

CREATE INDEX ix_entry_deleted ON entry(deleted_at);
