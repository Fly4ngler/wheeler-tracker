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
        if (!res.ok) throw new Error('Failed to load accounts');
        const data = await res.json();
        setAccounts(data || []);

        // If no accounts, deactivate active account
        if (!data || data.length === 0) {
          setActiveAccountId(null);
          return;
        }

        // If no active account but accounts exist, select first active or first account
        if ((!activeAccountId || activeAccountId === 0) && data && data.length > 0) {
          const firstActive = data.find(acc => acc.is_active) || data[0];
          setActiveAccountId(firstActive.account_id);
        }
      } catch (err) {
        console.error('Error loading accounts:', err);
        setAccounts([]);
        setActiveAccountId(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, [setActiveAccountId]);

  if (loading) {
    return (
      <div style={style}>
        <span style={{ color: "#9ca3af" }}>Loading accounts...</span>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div style={style}>
        <span style={{ color: "#ef4444" }}>No accounts available</span>
        <select disabled style={{ borderRadius: 6, padding: '4px 12px', minWidth: 120, marginLeft: 8 }}>
          <option value="">Select account</option>
        </select>
      </div>
    );
  }

  return (
    <div style={style}>
      <label style={{ marginRight: 8, color: "#9ca3af" }}>Active account:</label>
      <select
        value={activeAccountId || ''}
        onChange={(e) => setActiveAccountId(Number(e.target.value))}
        style={{ borderRadius: 6, padding: '4px 12px', minWidth: 120 }}
      >
        <option value="">Select account</option>
        {accounts.map(acc => (
          <option key={acc.account_id} value={acc.account_id}>
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
