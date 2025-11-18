import React, { createContext, useState, useEffect } from 'react';

export const ActiveAccountContext = createContext();

export const ActiveAccountProvider = ({ children }) => {
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [loadingActiveAccount, setLoadingActiveAccount] = useState(true);

  useEffect(() => {
    async function fetchActiveAccount() {
      try {
        const res = await fetch('/api/v1/accounts');
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        if (data.length > 0) {
          setActiveAccountId(data[0].account_id);
        } else {
          setActiveAccountId(null);
        }
      } catch (error) {
        console.error('Error fetching active account:', error);
      } finally {
        setLoadingActiveAccount(false);
      }
    }
    fetchActiveAccount();
  }, []);

  return (
    <ActiveAccountContext.Provider value={{ activeAccountId, setActiveAccountId, loadingActiveAccount }}>
      {children}
    </ActiveAccountContext.Provider>
  );
};
