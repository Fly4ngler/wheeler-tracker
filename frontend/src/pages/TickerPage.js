import React, { useState } from 'react';
import { getQuote, getTrades } from '../services/api';

function TickerPage() {
  const [symbol, setSymbol] = useState('');
  const [quote, setQuote] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    try {
      const [quoteRes, tradesRes] = await Promise.all([
        getQuote(symbol.toUpperCase()),
        getTrades({ symbol: symbol.toUpperCase() })
      ]);
      setQuote(quoteRes.data);
      setTrades(tradesRes.data);
    } catch (error) {
      alert('Error fetching ticker data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ticker Analysis</h1>
        <p>Deep dive into performance, trades, and positions for any ticker</p>
      </div>

      <div style={{marginBottom: '30px'}}>
        <form onSubmit={handleSearch} style={{display: 'flex', gap: '12px', maxWidth: '600px'}}>
          <input 
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL, MSFT, TSLA...)"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#1a1d29',
              border: '1px solid #2d3748',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '16px'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {quote && (
        <div className="stat-card" style={{marginBottom: '30px'}}>
          <h2 style={{fontSize: '32px', marginBottom: '10px'}}>{symbol}</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px'}}>
            <div>
              <div style={{color: '#9ca3af', fontSize: '12px'}}>Current Price</div>
              <div style={{fontSize: '24px', fontWeight: '600'}}>${quote.c?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <div style={{color: '#9ca3af', fontSize: '12px'}}>Change</div>
              <div style={{fontSize: '24px', fontWeight: '600', color: quote.d > 0 ? '#10b981' : '#ef4444'}}>
                {quote.d > 0 ? '+' : ''}{quote.d?.toFixed(2) || 'N/A'} ({quote.dp?.toFixed(2) || 'N/A'}%)
              </div>
            </div>
            <div>
              <div style={{color: '#9ca3af', fontSize: '12px'}}>High</div>
              <div style={{fontSize: '24px', fontWeight: '600'}}>${quote.h?.toFixed(2) || 'N/A'}</div>
            </div>
            <div>
              <div style={{color: '#9ca3af', fontSize: '12px'}}>Low</div>
              <div style={{fontSize: '24px', fontWeight: '600'}}>${quote.l?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {trades.length > 0 && (
        <div>
          <h2 style={{marginBottom: '20px'}}>Trades for {symbol}</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Contracts</th>
                  <th>Strike</th>
                  <th>Premium</th>
                  <th>Open Date</th>
                  <th>Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.trade_id}>
                    <td><span className={`badge badge-${trade.trade_type.toLowerCase()}`}>{trade.trade_type}</span></td>
                    <td>{trade.contracts}</td>
                    <td>${trade.strike_price}</td>
                    <td>${trade.premium_per_share}</td>
                    <td>{trade.open_date}</td>
                    <td>{trade.expiration_date}</td>
                    <td><span className={`badge badge-${trade.status.toLowerCase()}`}>{trade.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!quote && !loading && (
        <div style={{textAlign: 'center', padding: '60px', color: '#9ca3af'}}>
          <div style={{fontSize: '48px', marginBottom: '20px'}}></div>
          <h3>Search for a ticker to view analytics</h3>
          <p>Enter a stock symbol above to see real-time data and trade history</p>
        </div>
      )}
    </div>
  );
}

export default TickerPage;
