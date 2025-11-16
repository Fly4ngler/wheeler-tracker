package models

import "time"

// Account represents a trading account
type Account struct {
    AccountID      int       `json:"account_id"`
    Name           string    `json:"name"`
    Broker         string    `json:"broker"`
    Currency       string    `json:"currency"`
    InitialBalance float64   `json:"initial_balance"`
    CurrentBalance float64   `json:"current_balance"`
    IsActive       bool      `json:"is_active"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
}

// Trade represents an options trade
type Trade struct {
    TradeID         int        `json:"trade_id"`
    AccountID       int        `json:"account_id"`
    Symbol          string     `json:"symbol"`
    TradeType       string     `json:"trade_type"`
    Contracts       int        `json:"contracts"`
    StrikePrice     float64    `json:"strike_price"`
    PremiumPerShare float64    `json:"premium_per_share"`
    OpenDate        string     `json:"open_date"`
    ExpirationDate  string     `json:"expiration_date"`
    CloseDate       *string    `json:"close_date,omitempty"`
    CloseMethod     *string    `json:"close_method,omitempty"`
    ClosePrice      *float64   `json:"close_price,omitempty"`
    Fees            float64    `json:"fees"`
    Status          string     `json:"status"`
    Tags            *string    `json:"tags,omitempty"`
    Notes           *string    `json:"notes,omitempty"`
    WheelID         *int       `json:"wheel_id,omitempty"`
    CreatedAt       time.Time  `json:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at"`
}

// Position represents a stock position
type Position struct {
    PositionID        int       `json:"position_id"`
    AccountID         int       `json:"account_id"`
    Symbol            string    `json:"symbol"`
    Shares            int       `json:"shares"`
    CostBasisPerShare float64   `json:"cost_basis_per_share"`
    AcquiredDate      string    `json:"acquired_date"`
    SoldDate          *string   `json:"sold_date,omitempty"`
    SoldPricePerShare *float64  `json:"sold_price_per_share,omitempty"`
    Status            string    `json:"status"`
    IsCovered         bool      `json:"is_covered"`
    WheelID           *int      `json:"wheel_id,omitempty"`
    Notes             *string   `json:"notes,omitempty"`
    CreatedAt         time.Time `json:"created_at"`
    UpdatedAt         time.Time `json:"updated_at"`
}

// Wheel represents a complete wheel strategy cycle
type Wheel struct {
    WheelID      int       `json:"wheel_id"`
    AccountID    int       `json:"account_id"`
    Symbol       string    `json:"symbol"`
    StartDate    string    `json:"start_date"`
    EndDate      *string   `json:"end_date,omitempty"`
    Status       string    `json:"status"`
    CurrentPhase *string   `json:"current_phase,omitempty"`
    TotalPremium float64   `json:"total_premium"`
    TotalPnL     float64   `json:"total_pnl"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

// Income represents dividends and other income
type Income struct {
    IncomeID    int       `json:"income_id"`
    AccountID   int       `json:"account_id"`
    Symbol      *string   `json:"symbol,omitempty"`
    IncomeType  string    `json:"income_type"`
    Amount      float64   `json:"amount"`
    PaymentDate string    `json:"payment_date"`
    Currency    string    `json:"currency"`
    Notes       *string   `json:"notes,omitempty"`
    CreatedAt   time.Time `json:"created_at"`
}

// Dashboard represents analytics dashboard data
type Dashboard struct {
    TotalTrades         int     `json:"total_trades"`
    OpenTrades          int     `json:"open_trades"`
    ClosedTrades        int     `json:"closed_trades"`
    WinRate             float64 `json:"win_rate"`
    TotalNetPremiums    float64 `json:"total_net_premiums"`
    OpenPositionsPL     float64 `json:"open_positions_pl"`
    ClosedPositionsPL   float64 `json:"closed_positions_pl"`
    TotalPL             float64 `json:"total_pl"`
    OpenTradesCapital   float64 `json:"open_trades_capital"`
    TotalCapital        float64 `json:"total_capital"`
    AverageYield        float64 `json:"average_yield"`
}
