import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ActiveAccountContext = createContext();

export const ActiveAccountProvider = ({ children }) => {
  const [activeAccount, setActiveAccount] = useState(null);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [loadingActiveAccount, setLoadingActiveAccount] = useState(true);

  // Función para forzar la recarga desde backend, reutilizable globalmente
  const reloadActiveAccount = useCallback(async () => {
    setLoadingActiveAccount(true);
    try {
      const res = await fetch('/api/v1/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
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
  }, []);

  // Inicial: cargar al montar provider
  useEffect(() => {
    reloadActiveAccount();
  }, [reloadActiveAccount]);

  // Cuando cambia activeAccountId, actualizar el objeto activeAccount correspondiente
  useEffect(() => {
    async function fetchAccountById(id) {
      if (!id) {
        setActiveAccount(null);
        return;
      }
      try {
        const res = await fetch(`/api/v1/accounts/${id}`);
        if (!res.ok) throw new Error('Failed to fetch account by ID');
        const data = await res.json();
        setActiveAccount(data || null);
      } catch (error) {
        console.error('Error fetching account by ID:', error);
        setActiveAccount(null);
      }
    }
    if (activeAccountId !== null) {
      fetchAccountById(activeAccountId);
    }
  }, [activeAccountId]);

  // Setter expuesto: cambiar accountId y refresca associated account
  const updateActiveAccountId = (id) => {
    setActiveAccountId(id);
  };

  return (
    <ActiveAccountContext.Provider value={{
      activeAccount,
      setActiveAccount,
      activeAccountId,
      setActiveAccountId: updateActiveAccountId,
      loadingActiveAccount,
      reloadActiveAccount,
    }}>
      {children}
    </ActiveAccountContext.Provider>
  );
};
