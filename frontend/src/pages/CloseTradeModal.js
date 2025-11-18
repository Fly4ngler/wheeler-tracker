import React, { useState } from 'react';
import { closeTrade } from '../services/api';

function CloseTradeModal({ isOpen, onClose, trade, onTradeUpdated }) {
  const [formData, setFormData] = useState({
    close_date: new Date().toISOString().split('T')[0],
    close_method: 'BTC',
    close_price: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.close_date) {
      newErrors.close_date = 'Close date is required';
    }

    if (formData.close_method === 'BTC') {
      // Fecha cierre >= fecha apertura
      if (formData.close_date < trade.open_date) {
        newErrors.close_date = 'Close date cannot be before open date';
      }
      // Fecha cierre <= fecha expiración
      if (formData.close_date > trade.expiration_date) {
        newErrors.close_date = 'Close date cannot be after expiration date';
      }
    }

    if (!formData.close_method) {
      newErrors.close_method = 'Close method is required';
    }

    // Close price es requerido solo para BTC
    if (formData.close_method === 'BTC') {
      if (!formData.close_price || parseFloat(formData.close_price) < 0) {
        newErrors.close_price = 'Valid close price required for BTC';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Auto-set close_price a 0 para EXPIRATION y ASSIGNMENT
      let closePriceToSend = parseFloat(formData.close_price);
      if (formData.close_method === 'EXPIRATION' || formData.close_method === 'ASSIGNMENT') {
        closePriceToSend = 0;
      }

      await closeTrade(trade.trade_id, {
        close_date: formData.close_date,
        close_method: formData.close_method,
        close_price: closePriceToSend
      });

      onTradeUpdated();
      onClose();
    } catch (error) {
      setErrors({ submit: 'Error closing trade: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const calculateDTE = (expirationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const calculatePL = () => {
    let priceForCalc = parseFloat(formData.close_price) || 0;

    // Auto-use 0 for EXPIRATION and ASSIGNMENT
    if (formData.close_method === 'EXPIRATION' || formData.close_method === 'ASSIGNMENT') {
      priceForCalc = 0;
    }

    if (priceForCalc >= 0) {
      const premiumCollected = trade.premium_per_share * trade.contracts * 100;
      const costToClose = priceForCalc * trade.contracts * 100;
      const fees = trade.fees;
      const pnl = premiumCollected - costToClose - fees;
      return {
        premiumCollected: premiumCollected.toFixed(2),
        costToClose: costToClose.toFixed(2),
        fees: fees.toFixed(2),
        pnl: pnl.toFixed(2),
        isProfit: pnl >= 0
      };
    }
    return null;
  };

  const pl = calculatePL();
  const isBTC = formData.close_method === 'BTC';
  const dte = calculateDTE(trade.expiration_date);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxHeight: '90vh', overflowY: 'auto'}}>
        <h2 style={{marginBottom: '12px'}}> Manage Contract</h2>
        <p style={{color: '#9ca3af', marginBottom: '12px', fontSize: '14px'}}>Choose how to handle this open leg.</p>

        <div className="contract-summary" style={{background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
            <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px'}}>{trade.trade_type}</span>
            <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px'}}>STRIKE</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span style={{fontSize: '20px', fontWeight: '600'}}>{trade.symbol}</span>
            <span style={{fontSize: '20px', fontWeight: '600'}}>${parseFloat(trade.strike_price).toFixed(2)}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <div>
              <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '2px'}}>PREMIUM</span>
              <span style={{fontSize: '16px', fontWeight: '600', color: '#10b981'}}>${parseFloat(trade.premium_per_share).toFixed(2)}</span>
            </div>
            <div style={{textAlign: 'right'}}>
              <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '2px'}}>CONTRACTS</span>
              <span style={{fontSize: '16px', fontWeight: '600'}}>{trade.contracts}</span>
            </div>
          </div>
          <hr style={{margin: '8px 0', borderColor: 'rgba(59, 130, 246, 0.2)'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <div>
              <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '2px'}}>OPEN DATE</span>
              <span style={{fontSize: '14px', fontWeight: '500'}}>{trade.open_date.split('T')[0]}</span>
            </div>
            <div style={{textAlign: 'right'}}>
              <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px', display: 'block', marginBottom: '2px'}}>EXPIRATION</span>
              <span style={{fontSize: '14px', fontWeight: '500'}}>{trade.expiration_date.split('T')[0]}</span>
            </div>
          </div>
          <div style={{textAlign: 'center'}}>
            <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '11px'}}>DTE</span>
            <div style={{fontSize: '18px', fontWeight: '600', color: dte <= 7 ? '#ff6b6b' : '#32b8c6'}}>{dte} days</div>
          </div>
        </div>

        <hr style={{margin: '12px 0', borderColor: '#2d3748'}} />

        <form onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="error-alert" style={{marginBottom: '12px'}}>
               {errors.submit}
            </div>
          )}

          <div className="form-group" style={{marginBottom: '12px'}}>
            <label style={{fontSize: '13px', marginBottom: '6px'}}>Close Method *</label>
            <select
              value={formData.close_method}
              onChange={(e) => setFormData({...formData, close_method: e.target.value})}
              className={errors.close_method ? 'input-error' : ''}
              style={{fontSize: '13px', padding: '8px'}}
            >
              <option value="BTC">Buy To Close (BTC)</option>
              <option value="EXPIRATION">Expiration</option>
              <option value="ASSIGNMENT">Assignment</option>
            </select>
            {errors.close_method && <span className="error-text">{errors.close_method}</span>}
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px'}}>
            <div className="form-group" style={{marginBottom: 0}}>
              <label style={{fontSize: '13px', marginBottom: '6px'}}>Close Date *</label>
              <input
                type="date"
                value={formData.close_date}
                onChange={(e) => setFormData({...formData, close_date: e.target.value})}
                className={errors.close_date ? 'input-error' : ''}
                min={trade.open_date}
                max={trade.expiration_date}
                style={{fontSize: '13px', padding: '8px'}}
              />
              {errors.close_date && <span className="error-text">{errors.close_date}</span>}
            </div>

            <div className="form-group" style={{marginBottom: 0}}>
              <label style={{fontSize: '13px', marginBottom: '6px'}}>Close Price {formData.close_method === 'BTC' ? '*' : ''}</label>
              <input
                type="number"
                step="0.01"
                value={formData.close_method === 'BTC' ? formData.close_price : 0}
                onChange={(e) => formData.close_method === 'BTC' && setFormData({...formData, close_price: e.target.value})}
                placeholder={formData.close_method === 'BTC' ? "e.g., 1.50" : "0"}
                disabled={formData.close_method !== 'BTC'}
                className={errors.close_price ? 'input-error' : ''}
                style={{fontSize: '13px', padding: '8px', opacity: formData.close_method === 'BTC' ? 1 : 0.6, cursor: formData.close_method === 'BTC' ? 'auto' : 'not-allowed'}}
              />
              {errors.close_price && <span className="error-text">{errors.close_price}</span>}
              {formData.close_method !== 'BTC' && <span style={{fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'block'}}>Auto-set to $0.00</span>}
            </div>
          </div>

          <div className="form-actions" style={{gap: '8px'}}>
            <button type="button" className="btn" onClick={onClose} disabled={loading} style={{fontSize: '13px', padding: '8px 12px'}}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{fontSize: '13px', padding: '8px 12px'}}>
              {loading ? 'Closing...' : 'Close Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CloseTradeModal;
