package handlers

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
)

type APIHandler struct {
    db *sql.DB
}

func NewAPIHandler(db *sql.DB) *APIHandler {
    return &APIHandler{db: db}
}

// getAPIKey obtiene la API key para un provider desde la BD
func (h *APIHandler) getAPIKey(provider string) (string, error) {
    var apiKey string
    err := h.db.QueryRow("SELECT api_key FROM api_configs WHERE provider = ? AND is_active = 1", provider).Scan(&apiKey)
    return apiKey, err
}

// GetQuote obtiene cotización desde Finnhub
func (h *APIHandler) GetQuote(c *gin.Context) {
    symbol := c.Param("symbol")

    apiKey, err := h.getAPIKey("FINNHUB")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "FINNHUB API key not configured"})
        return
    }

    url := fmt.Sprintf("https://finnhub.io/api/v1/quote?symbol=%s&token=%s", symbol, apiKey)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Get(url)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch quote"})
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var quote map[string]interface{}
    json.Unmarshal(body, &quote)

    c.JSON(http.StatusOK, quote)
}

// SearchSymbol busca símbolos en Finnhub
func (h *APIHandler) SearchSymbol(c *gin.Context) {
    query := c.Param("query")

    apiKey, err := h.getAPIKey("FINNHUB")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "FINNHUB API key not configured"})
        return
    }

    url := fmt.Sprintf("https://finnhub.io/api/v1/search?q=%s&token=%s", query, apiKey)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Get(url)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search symbol"})
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var results map[string]interface{}
    json.Unmarshal(body, &results)

    c.JSON(http.StatusOK, results)
}

// GetExchangeRate obtiene tasa de cambio desde CurrencyFreaks
func (h *APIHandler) GetExchangeRate(c *gin.Context) {
    fromCurrency := c.Query("from")
    toCurrency := c.Query("to")

    if fromCurrency == "" || toCurrency == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "from and to currencies required"})
        return
    }

    apiKey, err := h.getAPIKey("CURRENCYFREAKS")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "CURRENCYFREAKS API key not configured"})
        return
    }

    url := fmt.Sprintf("https://api.currencyfreaks.com/latest?apikey=%s&base=%s&symbols=%s", apiKey, fromCurrency, toCurrency)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Get(url)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exchange rate"})
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var rate map[string]interface{}
    json.Unmarshal(body, &rate)

    c.JSON(http.StatusOK, rate)
}

