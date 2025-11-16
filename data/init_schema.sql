-- Options Wheel Tracker Database Schema
-- Version 1.0

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    broker TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    initial_balance REAL DEFAULT 0.0,
    current_balance REAL DEFAULT 0.0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: trades
CREATE TABLE IF NOT EXISTS trades (
    trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK(trade_type IN ('CSP', 'CC', 'PUT', 'CALL')),
    contracts INTEGER NOT NULL,
    strike_price REAL NOT NULL,
    premium_per_share REAL NOT NULL,
    open_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    close_date DATE,
    close_method TEXT CHECK(close_method IN ('BTC', 'EXPIRATION', 'ASSIGNMENT', NULL)),
    close_price REAL,
    fees REAL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
    tags TEXT,
    notes TEXT,
    wheel_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (wheel_id) REFERENCES wheels(wheel_id) ON DELETE SET NULL
);

-- Table: positions
CREATE TABLE IF NOT EXISTS positions (
    position_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    shares INTEGER NOT NULL,
    cost_basis_per_share REAL NOT NULL,
    acquired_date DATE NOT NULL,
    sold_date DATE,
    sold_price_per_share REAL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
    is_covered INTEGER DEFAULT 0,
    wheel_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (wheel_id) REFERENCES wheels(wheel_id) ON DELETE SET NULL
);

-- Table: wheels
CREATE TABLE IF NOT EXISTS wheels (
    wheel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'CLOSED')),
    current_phase TEXT CHECK(current_phase IN ('CSP', 'HOLDING', 'CC', 'COMPLETED')),
    total_premium REAL DEFAULT 0.0,
    total_pnl REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Table: dividends_income
CREATE TABLE IF NOT EXISTS dividends_income (
    income_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    symbol TEXT,
    income_type TEXT NOT NULL CHECK(income_type IN ('DIVIDEND', 'INTEREST', 'SPLIT', 'OTHER')),
    amount REAL NOT NULL,
    payment_date DATE NOT NULL,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Table: exchange_rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    rate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'CURRENCYFREAKS'
);

-- Table: api_configs
CREATE TABLE IF NOT EXISTS api_configs (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    api_secret TEXT,
    additional_config TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    portfolio_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_expiration ON trades(expiration_date);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_account ON positions(account_id);
CREATE INDEX IF NOT EXISTS idx_wheels_symbol ON wheels(symbol);
CREATE INDEX IF NOT EXISTS idx_wheels_status ON wheels(status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

-- Default data
INSERT INTO accounts (name, broker, currency, initial_balance, current_balance) 
VALUES ('Default Portfolio', 'Interactive Brokers', 'USD', 10000.00, 10000.00);

INSERT INTO api_configs (provider, api_key, is_active) 
VALUES 
    ('FINNHUB', 'your_finnhub_api_key_here', 1),
    ('CURRENCYFREAKS', 'your_currencyfreaks_api_key_here', 1),
    ('INTERACTIVE_BROKERS', 'localhost:4002', 1);
