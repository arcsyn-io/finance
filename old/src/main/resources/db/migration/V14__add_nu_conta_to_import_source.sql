-- SQLite não suporta ALTER TABLE para modificar CHECK constraints
-- Precisamos recriar a tabela import_request

-- 1. Criar tabela temporária com a nova constraint
CREATE TABLE import_request_new (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  status       TEXT    NOT NULL CHECK (status IN ('PENDING_REVIEW', 'CONFIRMED')),
  source       TEXT    NOT NULL CHECK (source IN ('NUBANK_CSV', 'NU_CONTA_CSV')),
  wallet_id    INTEGER,
  category_id  INTEGER,
  nature       TEXT CHECK (nature IN ('OPERATIONAL', 'PATRIMONIAL')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  FOREIGN KEY (wallet_id)   REFERENCES wallet(id),
  FOREIGN KEY (category_id) REFERENCES category(id)
);

-- 2. Copiar dados existentes
INSERT INTO import_request_new (id, status, source, wallet_id, category_id, nature, created_at, confirmed_at)
SELECT id, status, source, wallet_id, category_id, nature, created_at, confirmed_at
FROM import_request;

-- 3. Remover tabela antiga
DROP TABLE import_request;

-- 4. Renomear nova tabela
ALTER TABLE import_request_new RENAME TO import_request;
