import React, { useState, useEffect } from 'react';
import { getTrades, createTrade, closeTrade, getDashboard } from '../services/api';

function AddTradeModal({ isOpen, onClose, onTradeAdded }) {
  const [formData, setFormData] = useState({
    account_id: 1,
    symbol: '',
    trade_type: 'CSP',
    contracts: 1,
    strike_price: '',
    premium_per_share: '',
    open_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    fees: 0.65
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTrade(formData);
      onTradeAdded();
      onClose();
      setFormData({
        account_id: 1,
        symbol: '',
        trade_type: 'CSP',
        contracts: 1,
        strike_price: '',
        premium_per_share: '',
        open_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
        fees: 0.65
      });
    } catch (error) {
      alert('Error creating trade: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add New Trade</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <select value={formData.trade_type} onChange={(e) => setFormData({...formData, trade_type: e.target.value})}>
              <option value="CSP">Cash-Secured Put</option>
              <option value="CC">Covered Call</option>
              <option value="PUT">Put</option>
              <option value="CALL">Call</option>
            </select>
          </div>

          <div className="form-group">
            <label>Stock Symbol</label>
            <input 
              type="text" 
              value={formData.symbol} 
              onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
              placeholder="e.g., AAPL, MSFT, TSLA"
              required
            />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div className="form-group">
              <label>Trade Open Date</label>
              <input 
                type="date" 
                value={formData.open_date} 
                onChange={(e) => setFormData({...formData, open_date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Expiration Date</label>
              <input 
                type="date" 
                value={formData.expiration_date} 
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div className="form-group">
              <label>Number of Contracts</label>
              <input 
                type="number" 
                value={formData.contracts} 
                onChange={(e) => setFormData({...formData, contracts: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Strike Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.strike_price} 
                onChange={(e) => setFormData({...formData, strike_price: e.target.value})}
                placeholder="e.g., 150.00"
                required
              />
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div className="form-group">
              <label>Premium (per share)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.premium_per_share} 
                onChange={(e) => setFormData({...formData, premium_per_share: e.target.value})}
                placeholder="e.g., 2.50"
                required
              />
            </div>

            <div className="form-group">
              <label>Fees ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.fees} 
                onChange={(e) => setFormData({...formData, fees: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Trade</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tradesRes, dashboardRes] = await Promise.all([
        getTrades({ status: 'OPEN' }),
        getDashboard()
      ]);
      setTrades(tradesRes.data);
      setDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCloseTrade = async (tradeId) => {
    const closeDate = prompt('Close date (YYYY-MM-DD):');
    const closeMethod = prompt('Close method (BTC/EXPIRATION/ASSIGNMENT):');
    const closePrice = prompt('Close price (per share):');

    if (!closeDate || !closeMethod) return;

    try {
      await closeTrade(tradeId, {
        close_date: closeDate,
        close_method: closeMethod,
        close_price: parseFloat(closePrice) || 0
      });
      loadData();
    } catch (error) {
      alert('Error closing trade: ' + error.message);
    }
  };

  const calculateNetPremium = (trade) => {
    return ((trade.premium_per_share * trade.contracts * 100) - trade.fees).toFixed(2);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Trades</h1>
        <p>Track your options trades from the wheel strategy</p>
      </div>

      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Open Trades</div>
            <div className="stat-value">{dashboard.open_trades}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">% ITM</div>
            <div className="stat-value">0.0%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Trades Net Premium</div>
            <div className="stat-value positive">${dashboard.total_net_premiums.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Yield</div>
            <div className="stat-value positive">{dashboard.average_yield.toFixed(2)}%</div>
          </div>
        </div>
      )}

      <div style={{marginBottom: '20px'}}>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
           Add New Trade
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Type</th>
              <th>Contracts</th>
              <th>Strike</th>
              <th>Premium</th>
              <th>Open Date</th>
              <th>Expiration</th>
              <th>Net Premium</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#9ca3af'}}>
                  No open trades. Click "Add New Trade" to get started.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.trade_id}>
                  <td><strong>{trade.symbol}</strong></td>
                  <td><span className={`badge badge-${trade.trade_type.toLowerCase()}`}>{trade.trade_type}</span></td>
                  <td>{trade.contracts}</td>
                  <td>${trade.strike_price}</td>
                  <td>${trade.premium_per_share}</td>
                  <td>{trade.open_date}</td>
                  <td>{trade.expiration_date}</td>
                  <td className="positive">${calculateNetPremium(trade)}</td>
                  <td>
                    <button className="btn" onClick={() => handleCloseTrade(trade.trade_id)}>
                      Close
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddTradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onTradeAdded={loadData}
      />
    </div>
  );
}

export default TradesPage;
