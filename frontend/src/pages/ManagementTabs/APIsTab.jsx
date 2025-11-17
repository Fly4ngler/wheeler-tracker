import React, { useState, useEffect } from 'react';

const API_PROVIDERS = [
  {
    id: 'FINNHUB',
    name: 'Finnhub',
    description: 'Datos de mercado en tiempo real y cotizaciones',
    keyExample: 'Obtén tu API Key en https://finnhub.io',
  },
  {
    id: 'INTERACTIVE_BROKERS',
    name: 'Interactive Brokers (IBKR)',
    description: 'Integración con cuenta de Interactive Brokers',
    keyExample: 'Tu nombre de usuario de IBKR',
  },
  {
    id: 'CURRENCYFREAKS',
    name: 'CurrencyFreaks',
    description: 'Conversión de divisas en tiempo real',
    keyExample: 'Obtén tu API Key en https://currencyfreaks.com',
  },
];

export default function APIsTab() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ api_key: '', api_secret: '', additional_config: '' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/apis');
      if (!res.ok) throw new Error('Error cargando configuraciones');
      const data = await res.json();
      const map = {};
      data.forEach((c) => {
        map[c.provider] = c;
      });
      setConfigs(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id) => {
    const cfg = configs[id] || {};
    setFormData({
      api_key: cfg.api_key || '',
      api_secret: cfg.api_secret?.String || cfg.api_secret || '',
      additional_config: typeof cfg.additional_config === 'string' ? cfg.additional_config : (cfg.additional_config?.String || ''),
    });
    setEditing(id);
    setError('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveConfig = async () => {
    if (!formData.api_key.trim()) {
      setError('La API Key es requerida');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/apis/${editing}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: formData.api_key,
          api_secret: formData.api_secret || '',
          additional_config: formData.additional_config ? JSON.parse(formData.additional_config) : {},
        }),
      });
      if (!res.ok) throw new Error('Error guardando configuración');
      await fetchConfigs();
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteConfig = async (id) => {
    if (!window.confirm(`¿Eliminar configuración de ${id}?`)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/apis/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando configuración');
      await fetchConfigs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ color: '#fca5a5', marginBottom: '20px', padding: '12px', backgroundColor: '#7f1d1d', borderRadius: '8px', border: '1px solid #dc2626' }}>
           {error}
        </div>
      )}
      {loading && <div className="loading">Cargando...</div>}

      <div className="stats-grid" style={{ marginTop: '20px' }}>
        {API_PROVIDERS.map((provider) => {
          const config = configs[provider.id];
          const isEditing = editing === provider.id;

          return (
            <div key={provider.id} className="stat-card" style={{ minHeight: 'auto' }}>
              <h3 style={{ marginBottom: '8px', color: '#e5e7eb' }}>{provider.name}</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>{provider.description}</p>

              {!isEditing ? (
                <>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    <strong>Estado:</strong> {config ? <span style={{ color: '#10b981' }}>  Configurado</span> : <span style={{ color: '#f59e0b' }}>  No configurado</span>}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => startEdit(provider.id)} style={{ padding: '8px 12px', fontSize: '14px' }}>
                      {config ? ' Editar' : ' Configurar'}
                    </button>
                    {config && (
                      <button onClick={() => deleteConfig(provider.id)} style={{ padding: '8px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                         Eliminar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <div className="form-group">
                    <label style={{ color: '#9ca3af' }}>API Key *</label>
                    <input
                      type="text"
                      name="api_key"
                      placeholder={provider.keyExample}
                      value={formData.api_key}
                      onChange={handleChange}
                    />
                  </div>
                  {provider.id === 'INTERACTIVE_BROKERS' && (
                    <div className="form-group">
                      <label style={{ color: '#9ca3af' }}>API Secret / Contraseña</label>
                      <input
                        type="text"
                        name="api_secret"
                        placeholder="Tu contraseña de IBKR"
                        value={formData.api_secret}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label style={{ color: '#9ca3af' }}>Configuración adicional (JSON opcional)</label>
                    <textarea
                      name="additional_config"
                      placeholder='{"base_url": "...", "timeout": 30}'
                      value={formData.additional_config}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={saveConfig} disabled={loading}>
                      {loading ? 'Guardando...' : ' Guardar'}
                    </button>
                    <button onClick={cancelEdit} style={{ padding: '10px 20px', background: '#2d3748', color: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                       Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
