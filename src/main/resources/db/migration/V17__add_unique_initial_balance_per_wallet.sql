CREATE UNIQUE INDEX uq_entry_initial_balance_per_wallet
    ON entry(wallet_id)
    WHERE economic_event = 'INITIAL_BALANCE' AND deleted_at IS NULL;
