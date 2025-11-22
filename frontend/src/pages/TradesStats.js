import React from 'react';

function TradesStats({ dashboard }) {
  // Valores por defecto a 0 o 0.00 para evitar campos vacíos
  const openTrades = dashboard?.open_trades ?? 0;
  const openTradesCapital = dashboard?.open_trades_capital ?? 0;
  const openTradesNetPremium = dashboard?.open_trades_net_premium ?? 0;
  const totalTrades = dashboard?.total_trades ?? 0;
  const premiumCollected = dashboard?.premium_collected ?? 0;

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="stats-grid">
      <div className="stat-item">
        <h3>Open Trades</h3>
        <p>{openTrades}</p>
      </div>
      <div className="stat-item">
        <h3>Open Trades Capital</h3>
        <p>{formatCurrency(openTradesCapital)}</p>
      </div>
      <div className="stat-item">
        <h3>Open Trades Net Premium</h3>
        <p>{formatCurrency(openTradesNetPremium)}</p>
      </div>
      <div className="stat-item">
        <h3>Total Trades</h3>
        <p>{totalTrades}</p>
      </div>
      <div className="stat-item">
        <h3>Premium Collected</h3>
        <p>{formatCurrency(premiumCollected)}</p>
      </div>
    </div>
  );
}

export default TradesStats;
