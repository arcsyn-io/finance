CREATE TABLE entry (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id    INTEGER NOT NULL,
  category_id  INTEGER NOT NULL,
  nature       TEXT    NOT NULL CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  direction    TEXT    NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount       INTEGER NOT NULL CHECK (amount > 0),
  occurred_at  TEXT    NOT NULL,
  description  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE INDEX ix_entry_wallet   ON entry(wallet_id);
CREATE INDEX ix_entry_category ON entry(category_id);
CREATE INDEX ix_entry_date     ON entry(occurred_at);
