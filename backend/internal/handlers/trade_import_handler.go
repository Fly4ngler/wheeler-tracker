package handlers

import (
    "encoding/csv"
    "io"
    "net/http"
    "strconv"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/models"
    "log"
)

type TradeImportHandler struct {
    TradeService *TradeService
}

func NewTradeImportHandler(tradeService *TradeService) *TradeImportHandler {
    return &TradeImportHandler{TradeService: tradeService}
}

func (h *TradeImportHandler) ImportCSV(c *gin.Context) {
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

    expectedHeaders := []string{"symbol", "opened", "closed", "type", "strike", "expiration", "premium", "contracts", "exit_price", "total_commission"}
    for i, h := range expectedHeaders {
        if strings.ToLower(headers[i]) != h {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV header: expected " + h})
            return
        }
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

        err = h.TradeService.SaveTrade(trade)
        if err != nil {
            errors = append(errors, "Line "+strconv.Itoa(lineNum)+": failed saving - "+err.Error())
            continue
        }

        imported = append(imported, trade)
    }

    c.JSON(http.StatusOK, gin.H{
        "imported_count": len(imported),
        "errors": errors,
    })
}

func parseTradeRecord(record []string) (models.Trade, error) {
    var trade models.Trade
    trade.Symbol = record[0]

    var err error
    trade.Opened, err = parseDate(record[1])
    if err != nil {
        return trade, err
    }
    trade.Closed, err = parseDate(record[2])
    if err != nil {
        return trade, err
    }

    trade.Type = record[3]

    trade.Strike, err = strconv.ParseFloat(record[4], 64)
    if err != nil {
        return trade, err
    }
    trade.Expiration, err = parseDate(record[5])
    if err != nil {
        return trade, err
    }
    trade.Premium, err = strconv.ParseFloat(record[6], 64)
    if err != nil {
        return trade, err
    }
    trade.Contracts, err = strconv.Atoi(record[7])
    if err != nil {
        return trade, err
    }
    trade.ExitPrice, err = strconv.ParseFloat(record[8], 64)
    if err != nil && record[8] != "" {
        return trade, err
    }
    trade.TotalCommission, err = strconv.ParseFloat(record[9], 64)
    if err != nil {
        return trade, err
    }

    return trade, nil
}

func parseDate(dateStr string) (time.Time, error) {
    if dateStr == "" {
        return time.Time{}, nil
    }
    return time.Parse("2006-01-02", dateStr)
}
