package handlers

import (
    "bytes"
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type TradeHandler struct {
    db *sql.DB
}

func NewTradeHandler(db *sql.DB) *TradeHandler {
    return &TradeHandler{db: db}
}

// Obtener ID cuenta activa
func (h *TradeHandler) getActiveAccountID() (int, error) {
    var accountID int
    err := h.db.QueryRow("SELECT account_id FROM accounts WHERE is_active = 1 LIMIT 1").Scan(&accountID)
    if err != nil {
        return 0, err
    }
    return accountID, nil
}

func (h *TradeHandler) ListTrades(c *gin.Context) {
    status := c.DefaultQuery("status", "OPEN")
    accountID := c.Query("account_id")

    if accountID == "" {
        activeID, err := h.getActiveAccountID()
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "No active account found"})
            return
        }
        accountID = fmt.Sprintf("%d", activeID)
    }

    query := `
        SELECT trade_id, account_id, symbol, trade_type, contracts, strike_price,
               premium_per_share, open_date, expiration_date, close_date, close_method,
               close_price, fees, status, tags, notes, wheel_id, created_at, updated_at
        FROM trades WHERE status = ?
    `
    args := []interface{}{status}

    if accountID != "" {
        query += " AND account_id = ?"
        args = append(args, accountID)
    }

    query += " ORDER BY expiration_date DESC"

    rows, err := h.db.Query(query, args...)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var trades []models.Trade
    for rows.Next() {
        var t models.Trade
        err := rows.Scan(&t.TradeID, &t.AccountID, &t.Symbol, &t.TradeType, &t.Contracts,
            &t.StrikePrice, &t.PremiumPerShare, &t.OpenDate, &t.ExpirationDate,
            &t.CloseDate, &t.CloseMethod, &t.ClosePrice, &t.Fees, &t.Status,
            &t.Tags, &t.Notes, &t.WheelID, &t.CreatedAt, &t.UpdatedAt)
        if err != nil {
            continue
        }
        trades = append(trades, t)
    }

    c.JSON(http.StatusOK, trades)
}

func (h *TradeHandler) GetTrade(c *gin.Context) {
    id := c.Param("id")

    var t models.Trade
    err := h.db.QueryRow(`
        SELECT trade_id, account_id, symbol, trade_type, contracts, strike_price,
               premium_per_share, open_date, expiration_date, close_date, close_method,
               close_price, fees, status, tags, notes, wheel_id, created_at, updated_at
        FROM trades WHERE trade_id = ?
    `, id).Scan(&t.TradeID, &t.AccountID, &t.Symbol, &t.TradeType, &t.Contracts,
        &t.StrikePrice, &t.PremiumPerShare, &t.OpenDate, &t.ExpirationDate,
        &t.CloseDate, &t.CloseMethod, &t.ClosePrice, &t.Fees, &t.Status,
        &t.Tags, &t.Notes, &t.WheelID, &t.CreatedAt, &t.UpdatedAt)

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Trade not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, t)
}

func (h *TradeHandler) CreateTrade(c *gin.Context) {
    var t models.Trade

    bodyBytes, err := c.GetRawData()
    if err == nil {
        log.Printf("Received trade create payload (raw): %s\n", string(bodyBytes))
        c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
    }

    if err := c.ShouldBindJSON(&t); err != nil {
        log.Printf("Binding JSON error: %v\n", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Validaciones explícitas
    if t.Symbol == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Symbol is required and must be non-empty"})
        return
    }
    for _, r := range t.Symbol {
        if r < 'A' || r > 'Z' {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Symbol must contain only uppercase letters (A-Z)"})
            return
        }
    }
    if t.Contracts <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Contracts must be a positive integer"})
        return
    }
    if t.StrikePrice <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Strike price must be positive"})
        return
    }
    if t.PremiumPerShare < 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Premium per share must be zero or positive"})
        return
    }
    if t.OpenDate == "" || t.ExpirationDate == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Open date and expiration date are required"})
        return
    }
    if t.ExpirationDate < t.OpenDate {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Expiration date must be equal or after open date"})
        return
    }

    if t.AccountID == 0 {
        activeID, err := h.getActiveAccountID()
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "No active account found"})
            return
        }
        t.AccountID = activeID
    }

    var isActive int
    err = h.db.QueryRow("SELECT is_active FROM accounts WHERE account_id = ?", t.AccountID).Scan(&isActive)
    if err == sql.ErrNoRows || isActive != 1 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Associated account does not exist or is not active"})
        return
    } else if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec(`
        INSERT INTO trades (account_id, symbol, trade_type, contracts, strike_price,
                           premium_per_share, open_date, expiration_date, fees, status, tags, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
    `, t.AccountID, t.Symbol, t.TradeType, t.Contracts, t.StrikePrice,
        t.PremiumPerShare, t.OpenDate, t.ExpirationDate, t.Fees, t.Tags, t.Notes)

    if err != nil {
        log.Printf("DB insert error: %v\n", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    id, _ := result.LastInsertId()
    t.TradeID = int(id)
    c.JSON(http.StatusCreated, t)
}

func (h *TradeHandler) UpdateTrade(c *gin.Context) {
    id := c.Param("id")
    var t models.Trade

    if err := c.ShouldBindJSON(&t); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE trades
        SET symbol = ?, trade_type = ?, contracts = ?, strike_price = ?,
            premium_per_share = ?, fees = ?, tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE trade_id = ?
    `, t.Symbol, t.TradeType, t.Contracts, t.StrikePrice,
        t.PremiumPerShare, t.Fees, t.Tags, t.Notes, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Trade updated successfully"})
}

func (h *TradeHandler) CloseTrade(c *gin.Context) {
    id := c.Param("id")

    var req struct {
        CloseDate   string  `json:"close_date" binding:"required"`
        CloseMethod string  `json:"close_method" binding:"required"`
        ClosePrice  float64 `json:"close_price"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE trades
        SET close_date = ?, close_method = ?, close_price = ?, status = 'CLOSED', updated_at = CURRENT_TIMESTAMP
        WHERE trade_id = ?
    `, req.CloseDate, req.CloseMethod, req.ClosePrice, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Trade closed successfully"})
}

func (h *TradeHandler) DeleteTrade(c *gin.Context) {
    id := c.Param("id")

    _, err := h.db.Exec("DELETE FROM trades WHERE trade_id = ?", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Trade deleted successfully"})
}

func (h *TradeHandler) GetDashboard(c *gin.Context) {
    var dashboard models.Dashboard

    h.db.QueryRow("SELECT COUNT(*) FROM trades").Scan(&dashboard.TotalTrades)
    h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE status = 'OPEN'").Scan(&dashboard.OpenTrades)
    h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE status = 'CLOSED'").Scan(&dashboard.ClosedTrades)

    h.db.QueryRow(`
        SELECT COALESCE(SUM((premium_per_share * contracts * 100) - fees), 0)
        FROM trades WHERE status = 'OPEN'
    `).Scan(&dashboard.OpenTradesNetPremium)

    h.db.QueryRow(`
        SELECT COALESCE(SUM((premium_per_share * contracts * 100) - (close_price * contracts * 100) - fees), 0)
        FROM trades WHERE status = 'CLOSED'
    `).Scan(&dashboard.PremiumCollected)

    if dashboard.TotalTrades > 0 {
        dashboard.WinRate = float64(dashboard.ClosedTrades) / float64(dashboard.TotalTrades) * 100
    }

    c.JSON(http.StatusOK, dashboard)
}

func (h *TradeHandler) GetPerformance(c *gin.Context) {
    rows, err := h.db.Query(`
        SELECT symbol, COUNT(*) as trades,
               SUM((premium_per_share * contracts * 100) - fees) as total_premium
        FROM trades
        WHERE status = 'CLOSED'
        GROUP BY symbol
        ORDER BY total_premium DESC
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var performance []map[string]interface{}
    for rows.Next() {
        var symbol string
        var trades int
        var totalPremium float64
        rows.Scan(&symbol, &trades, &totalPremium)
        performance = append(performance, map[string]interface{}{
            "symbol":        symbol,
            "trades":        trades,
            "total_premium": totalPremium,
        })
    }

    c.JSON(http.StatusOK, performance)
}
