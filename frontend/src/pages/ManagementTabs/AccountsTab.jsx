import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ActiveAccountContext } from '../../context/ActiveAccountContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'];
const ACCOUNT_TYPES = ['cash', 'margin'];

export default function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    broker: '',
    currency: 'USD',
    current_balance: '',
    account_type: 'cash',
    margin_multiplier: '1.0',
  });

  const { activeAccountId, setActiveAccountId, reloadActiveAccount } = useContext(ActiveAccountContext);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/accounts/all');
      if (!response.ok) throw new Error('Error cargando cuentas');
      const data = await response.json();
      setAccounts(data || []);
      if (!activeAccountId && data.length > 0) {
        const active = data.find(acc => acc.is_active === 1);
        const newActiveId = active ? active.account_id : data[0].account_id;
        setActiveAccountId(newActiveId);
        setSelectedAccountId(newActiveId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, setActiveAccountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    setSelectedAccountId(activeAccountId);
  }, [activeAccountId]);

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
      await loadAccounts();
      setActiveAccountId(selectedAccountId);
      await reloadActiveAccount();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditAccount = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      broker: account.broker || '',
      currency: account.currency || 'USD',
      current_balance: account.current_balance ? account.current_balance.toString() : '',
      account_type: account.account_type || 'cash',
      margin_multiplier: account.margin_multiplier ? account.margin_multiplier.toString() : '1.0',
    });
    setShowNewForm(true);
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      broker: '',
      currency: 'USD',
      current_balance: '',
      account_type: 'cash',
      margin_multiplier: '1.0',
    });
    setShowNewForm(false);
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`¿Eliminar cuenta '${account.name}'? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/accounts/${account.account_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error eliminando cuenta');
      await loadAccounts();
      await reloadActiveAccount();
      if (activeAccountId === account.account_id) {
        setActiveAccountId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        broker: formData.broker,
        currency: formData.currency,
        current_balance: parseFloat(formData.current_balance) || 0,
        account_type: formData.account_type,
        margin_multiplier: parseFloat(formData.margin_multiplier) || 1.0,
      };
      let response;
      if (editingAccount) {
        response = await fetch(`/api/v1/accounts/${editingAccount.account_id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/v1/accounts', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) throw new Error('Error guardando cuenta');
      await loadAccounts();
      await reloadActiveAccount();
      cancelEdit();
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
        <div style={{ color: '#fca5a5', background: '#7f1d1d', padding: 12, borderRadius: 8, marginBottom: 20, border: '1px solid #dc2626' }}>
          {error}
        </div>
      )}
      {loading && <div className="loading">Cargando...</div>}

      <button
        className="btn btn-primary"
        onClick={() => {
          cancelEdit();
          setShowNewForm(!showNewForm);
        }}
        style={{ marginBottom: 20 }}
      >
        {showNewForm ? 'Cancelar' : editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
      </button>

      {showNewForm && (
        <form onSubmit={handleFormSubmit} style={{ marginBottom: 20, maxWidth: '400px' }}>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Broker</label>
            <input
              type="text"
              value={formData.broker}
              onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Saldo Actual</label>
            <input
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tipo de Cuenta</label>
            <select
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Multiplicador de Margen</label>
            <input
              type="number"
              step="0.01"
              min="1.0"
              value={formData.margin_multiplier}
              onChange={(e) => setFormData({ ...formData, margin_multiplier: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : editingAccount ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Broker</th><th>Moneda</th><th>Saldo Actual</th>
              <th>Tipo de Cuenta</th><th>Multiplicador Margen</th><th>Activo</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center' }}>No hay cuentas registradas.</td></tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.account_id}>
                  <td>{acc.account_id}</td>
                  <td>{acc.name}</td>
                  <td>{acc.broker || 'N/A'}</td>
                  <td>{acc.currency}</td>
                  <td>${acc.current_balance?.toFixed(2) || '0.00'}</td>
                  <td>{acc.account_type || 'cash'}</td>
                  <td>{acc.margin_multiplier?.toFixed(2) || '1.00'}</td>
                  <td>
                    <input
                      type="radio"
                      name="activeAccount"
                      checked={selectedAccountId === acc.account_id}
                      onChange={() => setSelectedAccountId(acc.account_id)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => startEditAccount(acc)} disabled={loading}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(acc)} disabled={loading} style={{ marginLeft: 6 }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedAccountId !== activeAccountId && (
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" onClick={activateAccount} disabled={loading}>
            {loading ? 'Activando...' : 'Confirmar activación'}
          </button>
        </div>
      )}
    </div>
  );
}
