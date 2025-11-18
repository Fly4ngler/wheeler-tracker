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

  useEffect(() => {
    loadAccounts();
  }, []);

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
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async (accountId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      });
      if (!response.ok) throw new Error('Error activando cuenta');
      setActiveAccountId(accountId);
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
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  No hay cuentas registradas.
                </td>
              </tr>
            ) : (
              accounts.map((acc) =>
                editingId === acc.account_id ? (
                  <tr key={acc.account_id}>
                    <td>{acc.account_id}</td>
                    <td>
                      <input className="form-control" type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    </td>
                    <td>
                      <input className="form-control" type="text" value={editData.broker} onChange={e => setEditData({ ...editData, broker: e.target.value })} />
                    </td>
                    <td>
                      <select className="form-control" value={editData.currency} onChange={e => setEditData({ ...editData, currency: e.target.value })}>
                        {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="form-control" type="number" value={editData.current_balance} step="0.01" onChange={e => setEditData({ ...editData, current_balance: e.target.value })} />
                    </td>
                    <td></td>
                    <td style={{display: 'flex', gap: '4px'}}>
                      <button className="btn btn-primary" onClick={() => handleEditSubmit(acc)} style={{fontSize: '12px', padding: '6px 10px'}}>Guardar</button>
                      <button className="btn" onClick={handleEditCancel} style={{fontSize: '12px', padding: '6px 10px'}}>Cancelar</button>
                    </td>
                  </tr>
                ) : (
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
                        checked={activeAccountId === acc.account_id}
                        onChange={() => activateAccount(acc.account_id)}
                      />
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                        <button className="btn" onClick={() => setShowTransactionForm({ type: 'deposit', account: acc })} style={{fontSize: '12px', padding: '6px 10px'}}>Depositar</button>
                        <button className="btn" onClick={() => setShowTransactionForm({ type: 'withdraw', account: acc })} style={{fontSize: '12px', padding: '6px 10px'}}>Retirar</button>
                        <button className="btn" onClick={() => handleEditInit(acc)} style={{fontSize: '12px', padding: '6px 10px'}}>Editar</button>
                        <button className="btn" onClick={() => handleDelete(acc.account_id)} style={{fontSize: '12px', padding: '6px 10px', color: '#ef4444'}}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {showTransactionForm && (
        <div className="modal-overlay" onClick={() => setShowTransactionForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{showTransactionForm.type === 'deposit' ? 'Depositar' : 'Retirar'} - {showTransactionForm.account.name}</h2>
            <form onSubmit={e => {e.preventDefault(); handleTransactionSubmit(showTransactionForm.type, showTransactionForm.account);}}>
              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={transactionData.amount}
                  onChange={e => setTransactionData({ ...transactionData, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  placeholder="Notas opcionales"
                  value={transactionData.notes}
                  onChange={e => setTransactionData({ ...transactionData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowTransactionForm(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{showTransactionForm.type === 'deposit' ? 'Depositar' : 'Retirar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
