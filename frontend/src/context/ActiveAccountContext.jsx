import React, { createContext, useState, useEffect } from 'react';

export const ActiveAccountContext = createContext();

export const ActiveAccountProvider = ({ children }) => {
  const [activeAccount, setActiveAccount] = useState(null);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [loadingActiveAccount, setLoadingActiveAccount] = useState(true);

  useEffect(() => {
    async function fetchActiveAccount() {
      try {
        const res = await fetch('/api/v1/accounts');
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        // Seleccionar la cuenta activa (is_active === true) o la primera si no existe
        const foundActive = Array.isArray(data)
          ? data.find(acc => acc.is_active === true)
          : null;
        if (foundActive) {
          setActiveAccount(foundActive);
          setActiveAccountId(foundActive.account_id);
        } else if (Array.isArray(data) && data.length > 0) {
          setActiveAccount(data[0]);
          setActiveAccountId(data[0].account_id);
        } else {
          setActiveAccount(null);
          setActiveAccountId(null);
        }
      } catch (error) {
        console.error('Error fetching active account:', error);
        setActiveAccount(null);
        setActiveAccountId(null);
      } finally {
        setLoadingActiveAccount(false);
      }
    }
    fetchActiveAccount();
  }, []);

  return (
    <ActiveAccountContext.Provider value={{
      activeAccount,
      setActiveAccount,
      activeAccountId,
      setActiveAccountId,
      loadingActiveAccount
    }}>
      {children}
    </ActiveAccountContext.Provider>
  );
};
