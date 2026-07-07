CREATE TABLE import_request (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  status       TEXT    NOT NULL CHECK (status IN ('PENDING_REVIEW', 'CONFIRMED')),
  source       TEXT    NOT NULL CHECK (source IN ('NUBANK_CSV')),
  wallet_id    INTEGER NOT NULL,
  category_id  INTEGER NOT NULL,
  nature       TEXT    NOT NULL CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  FOREIGN KEY (wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (category_id) REFERENCES category(id)
);

CREATE TABLE import_row (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  import_request_id  INTEGER NOT NULL,
  description        TEXT,
  occurred_at        TEXT    NOT NULL,
  amount             INTEGER NOT NULL CHECK (amount > 0),
  direction          TEXT    NOT NULL CHECK (direction IN ('IN', 'OUT')),
  category_id        INTEGER,
  wallet_id          INTEGER,
  nature             TEXT,
  valid              INTEGER NOT NULL DEFAULT 1,
  validation_errors  TEXT,
  FOREIGN KEY (import_request_id) REFERENCES import_request(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id)       REFERENCES category(id),
  FOREIGN KEY (wallet_id)         REFERENCES wallet(id)
);

CREATE INDEX ix_import_row_request ON import_row(import_request_id);
