ALTER TABLE entry ADD COLUMN transfer_id INTEGER REFERENCES transfer(id);

CREATE INDEX ix_entry_transfer ON entry(transfer_id);
