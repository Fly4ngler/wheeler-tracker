import React, { useState, useEffect } from 'react';
import { getWheels } from '../services/api';

function WheelsPage() {
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWheels = async () => {
    try {
      const res = await getWheels({ status: 'ACTIVE' });
      setWheels(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setWheels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWheels();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Options Wheels</h1>
        <p>Track your complete wheel strategy cycles across all positions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Open Wheels</div>
          <div className="stat-value">{wheels.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Premium Collected</div>
          <div className="stat-value positive">
            ${wheels.reduce((sum, w) => sum + (w.total_premium || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gap: '20px', marginTop: '30px'}}>
        {wheels.length === 0 ? (
          <div style={{textAlign: 'center', padding: '60px', color: '#9ca3af'}}>
            <div style={{fontSize: '48px', marginBottom: '20px'}}></div>
            <h3>No active wheels yet</h3>
            <p>Wheels are automatically created when you start a CSP trade.</p>
          </div>
        ) : (
          wheels.map((wheel) => (
            <div key={wheel.wheel_id} className="stat-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px'}}>
                <div>
                  <h3 style={{fontSize: '24px', marginBottom: '5px'}}>{wheel.symbol}</h3>
                  <div style={{color: '#9ca3af', fontSize: '14px'}}>Started {wheel.start_date}</div>
                </div>
                <span className={`badge badge-${wheel.current_phase?.toLowerCase() || 'csp'}`}>
                  {wheel.current_phase || 'CSP'}
                </span>
              </div>

              <div style={{display: 'flex', gap: '40px', marginBottom: '15px'}}>
                <div>
                  <div style={{color: '#9ca3af', fontSize: '12px', marginBottom: '4px'}}>Net Premiums</div>
                  <div style={{fontSize: '18px', fontWeight: '600', color: '#10b981'}}>
                    ${(wheel.total_premium || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{color: '#9ca3af', fontSize: '12px', marginBottom: '4px'}}>Duration</div>
                  <div style={{fontSize: '18px', fontWeight: '600'}}>
                    {Math.floor((new Date() - new Date(wheel.start_date)) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>

              <div style={{padding: '15px', background: '#0f1117', borderRadius: '8px'}}>
                <div style={{fontSize: '12px', color: '#9ca3af', marginBottom: '10px'}}>Cycle Progress</div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <div style={{padding: '8px 12px', background: '#7c2d12', color: '#fdba74', borderRadius: '6px', fontSize: '12px'}}>
                    CSP
                  </div>
                  <div style={{color: '#9ca3af'}}></div>
                  <div style={{padding: '8px 12px', background: '#2d3748', color: '#9ca3af', borderRadius: '6px', fontSize: '12px'}}>
                    HOLDING
                  </div>
                  <div style={{color: '#9ca3af'}}></div>
                  <div style={{padding: '8px 12px', background: '#2d3748', color: '#9ca3af', borderRadius: '6px', fontSize: '12px'}}>
                    CC
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WheelsPage;
