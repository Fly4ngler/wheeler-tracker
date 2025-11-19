import React, { useState, useEffect, useContext } from 'react';
import { getPositions } from '../services/api';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function PositionsPage() {
  const { activeAccountId, loadingActiveAccount } = useContext(ActiveAccountContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPositions = async () => {
    try {
      const res = await getPositions({ status: 'OPEN', account_id: activeAccountId });
      setPositions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAccountId && !loadingActiveAccount) {
      loadPositions();
    }
  }, [activeAccountId, loadingActiveAccount]);

  const safePositions = Array.isArray(positions) ? positions : [];
  const totalPositions = safePositions.length;
  const totalShares = safePositions.reduce((sum, p) => sum + p.shares, 0);
  const totalCapital = safePositions.reduce((sum, p) => sum + p.shares * p.cost_basis_per_share, 0);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Positions</h1>
        <p>Track your stock holdings from the options wheel</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Positions</div>
          <div className="stat-value">{totalPositions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Shares</div>
          <div className="stat-value">{totalShares}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Capital</div>
          <div className="stat-value">${totalCapital.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open P/L</div>
          <div className="stat-value positive">$0.00</div>
        </div>
      </div>

      <div style={{marginBottom: '20px'}}>
        <button className="btn btn-primary">Add Position</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Cost Basis</th>
              <th>Market Value</th>
              <th>Acquired Date</th>
              <th>Coverage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safePositions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#9ca3af'}}>
                  No open positions. Positions are created when CSP trades are assigned.
                </td>
              </tr>
            ) : (
              safePositions.map((pos) => (
                <tr key={pos.position_id}>
                  <td><strong>{pos.symbol}</strong></td>
                  <td>{pos.shares}</td>
                  <td>${pos.cost_basis_per_share}</td>
                  <td>${(pos.shares * pos.cost_basis_per_share).toFixed(2)}</td>
                  <td>{pos.acquired_date}</td>
                  <td>
                    <span className={`badge ${pos.is_covered ? 'badge-closed' : 'badge-open'}`}>
                      {pos.is_covered ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button className="btn">Close</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PositionsPage;
