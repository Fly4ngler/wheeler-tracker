import React, { useState } from 'react';
import CSVImportTab from './ManagementTabs/CSVImportTab';
import AccountsTab from './ManagementTabs/AccountsTab';
import APIsTab from './ManagementTabs/APIsTab';

import '../styles/App.css';

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('accounts'); // Cambiado a 'accounts'

  return (
    <div>
      <header className="page-header">
        <h1>Management Panel</h1>
        <p>Administra importación de trades, cuentas y configuración de APIs</p>
      </header>

      <nav className="management-tabs">
        <button
          className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          Importar CSV
        </button>
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          Cuentas
        </button>
        <button
          className={`tab-btn ${activeTab === 'apis' ? 'active' : ''}`}
          onClick={() => setActiveTab('apis')}
        >
          APIs
        </button>
      </nav>

      <section className="management-content">
        {activeTab === 'csv' && <CSVImportTab />}
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'apis' && <APIsTab />}
      </section>
    </div>
  );
}
