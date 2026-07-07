CREATE TABLE wallet (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL CHECK (type IN ('CASH', 'NEGOTIABLE_SECURITY', 'LONG_TERM', 'ASSET')),
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX ux_wallet_name ON wallet(name COLLATE NOCASE);
