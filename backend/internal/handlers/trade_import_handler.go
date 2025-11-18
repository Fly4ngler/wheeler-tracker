package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wheel-tracker/backend/internal/models"
	"github.com/wheel-tracker/backend/internal/services"
)

type TradeImportHandler struct {
	TradeService *services.TradeService
}

func NewTradeImportHandler(tradeService *services.TradeService) *TradeImportHandler {
	return &TradeImportHandler{TradeService: tradeService}
}

// Import maneja la importación de trades desde CSV
func (h *TradeImportHandler) Import(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get file"})
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read CSV headers"})
		return
	}

	requiredHeaders := []string{"account_id", "symbol", "trade_type", "contracts", "strike_price", "premium_per_share", "open_date", "expiration_date"}
	if !validateHeaders(headers, requiredHeaders) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("CSV headers mismatch. Required: %v", requiredHeaders),
		})
		return
	}

	var trades []models.Trade
	var parseErrors []string
	lineNum := 1

	for {
		lineNum++
		record, err := reader.Read()
		if err == io.EOF {
			break
		}

		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: %v", lineNum, err))
			continue
		}

		trade, err := h.parseTradeRecord(record, headers)
		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: %v", lineNum, err))
			continue
		}

		// Lógica para marcar trades abiertos según expiration_date y close fields
		expired, err := isExpired(trade.ExpirationDate)
		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: invalid expiration_date: %v", lineNum, err))
			continue
		}

		// Si no está expirado y no tiene close_date ni close_price, status Open
		if !expired && (trade.CloseDate == nil || *trade.CloseDate == "") && trade.ClosePrice == nil {
			trade.Status = "OPEN"
		} else if expired && (trade.CloseDate == nil || *trade.CloseDate == "") {
			// Si expiró pero no tiene close_date, marcar status Expired
			trade.Status = "Expired"
		}

		// Auto-set close_method a BTC si close_price existe pero no close_method
		if trade.ClosePrice != nil && (trade.CloseMethod == nil || *trade.CloseMethod == "") {
			defaultClose := "BTC"
			trade.CloseMethod = &defaultClose
		}

		trades = append(trades, trade)
	}

	if len(trades) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":        "No valid trades found in CSV",
			"parse_errors": parseErrors,
		})
		return
	}

	importedCount, transactionErrors, err := h.TradeService.SaveTradesTransaction(trades)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message":            err.Error(),
			"imported_count":     importedCount,
			"transaction_errors": transactionErrors,
			"parse_errors":       parseErrors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Trades imported successfully",
		"imported_count":     importedCount,
		"total_attempted":    len(trades),
		"transaction_errors": transactionErrors,
		"parse_errors":       parseErrors,
	})
}

func isExpired(expirationDate string) (bool, error) {
	expDate, err := time.Parse("2006-01-02", expirationDate)
	if err != nil {
		return false, err
	}
	return expDate.Before(time.Now()), nil
}

func validateHeaders(headers []string, required []string) bool {
	headerMap := make(map[string]bool)
	for _, h := range headers {
		headerMap[h] = true
	}

	for _, req := range required {
		if !headerMap[req] {
			return false
		}
	}
	return true
}

func (h *TradeImportHandler) parseTradeRecord(record []string, headers []string) (models.Trade, error) {
	var trade models.Trade
	trade.Status = "OPEN"
	trade.CreatedAt = time.Now()
	trade.UpdatedAt = time.Now()

	headerMap := make(map[string]int)
	for i, header := range headers {
		headerMap[header] = i
	}

	// parse account_id (obligatorio)
	if idx, ok := headerMap["account_id"]; ok && idx < len(record) {
		accountID, err := strconv.Atoi(record[idx])
		if err != nil {
			return trade, fmt.Errorf("invalid account_id: %v", err)
		}
		trade.AccountID = accountID
	} else {
		return trade, fmt.Errorf("account_id column not found")
	}

	// parse symbol (obligatorio)
	if idx, ok := headerMap["symbol"]; ok && idx < len(record) {
		trade.Symbol = record[idx]
		if trade.Symbol == "" {
			return trade, fmt.Errorf("symbol cannot be empty")
		}
	} else {
		return trade, fmt.Errorf("symbol column not found")
	}

	// parse trade_type (obligatorio)
	if idx, ok := headerMap["trade_type"]; ok && idx < len(record) {
		trade.TradeType = record[idx]
		if trade.TradeType == "" {
			return trade, fmt.Errorf("trade_type cannot be empty")
		}
	} else {
		return trade, fmt.Errorf("trade_type column not found")
	}

	// parse contracts (obligatorio)
	if idx, ok := headerMap["contracts"]; ok && idx < len(record) {
		contracts, err := strconv.Atoi(record[idx])
		if err != nil {
			return trade, fmt.Errorf("invalid contracts: %v", err)
		}
		trade.Contracts = contracts
	} else {
		return trade, fmt.Errorf("contracts column not found")
	}

	// parse strike_price (obligatorio)
	if idx, ok := headerMap["strike_price"]; ok && idx < len(record) {
		strikePrice, err := strconv.ParseFloat(record[idx], 64)
		if err != nil {
			return trade, fmt.Errorf("invalid strike_price: %v", err)
		}
		trade.StrikePrice = strikePrice
	} else {
		return trade, fmt.Errorf("strike_price column not found")
	}

	// parse premium_per_share (obligatorio)
	if idx, ok := headerMap["premium_per_share"]; ok && idx < len(record) {
		premium, err := strconv.ParseFloat(record[idx], 64)
		if err != nil {
			return trade, fmt.Errorf("invalid premium_per_share: %v", err)
		}
		trade.PremiumPerShare = premium
	} else {
		return trade, fmt.Errorf("premium_per_share column not found")
	}

	// parse open_date (obligatorio)
	if idx, ok := headerMap["open_date"]; ok && idx < len(record) {
		trade.OpenDate = record[idx]
		if trade.OpenDate == "" {
			return trade, fmt.Errorf("open_date cannot be empty")
		}
	} else {
		return trade, fmt.Errorf("open_date column not found")
	}

	// parse expiration_date (obligatorio)
	if idx, ok := headerMap["expiration_date"]; ok && idx < len(record) {
		trade.ExpirationDate = record[idx]
		if trade.ExpirationDate == "" {
			return trade, fmt.Errorf("expiration_date cannot be empty")
		}
	} else {
		return trade, fmt.Errorf("expiration_date column not found")
	}

	// campos opcionales
	if idx, ok := headerMap["close_date"]; ok && idx < len(record) && record[idx] != "" {
		trade.CloseDate = &record[idx]
	}

	if idx, ok := headerMap["close_method"]; ok && idx < len(record) && record[idx] != "" {
		trade.CloseMethod = &record[idx]
	}

	if idx, ok := headerMap["close_price"]; ok && idx < len(record) && record[idx] != "" {
		closePrice, err := strconv.ParseFloat(record[idx], 64)
		if err == nil {
			trade.ClosePrice = &closePrice
		}
	}

	if idx, ok := headerMap["fees"]; ok && idx < len(record) && record[idx] != "" {
		fees, err := strconv.ParseFloat(record[idx], 64)
		if err == nil {
			trade.Fees = fees
		}
	}

	if idx, ok := headerMap["tags"]; ok && idx < len(record) && record[idx] != "" {
		trade.Tags = &record[idx]
	}

	if idx, ok := headerMap["notes"]; ok && idx < len(record) && record[idx] != "" {
		trade.Notes = &record[idx]
	}

	return trade, nil
}

// ValidateCSV parsea el CSV para retorno de validación sin guardar
func (h *TradeImportHandler) ValidateCSV(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get file"})
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true

	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read CSV headers"})
		return
	}

	requiredHeaders := []string{"account_id", "symbol", "trade_type", "contracts", "strike_price", "premium_per_share", "open_date", "expiration_date"}
	if !validateHeaders(headers, requiredHeaders) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("CSV headers mismatch. Required: %v", requiredHeaders),
		})
		return
	}

	type ValidationResult struct {
		LineNum       int          `json:"line_num"`
		Trade         models.Trade `json:"trade"`
		PL            *float64     `json:"pl"`
		MissingFields []string     `json:"missing_fields"`
		IsValid       bool         `json:"is_valid"`
	}

	var results []ValidationResult
	var parseErrors []string
	lineNum := 1

	for {
		lineNum++
		record, err := reader.Read()
		if err == io.EOF {
			break
		}

		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: %v", lineNum, err))
			continue
		}

		trade, err := h.parseTradeRecord(record, headers)
		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: %v", lineNum, err))
			continue
		}

		expired, err := isExpired(trade.ExpirationDate)
		if err != nil {
			parseErrors = append(parseErrors, fmt.Sprintf("Line %d: invalid expiration_date: %v", lineNum, err))
			continue
		}

		// Lógica para status
		if !expired && (trade.CloseDate == nil || *trade.CloseDate == "") && trade.ClosePrice == nil {
			trade.Status = "OPEN"
		} else if expired && (trade.CloseDate == nil || *trade.CloseDate == "") {
			trade.Status = "Expired"
		}

		// Auto-set close_method si close_price existe
		if trade.ClosePrice != nil && (trade.CloseMethod == nil || *trade.CloseMethod == "") {
			defaultClose := "BTC"
			trade.CloseMethod = &defaultClose
		}

		// Calcular P/L según tipo de trade
		var pl *float64
		if trade.ClosePrice != nil {
			plValue := calculateProfitLoss(trade)
			pl = &plValue
		}

		var missingFields []string
		if trade.CloseDate == nil || *trade.CloseDate == "" {
			missingFields = append(missingFields, "close_date")
		}
		if trade.ClosePrice == nil {
			missingFields = append(missingFields, "close_price")
		}
		if trade.CloseMethod == nil || *trade.CloseMethod == "" {
			missingFields = append(missingFields, "close_method")
		}

		isValid := len(missingFields) == 0

		results = append(results, ValidationResult{
			LineNum:       lineNum,
			Trade:         trade,
			PL:            pl,
			MissingFields: missingFields,
			IsValid:       isValid,
		})
	}

	if len(results) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":        "No valid trades found in CSV",
			"parse_errors": parseErrors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_records": len(results),
		"parse_errors":  parseErrors,
		"results":       results,
	})
}

func calculateProfitLoss(trade models.Trade) float64 {
	// Para opciones PUT y CALL, considerar contracts en el cálculo
	switch trade.TradeType {
	case "PUT", "CALL":
		return (trade.PremiumPerShare - *trade.ClosePrice) * float64(trade.Contracts)
	default:
		// Para otros tipos, calculo simple
		return trade.PremiumPerShare - *trade.ClosePrice
	}
}

// ConfirmImport guarda los trades confirmados en base de datos
func (h *TradeImportHandler) ConfirmImport(c *gin.Context) {
	var req struct {
		Trades []models.Trade `json:"trades" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Trades) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No trades provided"})
		return
	}

	importedCount, transactionErrors, err := h.TradeService.SaveTradesTransaction(req.Trades)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message":            err.Error(),
			"imported_count":     importedCount,
			"transaction_errors": transactionErrors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Trades imported successfully",
		"imported_count":     importedCount,
		"total_attempted":    len(req.Trades),
		"transaction_errors": transactionErrors,
	})
}
