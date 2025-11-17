package database

import (
"database/sql"
"log"
"os"

_ "github.com/mattn/go-sqlite3"
)

// DB es un wrapper around sql.DB
type DB struct {
*sql.DB
}

// NewDB creates and initializes the SQLite database
func NewDB(dbPath string) (*DB, error) {
// Open database connection
sqlDB, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
if err != nil {
return nil, err
}

// Test connection
if err := sqlDB.Ping(); err != nil {
return nil, err
}

// Initialize schema if database is new
if err := initSchema(sqlDB); err != nil {
return nil, err
}

log.Println("Database initialized successfully")
return &DB{sqlDB}, nil
}

// Close closes the database connection
func (d *DB) Close() error {
if d.DB != nil {
return d.DB.Close()
}
return nil
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

// Read SQL file
schemaSQL, err := os.ReadFile(schemaPath)
if err != nil {
log.Printf("Schema file not found at %s, creating basic schema\n", schemaPath)
// Create basic tables if schema file doesn't exist
return createBasicSchema(db)
}

// Execute schema
if _, err := db.Exec(string(schemaSQL)); err != nil {
return err
}

log.Println("Database schema initialized")
return nil
}

// createBasicSchema creates basic tables if schema file doesn't exist
func createBasicSchema(db *sql.DB) error {
schema := `
CREATE TABLE IF NOT EXISTS accounts (
account_id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
broker TEXT,
currency TEXT,
initial_balance REAL,
current_balance REAL,
is_active BOOLEAN DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
account_id INTEGER NOT NULL,
symbol TEXT NOT NULL,
quantity REAL NOT NULL,
price REAL NOT NULL,
trade_type TEXT,
trade_date DATETIME,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

CREATE TABLE IF NOT EXISTS positions (
position_id INTEGER PRIMARY KEY AUTOINCREMENT,
account_id INTEGER NOT NULL,
symbol TEXT NOT NULL,
quantity REAL,
cost_per_share REAL,
current_price REAL,
is_active BOOLEAN DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);
`

if _, err := db.Exec(schema); err != nil {
return err
}

return nil
}
