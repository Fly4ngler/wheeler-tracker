import React, { useState, useEffect, useContext } from 'react';
import { ActiveAccountContext } from '../../context/ActiveAccountContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: '', broker: '', currency: 'USD', initialBalance: '' });
  const [editData, setEditData] = useState({ name: '', broker: '', currency: 'USD', current_balance: '' });
  const [transactionData, setTransactionData] = useState({ amount: '', notes: '' });

  const { activeAccountId, setActiveAccountId } = useContext(ActiveAccountContext);

  // Estado local para selección de cuenta antes de activar
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    // Mantener sincronizado el seleccionado con el contexto activo
    setSelectedAccountId(activeAccountId);
  }, [activeAccountId]);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts/all');
      if (!response.ok) throw new Error('Error cargando cuentas');
      const data = await response.json();
      setAccounts(data || []);
      if (!activeAccountId && data.length > 0) {
        const active = data.find(acc => acc.is_active === 1);
        setActiveAccountId(active ? active.account_id : data[0].account_id);
        setSelectedAccountId(active ? active.account_id : data[0].account_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: selectedAccountId }),
      });
      if (!response.ok) throw new Error('Error activando cuenta');
      setActiveAccountId(selectedAccountId);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cuenta? Esta operación no se puede deshacer.")) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}`, { method: "DELETE" });
      if (!response.ok) throw new Error('Error eliminando cuenta');
      if (activeAccountId === accountId) setActiveAccountId(null);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (acc) => {
    setEditingId(acc.account_id);
    setEditData({
      name: acc.name,
      broker: acc.broker || '',
      currency: acc.currency,
      current_balance: acc.current_balance
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({ name: '', broker: '', currency: 'USD', current_balance: '' });
  };

  const handleEditSubmit = async (acc) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${acc.account_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          current_balance: parseFloat(editData.current_balance)
        }),
      });
      if (!response.ok) throw new Error('Error actualizando cuenta');
      setEditingId(null);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccount.name,
          broker: newAccount.broker,
          currency: newAccount.currency,
          initial_balance: parseFloat(newAccount.initialBalance),
          current_balance: parseFloat(newAccount.initialBalance)
        }),
      });
      if (!response.ok) throw new Error('Error creando cuenta');
      setShowNewForm(false);
      setNewAccount({ name: '', broker: '', currency: 'USD', initialBalance: '' });
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (type, acc) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `/api/v1/accounts/${acc.account_id}/${type === "deposit" ? "deposit" : "withdrawal"}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(transactionData.amount),
          notes: transactionData.notes
        }),
      });
      if (!response.ok) throw new Error('Error realizando operación');
      setShowTransactionForm(null);
      setTransactionData({ amount: '', notes: '' });
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Administrar Cuentas</h2>
      {error && (
        <div style={{ color: '#fca5a5', background: '#7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dc2626' }}>
          {error}
        </div>
      )}
      {loading && <div className="loading">Cargando...</div>}
      <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)} style={{ marginBottom: '20px' }}>
        {showNewForm ? 'Cancelar' : 'Nueva Cuenta'}
      </button>
      {showNewForm && (
        <div className="modal-overlay" onClick={() => setShowNewForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Cuenta</h2>
            <form onSubmit={handleNewAccountSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  placeholder="Nombre de la cuenta"
                  required
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Broker</label>
                <input
                  type="text"
                  placeholder="Broker"
                  value={newAccount.broker}
                  onChange={e => setNewAccount({ ...newAccount, broker: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Moneda *</label>
                <select
                  value={newAccount.currency}
                  onChange={e => setNewAccount({ ...newAccount, currency: e.target.value })}
                >
                  {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Inicial *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  value={newAccount.initialBalance}
                  onChange={e => setNewAccount({ ...newAccount, initialBalance: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowNewForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Broker</th>
              <th>Moneda</th>
              <th>Saldo Actual</th>
              <th>Activo (selección)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No hay cuentas registradas.</td></tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.account_id}>
                  <td>{acc.account_id}</td>
                  <td>{acc.name}</td>
                  <td>{acc.broker || 'N/A'}</td>
                  <td>{acc.currency}</td>
                  <td>${acc.current_balance?.toFixed(2) || '0.00'}</td>
                  <td>
                    <input
                      type="radio"
                      name="activeAccount"
                      checked={selectedAccountId === acc.account_id}
                      onChange={() => setSelectedAccountId(acc.account_id)}
                    />
                  </td>
                  <td>
                    {/* Botones editar, eliminar, depósito, retiro */}
                    {/* Mantén la estructura y estilos previos */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedAccountId !== activeAccountId && (
        <div style={{ marginTop: '10px' }}>
          <button className="btn btn-primary" onClick={activateAccount} disabled={loading}>
            {loading ? 'Activando...' : 'Confirmar activación'}
          </button>
        </div>
      )}
      {/* Aquí el resto de modales para nuevas cuentas, transacciones, edición */}
    </div>
  );
}
