package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type PositionHandler struct {
    db *sql.DB
}

func NewPositionHandler(db *sql.DB) *PositionHandler {
    return &PositionHandler{db: db}
}

func (h *PositionHandler) ListPositions(c *gin.Context) {
    status := c.DefaultQuery("status", "OPEN")

    rows, err := h.db.Query(`
        SELECT position_id, account_id, symbol, shares, cost_basis_per_share,
               acquired_date, sold_date, sold_price_per_share, status, is_covered,
               wheel_id, notes, created_at, updated_at
        FROM positions WHERE status = ?
        ORDER BY acquired_date DESC
    `, status)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var positions []models.Position
    for rows.Next() {
        var p models.Position
        err := rows.Scan(&p.PositionID, &p.AccountID, &p.Symbol, &p.Shares,
            &p.CostBasisPerShare, &p.AcquiredDate, &p.SoldDate, &p.SoldPricePerShare,
            &p.Status, &p.IsCovered, &p.WheelID, &p.Notes, &p.CreatedAt, &p.UpdatedAt)
        if err != nil {
            continue
        }
        positions = append(positions, p)
    }

    if positions == nil {
        positions = make([]models.Position, 0)
    }

    c.JSON(http.StatusOK, positions)
}

func (h *PositionHandler) GetPosition(c *gin.Context) {
    id := c.Param("id")

    var p models.Position
    err := h.db.QueryRow(`
        SELECT position_id, account_id, symbol, shares, cost_basis_per_share,
               acquired_date, sold_date, sold_price_per_share, status, is_covered,
               wheel_id, notes, created_at, updated_at
        FROM positions WHERE position_id = ?
    `, id).Scan(&p.PositionID, &p.AccountID, &p.Symbol, &p.Shares,
        &p.CostBasisPerShare, &p.AcquiredDate, &p.SoldDate, &p.SoldPricePerShare,
        &p.Status, &p.IsCovered, &p.WheelID, &p.Notes, &p.CreatedAt, &p.UpdatedAt)

    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, p)
}

func (h *PositionHandler) CreatePosition(c *gin.Context) {
    var p models.Position
    if err := c.ShouldBindJSON(&p); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec(`
        INSERT INTO positions (account_id, symbol, shares, cost_basis_per_share, acquired_date, status, notes)
        VALUES (?, ?, ?, ?, ?, 'OPEN', ?)
    `, p.AccountID, p.Symbol, p.Shares, p.CostBasisPerShare, p.AcquiredDate, p.Notes)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    id, _ := result.LastInsertId()
    p.PositionID = int(id)
    c.JSON(http.StatusCreated, p)
}

func (h *PositionHandler) UpdatePosition(c *gin.Context) {
    id := c.Param("id")
    var p models.Position

    if err := c.ShouldBindJSON(&p); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE positions
        SET shares = ?, cost_basis_per_share = ?, is_covered = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE position_id = ?
    `, p.Shares, p.CostBasisPerShare, p.IsCovered, p.Notes, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Position updated successfully"})
}

func (h *PositionHandler) ClosePosition(c *gin.Context) {
    id := c.Param("id")

    var req struct {
        SoldDate          string  `json:"sold_date" binding:"required"`
        SoldPricePerShare float64 `json:"sold_price_per_share" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE positions
        SET sold_date = ?, sold_price_per_share = ?, status = 'CLOSED', updated_at = CURRENT_TIMESTAMP
        WHERE position_id = ?
    `, req.SoldDate, req.SoldPricePerShare, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Position closed successfully"})
}

func (h *PositionHandler) DeletePosition(c *gin.Context) {
    id := c.Param("id")

    _, err := h.db.Exec("DELETE FROM positions WHERE position_id = ?", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Position deleted successfully"})
}
