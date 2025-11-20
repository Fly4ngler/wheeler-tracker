package main

import (
    "context"
    "flag"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/wheel-tracker/backend/internal/database"
    "github.com/wheel-tracker/backend/internal/handlers"
    "github.com/wheel-tracker/backend/internal/services"
    "go.uber.org/zap"
)

func main() {
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    dsn := flag.String("dsn", "file:/data/trades.db", "The data source name")
    port := flag.String("port", ":8080", "The server port")
    flag.Parse()

    db, err := database.NewDB(*dsn)
    if err != nil {
        logger.Fatal("failed to initialize database", zap.Error(err))
    }
    defer db.Close()

    // Inicializar servicios
    tradeService := services.NewTradeService(db)

    // Inicializar handlers
    tradeHandler := handlers.NewTradeHandler(db.DB)
    tradeImportHandler := handlers.NewTradeImportHandler(tradeService)
    accountHandler := handlers.NewAccountHandler(db.DB)
    positionHandler := handlers.NewPositionHandler(db.DB)
    incomeHandler := handlers.NewIncomeHandler(db.DB)
    wheelHandler := handlers.NewWheelHandler(db.DB)
    apiHandler := handlers.NewAPIHandler(db.DB)
    apiConfigHandler := handlers.NewAPIConfigHandler(db.DB)

    router := gin.Default()

    // CORS Configuration
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

    // Health check endpoint
    router.GET("/api/v1/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status":    "ok",
            "timestamp": time.Now().Unix(),
        })
    })

    // API v1 routes
    v1 := router.Group("/api/v1")
    {
        // ==================== TRADES ====================
        v1.GET("/trades", tradeHandler.ListTrades)
        v1.GET("/trades/:id", tradeHandler.GetTrade)
        v1.POST("/trades", tradeHandler.CreateTrade)
        v1.PUT("/trades/:id", tradeHandler.UpdateTrade)
        v1.DELETE("/trades/:id", tradeHandler.DeleteTrade)
        v1.POST("/trades/:id/close", tradeHandler.CloseTrade)
        v1.POST("/trades/import", tradeImportHandler.Import)
        v1.POST("/trades/validate", tradeImportHandler.ValidateCSV)
        v1.POST("/trades/confirm", tradeImportHandler.ConfirmImport)

        // ==================== ACCOUNTS ====================
        v1.GET("/accounts", accountHandler.ListAccounts)
        v1.GET("/accounts/all", accountHandler.ListAllAccounts) // Nuevo endpoint listado todas cuentas
        v1.GET("/accounts/:id", accountHandler.GetAccount)
        v1.POST("/accounts", accountHandler.CreateAccount)
        v1.PUT("/accounts/:id", accountHandler.UpdateAccount)
        v1.DELETE("/accounts/:id", accountHandler.DeleteAccount)
        v1.POST("/accounts/:id/deposit", accountHandler.Deposit)
        v1.POST("/accounts/:id/withdrawal", accountHandler.Withdrawal)
        v1.GET("/accounts/:id/transactions", accountHandler.GetTransactionHistory)
        v1.POST("/accounts/activate", accountHandler.ActivateAccount)

        // ==================== POSITIONS ====================
        v1.GET("/positions", positionHandler.ListPositions)
        v1.GET("/positions/:id", positionHandler.GetPosition)
        v1.POST("/positions", positionHandler.CreatePosition)
        v1.PUT("/positions/:id", positionHandler.UpdatePosition)
        v1.DELETE("/positions/:id", positionHandler.DeletePosition)
        v1.POST("/positions/:id/close", positionHandler.ClosePosition)

        // ==================== INCOME ====================
        v1.GET("/income", incomeHandler.ListIncome)
        v1.POST("/income", incomeHandler.CreateIncome)
        v1.DELETE("/income/:id", incomeHandler.DeleteIncome)

        // ==================== WHEELS ====================
        v1.GET("/wheels", wheelHandler.ListWheels)
        v1.GET("/wheels/:id", wheelHandler.GetWheel)
        v1.POST("/wheels", wheelHandler.CreateWheel)
        v1.PUT("/wheels/:id", wheelHandler.UpdateWheel)

        // ==================== ANALYTICS ====================
        v1.GET("/trades/dashboard", tradeHandler.GetDashboard)
        // v1.GET("/trades/performance", tradeHandler.GetPerformance) // Comentado temporalmente para evitar error

        // ==================== EXTERNAL APIs ====================
        v1.GET("/quote/:symbol", apiHandler.GetQuote)
        v1.GET("/search/:query", apiHandler.SearchSymbol)
        v1.GET("/exchange-rate", apiHandler.GetExchangeRate)

        // ==================== API CONFIGURATION ====================
        v1.GET("/apis", apiConfigHandler.ListConfigs)
        v1.GET("/apis/:provider", apiConfigHandler.GetConfig)
        v1.POST("/apis/:provider", apiConfigHandler.CreateOrUpdateConfig)
        v1.DELETE("/apis/:provider", apiConfigHandler.DeleteConfig)
        v1.GET("/apis/:provider/test", apiConfigHandler.TestConfig)
    }

    srv := &http.Server{
        Addr:    *port,
        Handler: router,
    }

    // Graceful shutdown
    go func() {
        sigint := make(chan os.Signal, 1)
        signal.Notify(sigint, syscall.SIGINT, syscall.SIGTERM)
        <-sigint

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        if err := srv.Shutdown(ctx); err != nil {
            logger.Error("server forced to shutdown", zap.Error(err))
        }
    }()

    logger.Info(fmt.Sprintf("Starting server on %s", *port))
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        logger.Fatal("listen error", zap.Error(err))
    }
}
