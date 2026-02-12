-- Add economic_event column to entry table
ALTER TABLE entry ADD COLUMN economic_event TEXT;

-- Backfill: 1. TRANSFER — entries linked to a transfer
UPDATE entry SET economic_event = 'TRANSFER' WHERE transfer_id IS NOT NULL;

-- Backfill: 2. INVESTMENT — entries in non-CASH wallets (NEGOTIABLE_SECURITY, LONG_TERM, ASSET)
UPDATE entry SET economic_event = 'INVESTMENT'
WHERE economic_event IS NULL
  AND wallet_id IN (SELECT id FROM wallet WHERE type IN ('NEGOTIABLE_SECURITY', 'LONG_TERM', 'ASSET'));

-- Backfill: 3. LIQUIDATION — operational OUT in CASH wallets (spending operational money)
UPDATE entry SET economic_event = 'LIQUIDATION'
WHERE economic_event IS NULL
  AND nature = 'OPERATIONAL'
  AND direction = 'OUT'
  AND wallet_id IN (SELECT id FROM wallet WHERE type = 'CASH');

-- Backfill: 4. CONSUMPTION — remaining OUT entries (patrimonial expenses in CASH = consumo real)
UPDATE entry SET economic_event = 'CONSUMPTION'
WHERE economic_event IS NULL
  AND direction = 'OUT';

-- Backfill: 5. INVESTMENT — remaining IN entries (patrimonial income in CASH)
UPDATE entry SET economic_event = 'INVESTMENT'
WHERE economic_event IS NULL
  AND direction = 'IN';

-- Add CHECK constraint (SQLite enforces CHECK on new rows only, existing data already backfilled)
-- Note: SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we rely on the CHECK being part of future schema
-- For safety, verify no NULLs remain
-- UPDATE entry SET economic_event = 'CONSUMPTION' WHERE economic_event IS NULL;
