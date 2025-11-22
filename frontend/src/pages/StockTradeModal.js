import React, { useState, useEffect, useContext } from 'react';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function StockTradeModal({ isOpen, onClose }) {
  const { activeAccount } = useContext(ActiveAccountContext);
  const [formData, setFormData] = useState({
    account_id: activeAccount ? activeAccount.account_id : 1,
    symbol: '',
    type: 'compra',
    quantity: '',
    price_per_share: '',
    operation_date: new Date().toISOString().split('T')[0],
    fees: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        account_id: activeAccount.account_id,
        symbol: '',
        type: 'compra',
        quantity: '',
        price_per_share: '',
        operation_date: new Date().toISOString().split('T')[0],
        fees: '',
      }));
    }
  }, [activeAccount, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price_per_share: parseFloat(formData.price_per_share),
        fees: parseFloat(formData.fees) || 0,
      };
      // await createStockTrade(payload);
      alert('Operación de acciones registrada (funcionalidad simulada)');
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Error desconocido';
      alert('Error al guardar operación: ' + errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Compra/Venta de Acciones</h2>
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
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cantidad de Acciones:</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={formData.quantity}
              placeholder="100"
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Precio por acción:</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.price_per_share}
              placeholder="20.50"
              onChange={(e) => setFormData({ ...formData, price_per_share: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de operación:</label>
            <input
              type="date"
              className="form-control"
              value={formData.operation_date}
              onChange={(e) => setFormData({ ...formData, operation_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Comisiones:</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.fees}
              placeholder="0.50"
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            />
          </div>
          <div className="form-actions" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="submit" className="btn btn-primary">Registrar</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockTradeModal;
