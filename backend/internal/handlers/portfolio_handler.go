package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
)

type PortfolioHandler struct {
    db *sql.DB
}

func NewPortfolioHandler(db *sql.DB) *PortfolioHandler {
    return &PortfolioHandler{db: db}
}

type PortfolioItem struct {
    Symbol      string   `json:"symbol"`
    TotalShares int      `json:"total_shares"`
    Accounts    []int    `json:"accounts"`
}

func (h *PortfolioHandler) ListPortfolio(c *gin.Context) {
    rows, err := h.db.Query(`
        SELECT symbol, account_id, SUM(shares) as total_shares
        FROM positions
        WHERE shares > 0 AND status = 'OPEN'
        GROUP BY symbol, account_id
        ORDER BY symbol
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    portfolioMap := make(map[string]*PortfolioItem)

    for rows.Next() {
        var symbol string
        var accountID int
        var shares int
        err := rows.Scan(&symbol, &accountID, &shares)
        if err != nil {
            continue
        }

        item, exists := portfolioMap[symbol]
        if !exists {
            item = &PortfolioItem{
                Symbol:      symbol,
                TotalShares: 0,
                Accounts:    []int{},
            }
            portfolioMap[symbol] = item
        }
        item.TotalShares += shares
        item.Accounts = append(item.Accounts, accountID)
    }

    var portfolio []PortfolioItem
    for _, item := range portfolioMap {
        portfolio = append(portfolio, *item)
    }

    c.JSON(http.StatusOK, portfolio)
}
