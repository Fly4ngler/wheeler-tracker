(import React, { useState, useEffect } from 'react';
import '../styles/TableStyles.css';

function TradesTable({ trades, loading, onEdit, onClose, onDelete }) {
  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(new Date());
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="loading">Loading trades...</div>;
  }

  if (!trades || trades.length === 0) {
    return <div>No trades available.</div>;
  }

  const getCurrencySymbol = (symbol) => {
    const euroTickers = ['EUR', 'EURO', 'EUN'];
    if (euroTickers.includes(symbol)) {
      return '€';
    }
    return '$';
  };

  const formatCurrency = (value, symbol) => {
    if (typeof value !== 'number') return '-';
    const currencySymbol = getCurrencySymbol(symbol);
    return currencySymbol + value.toFixed(2);
  };

  const tradeTypeShort = (type) => {
    switch (type) {
      case 'CSP':
        return 'CSP';
      case 'CC':
        return 'CC';
      default:
        return type;
    }
  };

  const calculateDTE = (expirationDate) => {
    if (!expirationDate) return '-';
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const calculate21DTE = (openDate, dte) => {
    if (dte <= 21 || !openDate) return '-';
    const open = new Date(openDate);
    open.setDate(open.getDate() + 21);
    return open.toLocaleDateString();
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Type</th>
            <th>Contracts</th>
            <th>Strike price</th>
            <th>Premium</th>
            <th>Delta</th>
            <th>Open date</th>
            <th>Exp. date</th>
            <th>21DTE</th>
            <th>DTE</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const dte = calculateDTE(trade.expiration_date);
            const dte21 = calculate21DTE(trade.open_date, dte);
            return (
              <tr key={trade.trade_id}>
                <td>{trade.symbol}</td>
                <td>{tradeTypeShort(trade.trade_type)}</td>
                <td>{trade.contracts}</td>
                <td>{formatCurrency(trade.strike_price, trade.symbol)}</td>
                <td>{formatCurrency(trade.premium_per_share, trade.symbol)}</td>
                <td>{trade.delta !== undefined && trade.delta !== null ? trade.delta.toFixed(3) : '-'}</td>
                <td>{new Date(trade.open_date).toLocaleDateString()}</td>
                <td>{trade.expiration_date ? new Date(trade.expiration_date).toLocaleDateString() : 'N/A'}</td>
                <td>{dte21}</td>
                <td>{dte}</td>
                <td>
                  <button className="btn btn-edit" onClick={() => onEdit(trade)}>Edit</button>
                  <button className="btn btn-close" onClick={() => onClose(trade)}>Close</button>
                  <button className="btn btn-delete" onClick={() => onDelete(trade.trade_id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TradesTable;
)
