package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type WheelHandler struct {
    db *sql.DB
}

func NewWheelHandler(db *sql.DB) *WheelHandler {
    return &WheelHandler{db: db}
}

func (h *WheelHandler) ListWheels(c *gin.Context) {
    status := c.DefaultQuery("status", "ACTIVE")

    rows, err := h.db.Query(`
        SELECT wheel_id, account_id, symbol, start_date, end_date, status,
               current_phase, total_premium, total_pnl, created_at, updated_at
        FROM wheels WHERE status = ?
        ORDER BY start_date DESC
    `, status)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var wheels []models.Wheel
    for rows.Next() {
        var w models.Wheel
        err := rows.Scan(&w.WheelID, &w.AccountID, &w.Symbol, &w.StartDate,
            &w.EndDate, &w.Status, &w.CurrentPhase, &w.TotalPremium,
            &w.TotalPnL, &w.CreatedAt, &w.UpdatedAt)
        if err != nil {
            continue
        }
        wheels = append(wheels, w)
    }

    c.JSON(http.StatusOK, wheels)
}

func (h *WheelHandler) GetWheel(c *gin.Context) {
    id := c.Param("id")
    
    var w models.Wheel
    err := h.db.QueryRow(`
        SELECT wheel_id, account_id, symbol, start_date, end_date, status,
               current_phase, total_premium, total_pnl, created_at, updated_at
        FROM wheels WHERE wheel_id = ?
    `, id).Scan(&w.WheelID, &w.AccountID, &w.Symbol, &w.StartDate,
        &w.EndDate, &w.Status, &w.CurrentPhase, &w.TotalPremium,
        &w.TotalPnL, &w.CreatedAt, &w.UpdatedAt)
    
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Wheel not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Get associated trades
    tradeRows, _ := h.db.Query(`
        SELECT trade_id, symbol, trade_type, contracts, strike_price, premium_per_share,
               open_date, expiration_date, status
        FROM trades WHERE wheel_id = ?
        ORDER BY open_date
    `, id)
    defer tradeRows.Close()

    var trades []map[string]interface{}
    for tradeRows.Next() {
        var tradeID int
        var symbol, tradeType, openDate, expirationDate, status string
        var contracts int
        var strikePrice, premiumPerShare float64
        
        tradeRows.Scan(&tradeID, &symbol, &tradeType, &contracts, &strikePrice,
            &premiumPerShare, &openDate, &expirationDate, &status)
        
        trades = append(trades, map[string]interface{}{
            "trade_id":          tradeID,
            "symbol":            symbol,
            "trade_type":        tradeType,
            "contracts":         contracts,
            "strike_price":      strikePrice,
            "premium_per_share": premiumPerShare,
            "open_date":         openDate,
            "expiration_date":   expirationDate,
            "status":            status,
        })
    }

    // Get associated positions
    posRows, _ := h.db.Query(`
        SELECT position_id, symbol, shares, cost_basis_per_share, acquired_date, status
        FROM positions WHERE wheel_id = ?
    `, id)
    defer posRows.Close()

    var positions []map[string]interface{}
    for posRows.Next() {
        var posID, shares int
        var symbol, acquiredDate, status string
        var costBasis float64
        
        posRows.Scan(&posID, &symbol, &shares, &costBasis, &acquiredDate, &status)
        
        positions = append(positions, map[string]interface{}{
            "position_id":         posID,
            "symbol":              symbol,
            "shares":              shares,
            "cost_basis_per_share": costBasis,
            "acquired_date":       acquiredDate,
            "status":              status,
        })
    }

    response := gin.H{
        "wheel":     w,
        "trades":    trades,
        "positions": positions,
    }

    c.JSON(http.StatusOK, response)
}

func (h *WheelHandler) CreateWheel(c *gin.Context) {
    var w models.Wheel
    if err := c.ShouldBindJSON(&w); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec(`
        INSERT INTO wheels (account_id, symbol, start_date, status, current_phase, total_premium, total_pnl)
        VALUES (?, ?, ?, 'ACTIVE', 'CSP', 0.0, 0.0)
    `, w.AccountID, w.Symbol, w.StartDate)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    id, _ := result.LastInsertId()
    w.WheelID = int(id)
    c.JSON(http.StatusCreated, w)
}

func (h *WheelHandler) UpdateWheel(c *gin.Context) {
    id := c.Param("id")
    var w models.Wheel
    
    if err := c.ShouldBindJSON(&w); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE wheels 
        SET current_phase = ?, total_premium = ?, total_pnl = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE wheel_id = ?
    `, w.CurrentPhase, w.TotalPremium, w.TotalPnL, w.Status, id)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Wheel updated successfully"})
}
