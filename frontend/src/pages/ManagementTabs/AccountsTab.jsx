import React, { useState, useEffect } from 'react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: '', broker: '', currency: 'USD', initialBalance: '' });
  const [transactionData, setTransactionData] = useState({ amount: '' });
  const [editData, setEditData] = useState({ name: '', broker: '', currency: 'USD', current_balance: '' });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts');
      if (!response.ok) throw new Error('Error cargando cuentas');
      const data = await response.json();
      setAccounts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAccountChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionChange = (e) => {
    const { value } = e.target;
    setTransactionData({ amount: value });
  };

  const createAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccount.name,
          broker: newAccount.broker || 'N/A',
          currency: newAccount.currency,
          initial_balance: parseFloat(newAccount.initialBalance) || 0,
          current_balance: parseFloat(newAccount.initialBalance) || 0,
        }),
      });
      if (!response.ok) throw new Error('Error creando la cuenta');
      await loadAccounts();
      setShowNewForm(false);
      setNewAccount({ name: '', broker: '', currency: 'USD', initialBalance: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (e) => {
    e.preventDefault();
    if (!editData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          broker: editData.broker || 'N/A',
          currency: editData.currency,
          current_balance: parseFloat(editData.current_balance) || 0,
        }),
      });
      if (!response.ok) throw new Error('Error actualizando la cuenta');
      await loadAccounts();
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (accountId, e) => {
    e.preventDefault();
    const amount = parseFloat(transactionData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Cantidad inválida');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Error realizando depósito');
      await loadAccounts();
      setShowTransactionForm(null);
      setTransactionData({ amount: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (accountId, e) => {
    e.preventDefault();
    const amount = parseFloat(transactionData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Cantidad inválida');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}/withdrawal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Error realizando extracción');
      await loadAccounts();
      setShowTransactionForm(null);
      setTransactionData({ amount: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta cuenta?')) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error eliminando la cuenta');
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (account) => {
    setEditData({
      name: account.name,
      broker: account.broker || '',
      currency: account.currency,
      current_balance: account.current_balance?.toString() || '0',
    });
    setEditingId(account.account_id);
    setError('');
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
        {showNewForm ? 'Cancelar' : ' Nueva Cuenta'}
      </button>

      {showNewForm && (
        <form onSubmit={createAccount} className="stat-card" style={{ marginBottom: '30px' }}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              name="name"
              placeholder="Ejemplo: IBKR principal"
              value={newAccount.name}
              onChange={handleNewAccountChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Broker</label>
            <input
              type="text"
              name="broker"
              placeholder="Ejemplo: Interactive Brokers"
              value={newAccount.broker}
              onChange={handleNewAccountChange}
            />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select name="currency" value={newAccount.currency} onChange={handleNewAccountChange}>
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Saldo inicial</label>
            <input
              type="number"
              name="initialBalance"
              min="0"
              step="0.01"
              placeholder="Monto inicial"
              value={newAccount.initialBalance}
              onChange={handleNewAccountChange}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Broker</th>
              <th>Moneda</th>
              <th>Saldo Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No hay cuentas registradas.</td>
              </tr>
            ) : (
              accounts.map((acc) => (
                editingId === acc.account_id ? (
                  <tr key={acc.account_id}>
                    <td colSpan={5}>
                      <form onSubmit={updateAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', alignItems: 'end' }}>
                        <input
                          type="text"
                          name="name"
                          placeholder="Nombre"
                          value={editData.name}
                          onChange={handleEditChange}
                          required
                        />
                        <input
                          type="text"
                          name="broker"
                          placeholder="Broker"
                          value={editData.broker}
                          onChange={handleEditChange}
                        />
                        <select name="currency" value={editData.currency} onChange={handleEditChange}>
                          {CURRENCIES.map((cur) => (
                            <option key={cur} value={cur}>{cur}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                          <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, background: '#2d3748', border: 'none', borderRadius: '6px', color: '#e5e7eb', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={acc.account_id}>
                    <td>{acc.name}</td>
                    <td>{acc.broker || 'N/A'}</td>
                    <td>{acc.currency}</td>
                    <td>{acc.current_balance?.toFixed(2) || '0.00'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setShowTransactionForm(acc.account_id === showTransactionForm ? null : acc.account_id)}
                          style={{ padding: '5px 10px', fontSize: '12px', background: '#2d3748', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer' }}
                        >
                           Transacción
                        </button>
                        <button
                          onClick={() => startEdit(acc)}
                          style={{ padding: '5px 10px', fontSize: '12px', background: '#2d3748', color: '#e5e7eb', border: '1px solid #4a5568', borderRadius: '4px', cursor: 'pointer' }}
                        >
                           Editar
                        </button>
                        <button
                          onClick={() => deleteAccount(acc.account_id)}
                          style={{ padding: '5px 10px', fontSize: '12px', background: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer' }}
                        >
                           Eliminar
                        </button>
                      </div>
                      {showTransactionForm === acc.account_id && (
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#2d3748', borderRadius: '4px' }}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Cantidad"
                            value={transactionData.amount}
                            onChange={handleTransactionChange}
                            style={{ width: '100%', marginBottom: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a1d29', color: '#e5e7eb' }}
                          />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={(e) => deposit(acc.account_id, e)}
                              style={{ flex: 1, padding: '6px', background: '#10b981', color: '#1a1d29', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              Depositar
                            </button>
                            <button
                              onClick={(e) => withdraw(acc.account_id, e)}
                              style={{ flex: 1, padding: '6px', background: '#f59e0b', color: '#1a1d29', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              Extraer
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
