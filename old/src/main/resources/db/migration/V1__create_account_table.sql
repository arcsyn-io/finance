-- Table: account
CREATE TABLE account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE CHECK(length(username) >= 3),
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: update updated_at on account
CREATE TRIGGER account_updated_at
AFTER UPDATE ON account
FOR EACH ROW
BEGIN
    UPDATE account SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
