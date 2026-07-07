-- SQLite não suporta ALTER COLUMN, então precisamos recriar a tabela

-- Criar nova tabela com colunas nullable
CREATE TABLE import_request_new (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  status       TEXT    NOT NULL CHECK (status IN ('PENDING_REVIEW', 'CONFIRMED')),
  source       TEXT    NOT NULL CHECK (source IN ('NUBANK_CSV')),
  wallet_id    INTEGER,
  category_id  INTEGER,
  nature       TEXT    CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  FOREIGN KEY (wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (category_id) REFERENCES category(id)
);

-- Copiar dados existentes
INSERT INTO import_request_new (id, status, source, wallet_id, category_id, nature, created_at, confirmed_at)
SELECT id, status, source, wallet_id, category_id, nature, created_at, confirmed_at
FROM import_request;

-- Remover tabela antiga
DROP TABLE import_request;

-- Renomear nova tabela
ALTER TABLE import_request_new RENAME TO import_request;
