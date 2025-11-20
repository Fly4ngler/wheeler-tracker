ALTER TABLE accounts ADD COLUMN account_type TEXT DEFAULT 'cash';
ALTER TABLE accounts ADD COLUMN margin_multiplier REAL DEFAULT 1.0;
