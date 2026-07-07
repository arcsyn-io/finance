CREATE TABLE transfer (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  from_wallet_id   INTEGER NOT NULL,
  to_wallet_id     INTEGER NOT NULL,
  from_category_id INTEGER NOT NULL,
  to_category_id   INTEGER NOT NULL,
  amount           INTEGER NOT NULL CHECK (amount > 0),
  occurred_at      TEXT    NOT NULL,
  description      TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (to_wallet_id)     REFERENCES wallet(id),
  FOREIGN KEY (from_category_id) REFERENCES category(id),
  FOREIGN KEY (to_category_id)   REFERENCES category(id)
);

CREATE INDEX ix_transfer_from_wallet ON transfer(from_wallet_id);
CREATE INDEX ix_transfer_to_wallet   ON transfer(to_wallet_id);
CREATE INDEX ix_transfer_date        ON transfer(occurred_at);
