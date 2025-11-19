import React, { useState, useEffect, useContext } from 'react';
import { getTrades, getDashboard, createTrade, updateTrade, deleteTrade } from '../services/api';
import CloseTradeModal from './CloseTradeModal';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function AddTradeModal({ isOpen, onClose, onTradeAdded, editingTrade, activeAccount, loadingActiveAccount }) {
  const [formData, setFormData] = useState({
    account_id: activeAccount ? activeAccount.account_id : 1,
    symbol: '',
    trade_type: 'CSP',
    contracts: 1,
    strike_price: '',
    premium_per_share: '',
    open_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    fees: '',
  });

  useEffect(() => {
    if (!editingTrade && isOpen) {
      setFormData({
        account_id: activeAccount ? activeAccount.account_id : 1,
        symbol: '',
        trade_type: 'CSP',
        contracts: 1,
        strike_price: '',
        premium_per_share: '',
        open_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
        fees: '',
      });
    }
  }, [activeAccount, isOpen, editingTrade]);

  useEffect(() => {
    if (editingTrade && isOpen) {
      setFormData({
        account_id: editingTrade.account_id,
        symbol: editingTrade.symbol,
        trade_type: editingTrade.trade_type,
        contracts: editingTrade.contracts,
        strike_price: editingTrade.strike_price.toString(),
        premium_per_share: editingTrade.premium_per_share.toString(),
        open_date: editingTrade.open_date.split('T')[0],
        expiration_date: editingTrade.expiration_date.split('T')[0],
        fees: editingTrade.fees ? editingTrade.fees.toString() : '',
      });
    }
  }, [editingTrade, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        account_id: activeAccount ? activeAccount.account_id : 1,
        strike_price: parseFloat(formData.strike_price),
        premium_per_share: parseFloat(formData.premium_per_share),
        contracts: parseInt(formData.contracts),
        fees: parseFloat(formData.fees) || 0,
      };
      if (editingTrade) {
        await updateTrade(editingTrade.trade_id, payload);
      } else {
        await createTrade(payload);
      }
      onTradeAdded();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      alert('Error al guardar trade: ' + errorMessage);
    }
  };

  if (!isOpen) return null;

  // Componente input fecha con icono común
  const DateInputWithIcon = ({ label, value, onChange, min, max, required }) => (
    <div className="form-group" style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        required={required}
        style={{ fontSize: 13, padding: '8px', width: '100%' }}
      />
      <span style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        fontSize: 22,
        color: '#6b7280'
      }}></span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          <span style={{ fontWeight: 700 }}>{editingTrade ? 'Editar trade' : 'Nuevo trade'}</span>
          <span style={{ marginLeft: 8, color: '#9ca3af', fontWeight: 400 }}>
            {loadingActiveAccount
              ? 'cargando cuenta...'
              : activeAccount && activeAccount.name
                ? `en cuenta ${activeAccount.name}`
                : ''}
          </span>
        </h2>
        <form onSubmit={handleSubmit}>
          <input type="hidden" value={formData.account_id} />
          <div className="form-group">
            <label>Símbolo *</label>
            <input
              type="text"
              required
              placeholder="AAPL"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="form-group">
            <label>Tipo *</label>
            <select
              value={formData.trade_type}
              onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
            >
              <option value="CSP">CSP (Cash Secured Put)</option>
              <option value="CC">CC (Covered Call)</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Contratos *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.contracts}
                onChange={(e) => setFormData({ ...formData, contracts: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Strike *</label>
              <input
                type="number"
                step="0.01"
                placeholder="100.00"
                required
                value={formData.strike_price}
                onChange={(e) => setFormData({ ...formData, strike_price: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Prima por Acción *</label>
            <input
              type="number"
              step="0.01"
              placeholder="1.50"
              required
              value={formData.premium_per_share}
              onChange={(e) => setFormData({ ...formData, premium_per_share: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <DateInputWithIcon
              label="Fecha Apertura *"
              value={formData.open_date}
              onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
              required
            />
            <DateInputWithIcon
              label="Fecha Expiración *"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Comisiones</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.65"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editingTrade ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TradesPage() {
  const { activeAccount, loadingActiveAccount } = useContext(ActiveAccountContext);
  const [trades, setTrades] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (loadingActiveAccount) return;
    try {
      setLoading(true);
      const [tradesRes, dashboardRes] = await Promise.all([
        getTrades({ status: 'OPEN', account_id: activeAccount ? activeAccount.account_id : 1 }),
        getDashboard(activeAccount ? activeAccount.account_id : 1)
      ]);
      setTrades(tradesRes.data || []);
      setDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAccount, loadingActiveAccount]);

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const handleClose = (trade) => {
    setSelectedTrade(trade);
    setCloseModalOpen(true);
  };

  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm('¿Eliminar este trade?')) return;
    try {
      await deleteTrade(tradeId);
      loadData();
    } catch (error) {
      alert('Error eliminando trade: ' + error.message);
    }
  };

  const calculateDTE = (expirationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Trades</h1>
        <p>Gestión de operaciones abiertas</p>
      </div>

      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Trades Abiertos</div>
            <div className="stat-value">{dashboard.open_trades || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Capital Comprometido</div>
            <div className="stat-value">${(dashboard.capital_at_risk || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Prima Total Cobrada</div>
            <div className="stat-value positive">${(dashboard.total_premium || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{(dashboard.win_rate || 0).toFixed(1)}%</div>
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={() => { setEditingTrade(null); setIsModalOpen(true); }} style={{marginBottom: '20px'}}>
        Nuevo Trade
      </button>

      {loading && <div className="loading">Cargando trades...</div>}

      {!loading && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Tipo</th>
                <th>Strike</th>
                <th>Contratos</th>
                <th>Prima</th>
                <th>Fecha Apertura</th>
                <th>Expiración</th>
                <th>DTE</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{textAlign: 'center'}}>No hay trades abiertos</td>
                </tr>
              ) : (
                trades.map((trade) => {
                  const dte = calculateDTE(trade.expiration_date);
                  return (
                    <tr key={trade.trade_id}>
                      <td style={{fontWeight: '600'}}>{trade.symbol}</td>
                      <td>
                        <span className={`badge ${trade.trade_type === 'CSP' ? 'badge-csp' : 'badge-cc'}`}>
                          {trade.trade_type}
                        </span>
                      </td>
                      <td>${parseFloat(trade.strike_price).toFixed(2)}</td>
                      <td>{trade.contracts}</td>
                      <td style={{color: '#10b981', fontWeight: '500'}}>${parseFloat(trade.premium_per_share).toFixed(2)}</td>
                      <td>{trade.open_date.split('T')[0]}</td>
                      <td>{trade.expiration_date.split('T')[0]}</td>
                      <td>
                        <span style={{color: dte <= 7 ? '#ef4444' : '#9ca3af', fontWeight: '500'}}>
                          {dte}d
                        </span>
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <button className="btn" onClick={() => handleEdit(trade)} style={{fontSize: '12px', padding: '6px 10px'}}>Editar</button>
                          <button className="btn btn-primary" onClick={() => handleClose(trade)} style={{fontSize: '12px', padding: '6px 10px'}}>Cerrar</button>
                          <button className="btn" onClick={() => handleDeleteTrade(trade.trade_id)} style={{fontSize: '12px', padding: '6px 10px', color: '#ef4444'}}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <AddTradeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTrade(null);
        }}
        onTradeAdded={loadData}
        editingTrade={editingTrade}
        activeAccount={activeAccount}
        loadingActiveAccount={loadingActiveAccount}
      />

      <CloseTradeModal
        isOpen={closeModalOpen}
        onClose={() => {
          setCloseModalOpen(false);
          setSelectedTrade(null);
        }}
        trade={selectedTrade}
        onTradeUpdated={loadData}
      />
    </div>
  );
}

export default TradesPage;
