import React, { useState, useEffect, useContext } from 'react';
import { getTrades, getDashboard, deleteTrade } from '../services/api';
import CloseTradeModal from './CloseTradeModal';
import AddTradeModal from './AddTradeModal';
import StockTradeModal from './StockTradeModal';
import TradesStats from './TradesStats';
import TradesActions from './TradesActions';
import TradesTable from './TradesTable';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function TradesPage() {
  const { activeAccount, loadingActiveAccount } = useContext(ActiveAccountContext);
  const [trades, setTrades] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!activeAccount || !activeAccount.account_id) {
        setTrades([]);
        setDashboard(null);
        return;
      }
      const [tradesResponse, dashboardResponse] = await Promise.all([
        getTrades({ account_id: activeAccount.account_id }),
        getDashboard(activeAccount.account_id),
      ]);
      setTrades(Array.isArray(tradesResponse.data) ? tradesResponse.data : []);
      setDashboard(dashboardResponse.data);
    } catch (error) {
      console.error('Error loading trades and dashboard:', error);
      setTrades([]);
      setDashboard(null);
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
    try {
      await deleteTrade(tradeId);
      await loadData(); // Esperar recarga para asegurarse actualización
    } catch (error) {
      alert('Error deleting trade: ' + error.message);
    }
  };

  const openOptionsModal = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* Cabecera en inglés y en línea */}
      <div
        className="page-header"
        style={{ marginTop: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <h1>Trades</h1>
        <span style={{ fontWeight: 400, fontSize: '1rem', color: '#888' }}>Create & manage open trades</span>
      </div>

      {dashboard ? <TradesStats dashboard={dashboard} /> : <p>Loading dashboard...</p>}

      <TradesActions onOpenOptionsModal={openOptionsModal} onOpenStockModal={() => setStockModalOpen(true)} />

      <TradesTable
        trades={trades}
        loading={loading}
        onEdit={handleEdit}
        onClose={handleClose}
        onDelete={handleDeleteTrade}
      />

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

      <StockTradeModal isOpen={stockModalOpen} onClose={() => setStockModalOpen(false)} />
    </div>
  );
}

export default TradesPage;
