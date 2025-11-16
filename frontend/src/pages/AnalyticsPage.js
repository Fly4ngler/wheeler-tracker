import React, { useState, useEffect } from 'react';
import { getDashboard, getPerformance } from '../services/api';

function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashRes, perfRes] = await Promise.all([
          getDashboard(),
          getPerformance()
        ]);
        setDashboard(dashRes.data || {});
        setPerformance(Array.isArray(perfRes.data) ? perfRes.data : []);
      } catch (error) {
        setPerformance([]);
        setDashboard({});
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const safePerformance = Array.isArray(performance) ? performance : [];

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Comprehensive performance metrics and wheel cycle tracking</p>
      </div>

      {dashboard && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Trades</div>
              <div className="stat-value">{dashboard.total_trades || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Win %</div>
              <div className="stat-value">{parseFloat(dashboard.win_rate || 0).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Net Premiums</div>
              <div className="stat-value positive">${parseFloat(dashboard.total_net_premiums || 0).toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total P/L</div>
              <div className="stat-value positive">${parseFloat(dashboard.total_pl || 0).toFixed(2)}</div>
            </div>
          </div>

          <div style={{marginTop: '40px'}}>
            <h2 style={{marginBottom: '20px'}}>Symbol Performance Breakdown</h2>
            <div className="stat-card">
              {safePerformance.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#9ca3af'}}>
                  No closed trades yet. Performance data will appear here once you close trades.
                </div>
              ) : (
                safePerformance.map((perf, idx) => (
                  <div key={idx} style={{marginBottom: '20px', paddingBottom: '20px', borderBottom: idx < safePerformance.length - 1 ? '1px solid #2d3748' : 'none'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <div>
                        <strong style={{fontSize: '18px'}}>{perf.symbol}</strong>
                        <span style={{marginLeft: '15px', color: '#9ca3af', fontSize: '14px'}}>
                          {perf.trades} trades
                        </span>
                      </div>
                      <div style={{fontSize: '18px', fontWeight: '600', color: '#10b981'}}>
                        ${(perf.total_premium || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{background: '#3b82f6', height: '8px', borderRadius: '4px', width: '100%'}} />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
