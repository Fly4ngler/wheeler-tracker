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

func (h *APIHandler) getAPIKey(provider string) (string, error) {
    var apiKey string
    err := h.db.QueryRow("SELECT api_key FROM api_configs WHERE provider = ? AND is_active = 1", provider).Scan(&apiKey)
    return apiKey, err
}

func (h *APIHandler) GetQuote(c *gin.Context) {
    symbol := c.Param("symbol")
    
    apiKey, err := h.getAPIKey("FINNHUB")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "API key not configured"})
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

func (h *APIHandler) SearchSymbol(c *gin.Context) {
    query := c.Param("query")
    
    apiKey, err := h.getAPIKey("FINNHUB")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "API key not configured"})
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
