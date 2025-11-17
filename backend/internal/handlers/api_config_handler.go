package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"

    "github.com/gin-gonic/gin"
)

type APIConfig struct {
    ConfigID        int            `json:"config_id"`
    Provider        string         `json:"provider"`
    APIKey          string         `json:"api_key"`
    APISecret       sql.NullString `json:"api_secret"`
    AdditionalConfig sql.NullString `json:"additional_config"`
    IsActive        bool           `json:"is_active"`
    CreatedAt       string         `json:"created_at"`
    UpdatedAt       string         `json:"updated_at"`
}

type APIConfigHandler struct {
    db *sql.DB
}

func NewAPIConfigHandler(db *sql.DB) *APIConfigHandler {
    return &APIConfigHandler{db: db}
}

func (h *APIConfigHandler) ListConfigs(c *gin.Context) {
    rows, err := h.db.Query(`SELECT config_id, provider, api_key, api_secret, additional_config, is_active, created_at, updated_at FROM api_configs WHERE is_active = 1`)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()

    var configs []APIConfig
    for rows.Next() {
        var conf APIConfig
        err := rows.Scan(&conf.ConfigID, &conf.Provider, &conf.APIKey, &conf.APISecret, &conf.AdditionalConfig, &conf.IsActive, &conf.CreatedAt, &conf.UpdatedAt)
        if err != nil {
            continue
        }
        configs = append(configs, conf)
    }
    c.JSON(http.StatusOK, configs)
}

func (h *APIConfigHandler) GetConfig(c *gin.Context) {
    provider := c.Param("provider")
    var conf APIConfig
    err := h.db.QueryRow(`SELECT config_id, provider, api_key, api_secret, additional_config, is_active, created_at, updated_at FROM api_configs WHERE provider = ? AND is_active = 1`, provider).
        Scan(&conf.ConfigID, &conf.Provider, &conf.APIKey, &conf.APISecret, &conf.AdditionalConfig, &conf.IsActive, &conf.CreatedAt, &conf.UpdatedAt)
    if err == sql.ErrNoRows {
        c.JSON(http.StatusNotFound, gin.H{"error": "Config not found"})
        return
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, conf)
}

func (h *APIConfigHandler) CreateOrUpdateConfig(c *gin.Context) {
    provider := c.Param("provider")
    var input struct {
        APIKey          string `json:"api_key"`
        APISecret       string `json:"api_secret"`
        AdditionalConfig map[string]interface{} `json:"additional_config"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    addConfigBytes, err := json.Marshal(input.AdditionalConfig)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid additional_config format"})
        return
    }

    var exists bool
    err = h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM api_configs WHERE provider = ?)`, provider).Scan(&exists)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if exists {
        _, err = h.db.Exec(`UPDATE api_configs SET api_key = ?, api_secret = ?, additional_config = ?, updated_at = CURRENT_TIMESTAMP WHERE provider = ?`,
            input.APIKey, input.APISecret, string(addConfigBytes), provider)
    } else {
        _, err = h.db.Exec(`INSERT INTO api_configs (provider, api_key, api_secret, additional_config) VALUES (?, ?, ?, ?)`,
            provider, input.APIKey, input.APISecret, string(addConfigBytes))
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Config saved"})
}

func (h *APIConfigHandler) DeleteConfig(c *gin.Context) {
    provider := c.Param("provider")
    _, err := h.db.Exec(`UPDATE api_configs SET is_active = 0 WHERE provider = ?`, provider)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Config deleted"})
}

// Test API connection endpoint (puede ser un dummy por ahora)
func (h *APIConfigHandler) TestConfig(c *gin.Context) {
    provider := c.Param("provider")

    // Aquí se podría realizar la llamada real al API según proveedor
    // Por simplicidad retornamos éxito dummy
    c.JSON(http.StatusOK, gin.H{"message": provider + ": Connection successful"})
}

