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

tradeService := services.NewTradeService(db)
tradeImportHandler := handlers.NewTradeImportHandler(tradeService)

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

// Health check endpoint (required for Docker healthcheck)
router.GET("/api/v1/health", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{
"status":    "ok",
"timestamp": time.Now().Unix(),
})
})

// API v1 routes
v1 := router.Group("/api/v1")
{
// Trade import route
v1.POST("/trades/import", tradeImportHandler.Import)

// Trade routes - stub implementations
v1.GET("/trades", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"trades": []interface{}{}})
})
v1.POST("/trades", func(c *gin.Context) {
c.JSON(http.StatusCreated, gin.H{"message": "Trade created"})
})
v1.PUT("/trades/:id", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"message": "Trade updated"})
})
v1.DELETE("/trades/:id", func(c *gin.Context) {
c.JSON(http.StatusNoContent, gin.H{})
})

// Account routes - stub implementations
v1.GET("/accounts", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"accounts": []interface{}{}})
})
v1.POST("/accounts", func(c *gin.Context) {
c.JSON(http.StatusCreated, gin.H{"message": "Account created"})
})
v1.PUT("/accounts/:id", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"message": "Account updated"})
})
v1.DELETE("/accounts/:id", func(c *gin.Context) {
c.JSON(http.StatusNoContent, gin.H{})
})

// Position routes - stub implementations
v1.GET("/positions", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"positions": []interface{}{}})
})
v1.POST("/positions", func(c *gin.Context) {
c.JSON(http.StatusCreated, gin.H{"message": "Position created"})
})
v1.PUT("/positions/:id", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"message": "Position updated"})
})
v1.DELETE("/positions/:id", func(c *gin.Context) {
c.JSON(http.StatusNoContent, gin.H{})
})

// Income routes - stub implementations
v1.GET("/income", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"income": []interface{}{}})
})
v1.POST("/income", func(c *gin.Context) {
c.JSON(http.StatusCreated, gin.H{"message": "Income recorded"})
})

// Wheel routes - stub implementations
v1.GET("/wheels", func(c *gin.Context) {
c.JSON(http.StatusOK, gin.H{"wheels": []interface{}{}})
})
v1.POST("/wheels", func(c *gin.Context) {
c.JSON(http.StatusCreated, gin.H{"message": "Wheel created"})
})
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
