import React, { useEffect, useState, useContext } from 'react';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

export default function AccountSelector({ style }) {
  const { activeAccountId, setActiveAccountId } = useContext(ActiveAccountContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/accounts/all');
        if (!res.ok) throw new Error('No se pudo cargar cuentas');
        const data = await res.json();
        setAccounts(data || []);

        // Si no hay cuentas, desactiva la cuenta activa
        if (!data || data.length === 0) {
          setActiveAccountId(null);
          return;
        }

        // Si no hay cuenta activa pero hay cuentas, selecciona la primera activa
        if ((!activeAccountId || activeAccountId === 0) && data && data.length > 0) {
          const firstActive = data.find(acc => acc.is_active) || data[0];
          setActiveAccountId(firstActive.account_id);
        }
      } catch (err) {
        console.error('Error cargando cuentas:', err);
        setAccounts([]);
        setActiveAccountId(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
    // Actualiza en cada render si cambia activeAccountId
  }, [setActiveAccountId]);

  if (loading) {
    return (
      <div style={style}>
        <span style={{ color: "#9ca3af" }}>Cargando cuentas...</span>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div style={style}>
        <span style={{ color: "#ef4444" }}>No hay cuentas disponibles</span>
        <select disabled style={{ borderRadius: 6, padding: '4px 12px', minWidth: 120, marginLeft: 8 }}>
          <option value="">Seleccione cuenta</option>
        </select>
      </div>
    );
  }

  return (
    <div style={style}>
      <label style={{ marginRight: 8, color: "#9ca3af" }}>Cuenta activa:</label>
      <select
        value={activeAccountId || ''}
        onChange={(e) => setActiveAccountId(Number(e.target.value))}
        style={{ borderRadius: 6, padding: '4px 12px', minWidth: 120 }}
      >
        <option value="">Seleccione cuenta</option>
        {accounts.map(acc => (
          <option key={acc.account_id} value={acc.account_id}>
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
