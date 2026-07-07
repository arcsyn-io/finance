CREATE TABLE cash_flow_config (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_month      TEXT    NOT NULL,
  opening_balance      INTEGER NOT NULL,
  minimum_cash         INTEGER NOT NULL,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX ux_cash_flow_config_month ON cash_flow_config(reference_month);
