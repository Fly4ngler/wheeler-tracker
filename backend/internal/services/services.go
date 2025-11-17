package services

import (
"fmt"
"log"

"github.com/wheel-tracker/backend/internal/database"
"github.com/wheel-tracker/backend/internal/models"
)

type TradeService struct {
db *database.DB
}

func NewTradeService(db *database.DB) *TradeService {
return &TradeService{
db: db,
}
}

// Métodos de ejemplo (ORIGINALES - PRESERVADOS)
func (s *TradeService) GetTrades() ([]map[string]interface{}, error) {
// Implementación básica
return []map[string]interface{}{}, nil
}

func (s *TradeService) CreateTrade(trade map[string]interface{}) error {
// Implementación básica
return nil
}

// ============== NUEVOS MÉTODOS PARA IMPORTACIÓN ==============

// SaveTrade guarda un trade individual en la BD
func (s *TradeService) SaveTrade(trade models.Trade) error {
result, err := s.db.Exec(`
INSERT INTO trades (
account_id, symbol, trade_type, contracts, strike_price,
premium_per_share, open_date, expiration_date, close_date,
close_method, close_price, fees, status, tags, notes, wheel_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
trade.AccountID, trade.Symbol, trade.TradeType, trade.Contracts,
trade.StrikePrice, trade.PremiumPerShare, trade.OpenDate,
trade.ExpirationDate, trade.CloseDate, trade.CloseMethod,
trade.ClosePrice, trade.Fees, trade.Status, trade.Tags,
trade.Notes, trade.WheelID,
)

if err != nil {
log.Printf("Error saving trade: %v", err)
return err
}

id, _ := result.LastInsertId()
trade.TradeID = int(id)
return nil
}

// SaveTradesTransaction guarda múltiples trades en una transacción
// Si falla uno, revierte todos
func (s *TradeService) SaveTradesTransaction(trades []models.Trade) (int, []string, error) {
// Iniciar transacción
tx, err := s.db.Begin()
if err != nil {
return 0, nil, fmt.Errorf("failed to begin transaction: %v", err)
}

var importedCount int
var errors []string

for i, trade := range trades {
// Validar que account_id existe
var accountExists bool
err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM accounts WHERE account_id = ? AND is_active = 1)", trade.AccountID).Scan(&accountExists)
if err != nil || !accountExists {
errors = append(errors, fmt.Sprintf("Trade %d: Account ID %d not found or inactive", i+1, trade.AccountID))
continue
}

// Insertar trade
result, err := tx.Exec(`
INSERT INTO trades (
account_id, symbol, trade_type, contracts, strike_price,
premium_per_share, open_date, expiration_date, close_date,
close_method, close_price, fees, status, tags, notes, wheel_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
trade.AccountID, trade.Symbol, trade.TradeType, trade.Contracts,
trade.StrikePrice, trade.PremiumPerShare, trade.OpenDate,
trade.ExpirationDate, trade.CloseDate, trade.CloseMethod,
trade.ClosePrice, trade.Fees, trade.Status, trade.Tags,
trade.Notes, trade.WheelID,
)

if err != nil {
errors = append(errors, fmt.Sprintf("Trade %d (%s): %v", i+1, trade.Symbol, err))
continue
}

importedCount++
id, _ := result.LastInsertId()
trades[i].TradeID = int(id)
}

// Si hubo errores, revertir transacción
if len(errors) > 0 {
tx.Rollback()
return importedCount, errors, fmt.Errorf("transaction rolled back due to errors")
}

// Confirmar transacción
if err := tx.Commit(); err != nil {
return 0, nil, fmt.Errorf("failed to commit transaction: %v", err)
}

return importedCount, errors, nil
}

// ValidateTradeData valida que los datos del trade sean válidos
func (s *TradeService) ValidateTradeData(trade models.Trade) error {
if trade.Symbol == "" {
return fmt.Errorf("symbol is required")
}
if trade.TradeType == "" {
return fmt.Errorf("trade_type is required")
}
if trade.AccountID <= 0 {
return fmt.Errorf("account_id is required and must be positive")
}
if trade.Contracts <= 0 {
return fmt.Errorf("contracts must be positive")
}
if trade.StrikePrice < 0 {
return fmt.Errorf("strike_price cannot be negative")
}
if trade.PremiumPerShare < 0 {
return fmt.Errorf("premium_per_share cannot be negative")
}
if trade.OpenDate == "" {
return fmt.Errorf("open_date is required")
}
if trade.ExpirationDate == "" {
return fmt.Errorf("expiration_date is required")
}
return nil
}

// GetTradesSummary obtiene resumen de trades por cuenta
func (s *TradeService) GetTradesSummary(accountID int) (map[string]interface{}, error) {
summary := make(map[string]interface{})

// Total trades
var totalTrades int
s.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ?", accountID).Scan(&totalTrades)
summary["total_trades"] = totalTrades

// Open trades
var openTrades int
s.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ? AND status = 'OPEN'", accountID).Scan(&openTrades)
summary["open_trades"] = openTrades

// Total premium
var totalPremium float64
s.db.QueryRow(`
SELECT COALESCE(SUM((premium_per_share * contracts * 100) - fees), 0)
FROM trades WHERE account_id = ? AND status = 'CLOSED'
`, accountID).Scan(&totalPremium)
summary["total_premium"] = totalPremium

return summary, nil
}
