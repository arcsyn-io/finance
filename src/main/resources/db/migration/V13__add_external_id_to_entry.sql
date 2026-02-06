-- Adiciona external_id para identificação única de lançamentos importados
ALTER TABLE entry ADD COLUMN external_id TEXT;

-- Índice único composto: external_id deve ser único por carteira (quando preenchido)
CREATE UNIQUE INDEX ix_entry_external_id_wallet ON entry(wallet_id, external_id) WHERE external_id IS NOT NULL;

-- Adiciona external_id na tabela de import_row para armazenar durante revisão
ALTER TABLE import_row ADD COLUMN external_id TEXT;
