package database

import (
    "database/sql"
    "log"
    "os"

    _ "github.com/mattn/go-sqlite3"
)

// InitDB initializes the SQLite database
func InitDB(dbPath string) (*sql.DB, error) {
    // Open database connection
    db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
    if err != nil {
        return nil, err
    }

    // Test connection
    if err := db.Ping(); err != nil {
        return nil, err
    }

    // Initialize schema if database is new
    if err := initSchema(db); err != nil {
        return nil, err
    }

    log.Println("Database initialized successfully")
    return db, nil
}

// initSchema initializes the database schema
func initSchema(db *sql.DB) error {
    // Read schema file
    schemaPath := "/data/init_schema.sql"
    
    // Check if database already has tables
    var tableCount int
    err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").Scan(&tableCount)
    if err != nil {
        return err
    }

    // Skip if tables already exist
    if tableCount > 0 {
        log.Println("Database schema already exists, skipping initialization")
        return nil
    }

    // Read and execute schema
    schema, err := os.ReadFile(schemaPath)
    if err != nil {
        log.Printf("Warning: Could not read schema file: %v", err)
        // Create basic schema inline if file not found
        return createBasicSchema(db)
    }

    _, err = db.Exec(string(schema))
    if err != nil {
        return err
    }

    log.Println("Database schema created successfully")
    return nil
}

// createBasicSchema creates a minimal schema if init_schema.sql is not found
func createBasicSchema(db *sql.DB) error {
    schema := `
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

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
        FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    );

    INSERT INTO accounts (name, broker, currency, initial_balance, current_balance) 
    VALUES ('Default Portfolio', 'Interactive Brokers', 'USD', 10000.00, 10000.00);
    `

    _, err := db.Exec(schema)
    return err
}
