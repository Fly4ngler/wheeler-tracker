package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
)

type AccountHandler struct {
    db *sql.DB
}

func NewAccountHandler(db *sql.DB) *AccountHandler {
    return &AccountHandler{db: db}
}

func (h *AccountHandler) ListAccounts(c *gin.Context) {
    rows, err := h.db.Query(`
        SELECT account_id, name, broker, currency, initial_balance, 
               current_balance, is_active, created_at, updated_at 
        FROM accounts WHERE is_active = 1
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var accounts []models.Account
    for rows.Next() {
        var acc models.Account
        err := rows.Scan(&acc.AccountID, &acc.Name, &acc.Broker, &acc.Currency,
            &acc.InitialBalance, &acc.CurrentBalance, &acc.IsActive,
            &acc.CreatedAt, &acc.UpdatedAt)
        if err != nil {
            continue
        }
        accounts = append(accounts, acc)
    }

    c.JSON(http.StatusOK, accounts)
}

func (h *AccountHandler) GetAccount(c *gin.Context) {
    id := c.Param("id")
    
    var acc models.Account
    err := h.db.QueryRow(`
        SELECT account_id, name, broker, currency, initial_balance, 
               current_balance, is_active, created_at, updated_at 
        FROM accounts WHERE account_id = ?
    `, id).Scan(&acc.AccountID, &acc.Name, &acc.Broker, &acc.Currency,
        &acc.InitialBalance, &acc.CurrentBalance, &acc.IsActive,
        &acc.CreatedAt, &acc.UpdatedAt)
    
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, acc)
}

func (h *AccountHandler) CreateAccount(c *gin.Context) {
    var acc models.Account
    if err := c.ShouldBindJSON(&acc); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    result, err := h.db.Exec(`
        INSERT INTO accounts (name, broker, currency, initial_balance, current_balance)
        VALUES (?, ?, ?, ?, ?)
    `, acc.Name, acc.Broker, acc.Currency, acc.InitialBalance, acc.CurrentBalance)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    id, _ := result.LastInsertId()
    acc.AccountID = int(id)
    c.JSON(http.StatusCreated, acc)
}

func (h *AccountHandler) UpdateAccount(c *gin.Context) {
    id := c.Param("id")
    var acc models.Account
    
    if err := c.ShouldBindJSON(&acc); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    _, err := h.db.Exec(`
        UPDATE accounts 
        SET name = ?, broker = ?, currency = ?, current_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = ?
    `, acc.Name, acc.Broker, acc.Currency, acc.CurrentBalance, id)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Account updated successfully"})
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
    id := c.Param("id")
    
    _, err := h.db.Exec("UPDATE accounts SET is_active = 0 WHERE account_id = ?", id)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}
