import React, { useState, useEffect, useContext } from 'react';
import { getWheels } from '../services/api';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function WheelsPage() {
  const { activeAccountId, loadingActiveAccount } = useContext(ActiveAccountContext);
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWheels = async () => {
    try {
      const res = await getWheels({ status: 'ACTIVE', account_id: activeAccountId });
      setWheels(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setWheels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAccountId && !loadingActiveAccount) {
      loadWheels();
    }
  }, [activeAccountId, loadingActiveAccount]);

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
            <h3>No active wheels yet</h3>
            <p>Wheels are automatically created when you start a CSP trade.</p>
          </div>
        ) : (
          wheels.map((wheel) => (
            <div key={wheel.wheel_id} className="stat-card">
              {/* wheel details here */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px'}}>
                <div>
                  <h3 style={{fontSize: '24px', marginBottom: '5px'}}>{wheel.symbol}</h3>
                  <div style={{color: '#9ca3af', fontSize: '14px'}}>Started {wheel.start_date}</div>
                </div>
                <span className={`badge badge-${wheel.current_phase?.toLowerCase() || 'csp'}`}>
                  {wheel.current_phase || 'CSP'}
                </span>
              </div>
              {/* cycle progress omitted for brevity */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WheelsPage;
