package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type IncomeHandler struct {
    db *sql.DB
}

func NewIncomeHandler(db *sql.DB) *IncomeHandler {
    return &IncomeHandler{db: db}
}

func (h *IncomeHandler) ListIncome(c *gin.Context) {
    accountID := c.Query("account_id")
    incomeType := c.Query("income_type")

    query := `
        SELECT income_id, account_id, symbol, income_type, amount, 
               payment_date, currency, notes, created_at
        FROM dividends_income WHERE 1=1
    `
    var args []interface{}

    if accountID != "" {
        query += " AND account_id = ?"
        args = append(args, accountID)
    }

    if incomeType != "" {
        query += " AND income_type = ?"
        args = append(args, incomeType)
    }

    query += " ORDER BY payment_date DESC"

    rows, err := h.db.Query(query, args...)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var incomes []models.Income
    for rows.Next() {
        var inc models.Income
        err := rows.Scan(&inc.IncomeID, &inc.AccountID, &inc.Symbol, &inc.IncomeType,
            &inc.Amount, &inc.PaymentDate, &inc.Currency, &inc.Notes, &inc.CreatedAt)
        if err != nil {
            continue
        }
        incomes = append(incomes, inc)
    }

    c.JSON(http.StatusOK, incomes)
}

func (h *IncomeHandler) CreateIncome(c *gin.Context) {
    var inc models.Income
    if err := c.ShouldBindJSON(&inc); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec(`
        INSERT INTO dividends_income (account_id, symbol, income_type, amount, payment_date, currency, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, inc.AccountID, inc.Symbol, inc.IncomeType, inc.Amount, inc.PaymentDate, inc.Currency, inc.Notes)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    id, _ := result.LastInsertId()
    inc.IncomeID = int(id)
    c.JSON(http.StatusCreated, inc)
}

func (h *IncomeHandler) DeleteIncome(c *gin.Context) {
    id := c.Param("id")
    
    _, err := h.db.Exec("DELETE FROM dividends_income WHERE income_id = ?", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Income deleted successfully"})
}
