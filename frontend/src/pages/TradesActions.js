import React from 'react';

function TradesActions({ onOpenOptionsModal, onOpenStockModal }) {
  return (
    <div style={{ marginBottom: '14px', display: 'flex', gap: '16px' }}>
      <button className="btn btn-primary" onClick={onOpenOptionsModal}>
        Option Sell
      </button>
      <button className="btn btn-secondary" onClick={onOpenStockModal}>
        Shares Buy/Sell
      </button>
    </div>
  );
}

export default TradesActions;
