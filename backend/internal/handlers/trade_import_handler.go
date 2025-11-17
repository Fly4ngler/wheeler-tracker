package handlers

import (
"encoding/csv"
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

// Validate headers
expectedHeaders := []string{"symbol", "trade_type", "contracts", "strike_price", "premium_per_share", "open_date", "expiration_date", "close_date", "close_price", "fees"}
if len(headers) < len(expectedHeaders) {
c.JSON(http.StatusBadRequest, gin.H{"error": "CSV headers mismatch"})
return
}

var imported []models.Trade
var errors []string
lineNum := 1

for {
lineNum++
record, err := reader.Read()
if err == io.EOF {
break
}

if err != nil {
errors = append(errors, "Line "+strconv.Itoa(lineNum)+": "+err.Error())
continue
}

trade, err := parseTradeRecord(record)
if err != nil {
errors = append(errors, "Line "+strconv.Itoa(lineNum)+": "+err.Error())
continue
}

// TODO: Save trade to database via service
// err = h.TradeService.SaveTrade(trade)
// if err != nil {
// errors = append(errors, "Line "+strconv.Itoa(lineNum)+": failed saving - "+err.Error())
// continue
// }

imported = append(imported, trade)
}

c.JSON(http.StatusOK, gin.H{
"imported_count": len(imported),
"errors":         errors,
})
}

func parseTradeRecord(record []string) (models.Trade, error) {
var trade models.Trade

trade.Symbol = record[0]
trade.TradeType = record[1]

contracts, err := strconv.Atoi(record[2])
if err != nil {
return trade, err
}
trade.Contracts = contracts

strikePrice, err := strconv.ParseFloat(record[3], 64)
if err != nil {
return trade, err
}
trade.StrikePrice = strikePrice

premiumPerShare, err := strconv.ParseFloat(record[4], 64)
if err != nil {
return trade, err
}
trade.PremiumPerShare = premiumPerShare

trade.OpenDate = record[5]
trade.ExpirationDate = record[6]

if len(record) > 7 && record[7] != "" {
trade.CloseDate = &record[7]
}

if len(record) > 8 && record[8] != "" {
closePrice, err := strconv.ParseFloat(record[8], 64)
if err == nil {
trade.ClosePrice = &closePrice
}
}

if len(record) > 9 && record[9] != "" {
fees, err := strconv.ParseFloat(record[9], 64)
if err == nil {
trade.Fees = fees
}
}

trade.Status = "OPEN"
trade.CreatedAt = time.Now()
trade.UpdatedAt = time.Now()

return trade, nil
}
