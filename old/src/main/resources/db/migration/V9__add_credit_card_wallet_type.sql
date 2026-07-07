-- SQLite não permite alterar CHECK constraints diretamente
-- Recriamos a tabela com o novo constraint

CREATE TABLE wallet_new (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL CHECK (type IN ('CASH', 'CREDIT_CARD', 'NEGOTIABLE_SECURITY', 'LONG_TERM', 'ASSET')),
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO wallet_new (id, name, type, active, created_at)
SELECT id, name, type, active, created_at FROM wallet;

DROP TABLE wallet;

ALTER TABLE wallet_new RENAME TO wallet;

CREATE UNIQUE INDEX ux_wallet_name ON wallet(name COLLATE NOCASE);
