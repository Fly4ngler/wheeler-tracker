package main

import (
    "context"
    "flag"
    "fmt"
    "log"
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

    dsn := flag.String("dsn", "file:shared/wheel.db", "The data source name")
    port := flag.String("port", "8080", "The server port")
    flag.Parse()

    db, err := database.NewDB(*dsn)
    if err != nil {
        logger.Fatal("failed to initialize database", zap.Error(err))
    }

    tradeService := services.NewTradeService(db)
    tradeImportHandler := handlers.NewTradeImportHandler(tradeService)

    router := gin.Default()
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type"},
        AllowCredentials: true,
    }))

    apiV1 := router.Group("/api/v1")
    {
        // Aquí van las rutas existentes...

        apiV1.POST("/trades/import", tradeImportHandler.ImportCSV)
    }

    srv := &http.Server{
        Addr:    fmt.Sprintf(":%s", *port),
        Handler: router,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            logger.Fatal("listen: %s\n", zap.Error(err))
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    logger.Info("shutdown server ...")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := srv.Shutdown(ctx); err != nil {
        logger.Fatal("server shutdown", zap.Error(err))
    }
    logger.Info("server exiting")
}
