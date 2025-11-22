package handlers

import (
    "bytes"
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type TradeHandler struct {
    db *sql.DB
}

func NewTradeHandler(db *sql.DB) *TradeHandler {
    return &TradeHandler{db: db}
}

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
               premium_per_share, delta, open_date, expiration_date, close_date, close_method,
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
            &t.StrikePrice, &t.PremiumPerShare, &t.Delta, &t.OpenDate, &t.ExpirationDate,
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
               premium_per_share, delta, open_date, expiration_date, close_date, close_method,
               close_price, fees, status, tags, notes, wheel_id, created_at, updated_at
        FROM trades WHERE trade_id = ?
    `, id).Scan(&t.TradeID, &t.AccountID, &t.Symbol, &t.TradeType, &t.Contracts,
        &t.StrikePrice, &t.PremiumPerShare, &t.Delta, &t.OpenDate, &t.ExpirationDate,
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
    if err != nil || isActive != 1 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Associated account does not exist or is not active"})
        return
    }
    result, err := h.db.Exec("INSERT INTO trades (account_id, symbol, trade_type, contracts, strike_price, premium_per_share, delta, open_date, expiration_date, fees, status, tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)",
        t.AccountID, t.Symbol, t.TradeType, t.Contracts, t.StrikePrice, t.PremiumPerShare, t.Delta, t.OpenDate, t.ExpirationDate, t.Fees, t.Tags, t.Notes)
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
        c.JSON(http.StatusBadRequest, gin.H{"error": err})
        return
    }
    _, err := h.db.Exec("UPDATE trades SET symbol = ?, trade_type = ?, contracts = ?, strike_price = ?, premium_per_share = ?, delta = ?, fees = ?, tags = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE trade_id = ?",
        t.Symbol, t.TradeType, t.Contracts, t.StrikePrice, t.PremiumPerShare, t.Delta, t.Fees, t.Tags, t.Notes, id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Trade updated"})
}

func (h *TradeHandler) DeleteTrade(c *gin.Context) {
    id := c.Param("id")
    result, err := h.db.Exec("DELETE FROM trades WHERE trade_id = ?", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if rowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Trade not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Trade deleted"})
}

func (h *TradeHandler) CloseTrade(c *gin.Context) {
    id := c.Param("id")
    var payload struct {
        CloseDate   string  "json:\"close_date\""
        CloseMethod string  "json:\"close_method\""
        ClosePrice  float64 "json:\"close_price\""
        Fees        float64 "json:\"fees\""
        Notes       string  "json:\"notes\""
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec("UPDATE trades SET close_date = ?, close_method = ?, close_price = ?, fees = ?, status = 'CLOSED', notes = ? WHERE trade_id = ? AND status = 'OPEN'",
        payload.CloseDate, payload.CloseMethod, payload.ClosePrice, payload.Fees, payload.Notes, id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if rowsAffected == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Trade not found or already closed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Trade closed"})
}

func (h *TradeHandler) BuyStocks(c *gin.Context) {
    var payload struct {
        TradeID int     "json:\"trade_id\""
        Shares  int     "json:\"shares\""
        Price   float64 "json:\"price\""
        Date    string  "json:\"date\""
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "BuyStocks method is a stub, implement as needed"})
}

func (h *TradeHandler) SellStocks(c *gin.Context) {
    var payload struct {
        TradeID int     "json:\"trade_id\""
        Shares  int     "json:\"shares\""
        Price   float64 "json:\"price\""
        Date    string  "json:\"date\""
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "SellStocks method is a stub, implement as needed"})
}

func (h *TradeHandler) GetDashboard(c *gin.Context) {
    var dashboard models.Dashboard

    accountIDStr := c.Query("account_id")
    if accountIDStr == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "account_id is required"})
        return
    }

    accountID, err := strconv.Atoi(accountIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account_id"})
        return
    }

    err = h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ?", accountID).Scan(&dashboard.TotalTrades)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    err = h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ? AND status = 'OPEN'", accountID).Scan(&dashboard.OpenTrades)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    err = h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ? AND status = 'CLOSED'", accountID).Scan(&dashboard.ClosedTrades)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var wins int
    err = h.db.QueryRow("SELECT COUNT(*) FROM trades WHERE account_id = ? AND status = 'CLOSED' AND close_price > strike_price", accountID).Scan(&wins)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if dashboard.ClosedTrades > 0 {
        dashboard.WinRate = float64(wins) / float64(dashboard.ClosedTrades)
    }

    err = h.db.QueryRow("SELECT IFNULL(SUM(premium_per_share * contracts), 0) FROM trades WHERE account_id = ?", accountID).Scan(&dashboard.TotalNetPremiums)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    err = h.db.QueryRow("SELECT IFNULL(SUM(COALESCE(close_price,0) - strike_price) * contracts, 0) FROM trades WHERE account_id = ? AND status = 'OPEN'", accountID).Scan(&dashboard.OpenPositionsPL)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    err = h.db.QueryRow("SELECT IFNULL(SUM((close_price - strike_price) * contracts), 0) FROM trades WHERE account_id = ? AND status = 'CLOSED'", accountID).Scan(&dashboard.ClosedPositionsPL)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    dashboard.TotalPL = dashboard.OpenPositionsPL + dashboard.ClosedPositionsPL

    err = h.db.QueryRow("SELECT IFNULL(SUM(strike_price * contracts), 0) FROM trades WHERE account_id = ? AND status = 'OPEN'", accountID).Scan(&dashboard.OpenTradesCapital)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    err = h.db.QueryRow("SELECT IFNULL(SUM(strike_price * contracts), 0) FROM trades WHERE account_id = ?", accountID).Scan(&dashboard.TotalCapital)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if dashboard.TotalCapital > 0 {
        dashboard.AverageYield = dashboard.TotalNetPremiums / dashboard.TotalCapital
    }

    err = h.db.QueryRow("SELECT IFNULL(SUM(premium_per_share * contracts), 0) FROM trades WHERE account_id = ? AND status = 'OPEN'", accountID).Scan(&dashboard.OpenTradesNetPremium)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    dashboard.PremiumCollected = dashboard.TotalNetPremiums

    c.JSON(http.StatusOK, dashboard)
}
