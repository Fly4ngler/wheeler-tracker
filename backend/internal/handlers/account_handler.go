package handlers

import (
    "database/sql"
    "fmt"
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

// Lista todas las cuentas sin filtrar por is_active
func (h *AccountHandler) ListAllAccounts(c *gin.Context) {
    rows, err := h.db.Query(`
        SELECT account_id, name, broker, currency, initial_balance,
               current_balance, is_active, account_type, margin_multiplier, created_at, updated_at
        FROM accounts
        ORDER BY account_id
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
            &acc.AccountType, &acc.MarginMultiplier, &acc.CreatedAt, &acc.UpdatedAt)
        if err != nil {
            continue
        }
        accounts = append(accounts, acc)
    }

    c.JSON(http.StatusOK, accounts)
}

// Lista las cuentas activas
func (h *AccountHandler) ListAccounts(c *gin.Context) {
    rows, err := h.db.Query(`
        SELECT account_id, name, broker, currency, initial_balance,
               current_balance, is_active, account_type, margin_multiplier, created_at, updated_at
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
            &acc.AccountType, &acc.MarginMultiplier, &acc.CreatedAt, &acc.UpdatedAt)
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
               current_balance, is_active, account_type, margin_multiplier, created_at, updated_at
        FROM accounts WHERE account_id = ?
    `, id).Scan(&acc.AccountID, &acc.Name, &acc.Broker, &acc.Currency,
        &acc.InitialBalance, &acc.CurrentBalance, &acc.IsActive,
        &acc.AccountType, &acc.MarginMultiplier, &acc.CreatedAt, &acc.UpdatedAt)

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
        INSERT INTO accounts (name, broker, currency, initial_balance, current_balance, account_type, margin_multiplier)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, acc.Name, acc.Broker, acc.Currency, acc.InitialBalance, acc.CurrentBalance, acc.AccountType, acc.MarginMultiplier)

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
        SET name = ?, broker = ?, currency = ?, current_balance = ?, account_type = ?, margin_multiplier = ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = ?
    `, acc.Name, acc.Broker, acc.Currency, acc.CurrentBalance, acc.AccountType, acc.MarginMultiplier, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Account updated successfully"})
}

func (h *AccountHandler) ActivateAccount(c *gin.Context) {
    var req struct {
        AccountID int `json:"account_id"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    _, err = tx.Exec("UPDATE accounts SET is_active = 0")
    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    res, err := tx.Exec("UPDATE accounts SET is_active = 1 WHERE account_id = ?", req.AccountID)
    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    rowsAffected, err := res.RowsAffected()
    if err != nil || rowsAffected == 0 {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{"error": "Account not found"})
        return
    }

    if err := tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Account activated"})
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
    id := c.Param("id")

    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Elimina los trades relacionados
    _, err = tx.Exec("DELETE FROM trades WHERE account_id = ?", id)
    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Elimina la cuenta
    _, err = tx.Exec("DELETE FROM accounts WHERE account_id = ?", id)
    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if err = tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Account and related trades deleted successfully"})
}

func (h *AccountHandler) Deposit(c *gin.Context) {
    id := c.Param("id")
    var req struct {
        Amount float64 `json:"amount"`
        Notes  string  `json:"notes"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    result, err := tx.Exec(`
        UPDATE accounts
        SET current_balance = current_balance + ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = ? AND is_active = 1
    `, req.Amount, id)

    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        tx.Rollback()
        c.JSON(http.StatusNotFound, gin.H{"error": "Account not found or inactive"})
        return
    }

    _, err = tx.Exec(`
        INSERT INTO account_transactions (account_id, transaction_type, amount, notes)
        VALUES (?, 'DEPOSIT', ?, ?)
    `, id, req.Amount, req.Notes)

    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if err := tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Deposit successful"})
}

func (h *AccountHandler) Withdrawal(c *gin.Context) {
    id := c.Param("id")
    var req struct {
        Amount float64 `json:"amount"`
        Notes  string  `json:"notes"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tx, err := h.db.Begin()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    var currentBalance float64
    err = tx.QueryRow(`
        SELECT current_balance FROM accounts
        WHERE account_id = ? AND is_active = 1
    `, id).Scan(&currentBalance)

    if err == sql.ErrNoRows {
        tx.Rollback()
        c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
        return
    }

    if currentBalance < req.Amount {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient balance. Current: %.2f, Requested: %.2f", currentBalance, req.Amount)})
        return
    }

    result, err := tx.Exec(`
        UPDATE accounts
        SET current_balance = current_balance - ?, updated_at = CURRENT_TIMESTAMP
        WHERE account_id = ? AND is_active = 1
    `, req.Amount, id)

    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        tx.Rollback()
        c.JSON(http.StatusNotFound, gin.H{"error": "Account not found or inactive"})
        return
    }

    _, err = tx.Exec(`
        INSERT INTO account_transactions (account_id, transaction_type, amount, notes)
        VALUES (?, 'WITHDRAWAL', ?, ?)
    `, id, req.Amount, req.Notes)

    if err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if err := tx.Commit(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Withdrawal successful"})
}

func (h *AccountHandler) GetTransactionHistory(c *gin.Context) {
    id := c.Param("id")

    rows, err := h.db.Query(`
        SELECT transaction_id, account_id, transaction_type, amount, transaction_date, notes
        FROM account_transactions
        WHERE account_id = ?
        ORDER BY transaction_date DESC
    `, id)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    type Transaction struct {
        TransactionID   int     `json:"transaction_id"`
        AccountID       int     `json:"account_id"`
        TransactionType string  `json:"transaction_type"`
        Amount          float64 `json:"amount"`
        TransactionDate string  `json:"transaction_date"`
        Notes           string  `json:"notes"`
    }

    var transactions []Transaction
    for rows.Next() {
        var t Transaction
        err := rows.Scan(&t.TransactionID, &t.AccountID, &t.TransactionType, &t.Amount, &t.TransactionDate, &t.Notes)
        if err != nil {
            continue
        }
        transactions = append(transactions, t)
    }

    c.JSON(http.StatusOK, transactions)
}
