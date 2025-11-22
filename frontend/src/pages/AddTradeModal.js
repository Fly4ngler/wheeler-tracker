import React, { useState, useEffect } from 'react';
import { createTrade, updateTrade } from '../services/api';

function AddTradeModal({
  isOpen,
  onClose,
  onTradeAdded,
  editingTrade,
  activeAccount,
  loadingActiveAccount,
}) {
  const [formData, setFormData] = useState({
    account_id: activeAccount ? activeAccount.account_id : 1,
    symbol: '',
    trade_type: 'CSP',
    contracts: 1,
    strike_price: '',
    premium_per_share: '',
    delta: '',                  // NUEVO CAMPO para el formulario
    open_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    fees: '',
  });

  useEffect(() => {
    if (isOpen && !editingTrade) {
      setFormData((prev) => ({
        ...prev,
        account_id: activeAccount.account_id,
        symbol: '',
        trade_type: 'CSP',
        contracts: 1,
        strike_price: '',
        premium_per_share: '',
        delta: '',
        open_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
        fees: '',
      }));
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
        delta: editingTrade.delta !== undefined && editingTrade.delta !== null ? editingTrade.delta.toString() : '', // Nuevo
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
        account_id: activeAccount.account_id,
        strike_price: parseFloat(formData.strike_price),
        premium_per_share: parseFloat(formData.premium_per_share),
        contracts: parseInt(formData.contracts),
        delta: formData.delta !== '' ? parseFloat(formData.delta) : null,
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
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido';
      alert('Error al guardar trade: ' + errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingTrade ? 'Editar Trade' : 'Nuevo Trade'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Símbolo:</label>
            <input
              type="text"
              className="form-control"
              value={formData.symbol}
              placeholder="AAPL"
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo:</label>
            <select
              className="form-control"
              value={formData.trade_type}
              onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
              required
            >
              <option value="CSP">Cash-Secured Put (CSP)</option>
              <option value="CC">Covered Call (CC)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contratos:</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={formData.contracts}
              placeholder="1"
              onChange={(e) => setFormData({ ...formData, contracts: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Precio de Strike:</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.strike_price}
              placeholder="100.00"
              onChange={(e) => setFormData({ ...formData, strike_price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Prima por acción:</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.premium_per_share}
              placeholder="1.25"
              onChange={(e) => setFormData({ ...formData, premium_per_share: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label> Delta (opcional):</label>
            <input
              type="number"
              step="0.001"
              className="form-control"
              value={formData.delta}
              placeholder="0.21"
              onChange={(e) => setFormData({ ...formData, delta: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Fecha de apertura:</label>
            <input
              type="date"
              className="form-control"
              value={formData.open_date}
              onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de expiración:</label>
            <input
              type="date"
              className="form-control"
              value={formData.expiration_date}
              placeholder="dd/mm/aaaa"
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Comisiones:</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.fees}
              placeholder="0.65"
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            />
          </div>
          <div className="form-actions" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" className="btn btn-primary">{editingTrade ? 'Actualizar' : 'Crear'}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTradeModal;
