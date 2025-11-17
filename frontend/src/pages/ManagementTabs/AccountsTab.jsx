import React, { useState, useEffect } from 'react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', currency: 'USD', initialBalance: '' });

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
      setAccounts(data);
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

  const createAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccount.name,
          currency: newAccount.currency,
          initial_balance: parseFloat(newAccount.initialBalance),
        }),
      });
      if (!response.ok) throw new Error('Error creando la cuenta');
      await loadAccounts();
      setShowNewForm(false);
      setNewAccount({ name: '', currency: 'USD', initialBalance: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Administrar Cuentas</h2>
      {error && <div style={{ color: '#ef4444', background: '#7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
      {loading && <div className="loading">Cargando...</div>}
      <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)} style={{ marginBottom: '20px' }}>
        {showNewForm ? 'Cancelar' : 'Nueva Cuenta'}
      </button>

      {showNewForm && (
        <form onSubmit={createAccount} className="stat-card" style={{ marginBottom: '30px' }}>
          <div className="form-group">
            <label>Nombre</label>
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
            <label>Moneda</label>
            <select name="currency" value={newAccount.currency} onChange={handleNewAccountChange} required>
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
              placeholder="Monto inicial en la moneda seleccionada"
              value={newAccount.initialBalance}
              onChange={handleNewAccountChange}
              required
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
              <th>Moneda</th>
              <th>Saldo Actual</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={3}>No hay cuentas registradas.</td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.account_id}>
                  <td>{acc.name}</td>
                  <td>{acc.currency}</td>
                  <td>{acc.current_balance?.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
