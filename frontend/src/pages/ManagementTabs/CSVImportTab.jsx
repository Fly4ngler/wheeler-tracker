import React, { useState, useRef } from 'react';

export default function CSVImportTab() {
  const [file, setFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrades, setSelectedTrades] = useState(new Set());
  const [editedTrades, setEditedTrades] = useState({});
  const fileInputRef = useRef(null);

  const todayISO = new Date().toISOString().split('T')[0];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setValidationResults(null);
    setError(null);
    setSelectedTrades(new Set());
    setEditedTrades({});
  };

  const handleValidateCSV = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV válido');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/trades/validate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Error: ${response.statusText}`);
        return;
      }

      setValidationResults(data);
      setSelectedTrades(new Set());
      setEditedTrades({});
    } catch (err) {
      setError(err.message || 'Error al validar');
    } finally {
      setLoading(false);
    }
  };

  const toggleTradeSelection = (lineNum) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(lineNum)) {
      newSelected.delete(lineNum);
    } else {
      newSelected.add(lineNum);
    }
    setSelectedTrades(newSelected);
  };

  const handleEditCell = (lineNum, field, value) => {
    setEditedTrades(prev => ({
      ...prev,
      [lineNum]: {
        ...prev[lineNum],
        [field]: value
      }
    }));
  };

  const getEditedValue = (result, field) => {
    if (editedTrades[result.line_num]?.[field] !== undefined) {
      return editedTrades[result.line_num][field];
    }
    if (field === 'close_method') return result.trade.close_method || (result.trade.close_price ? 'BTC' : '');
    if (field === 'close_date') return result.trade.close_date || '';
    if (field === 'close_price') return result.trade.close_price || '';
    return '';
  };

  const isTradeComplete = (result) => {
    const closeMethod = getEditedValue(result, 'close_method');
    const closeDate = getEditedValue(result, 'close_date');
    const closePrice = getEditedValue(result, 'close_price');

    // Si tiene close_price y close_method, es válido
    if (closePrice && closeMethod) return true;
    // Si es OPEN y no tiene close_date, es válido
    if (closeDate === 'OPEN') return true;
    return false;
  };

  // Determina si trade está expirado o abierto
  const isTradeExpired = (expirationDate) => {
    if (!expirationDate) return false;
    return expirationDate < todayISO;
  };

  const handleConfirmImport = async () => {
    const tradesToImport = validationResults.results
      .filter(r => selectedTrades.has(r.line_num))
      .map(r => {
        const trade = { ...r.trade };
        const edited = editedTrades[r.line_num] || {};

        // Aplicar ediciones y reglas por defecto
        if (edited.close_method) {
          trade.close_method = edited.close_method;
        } else if (trade.close_price) {
          trade.close_method = "BTC";
        }
        if (edited.close_date && edited.close_date !== 'OPEN') {
          trade.close_date = edited.close_date;
        } else if (edited.close_date === 'OPEN') {
          trade.close_date = 'OPEN';
        }
        if (edited.close_price) {
          trade.close_price = parseFloat(edited.close_price);
        }

        return trade;
      });

    if (tradesToImport.length === 0) {
      setError('Por favor selecciona al menos un trade para importar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/trades/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: tradesToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Error: ${response.statusText}`);
        return;
      }

      alert(` ${data.imported_count} trade(s) importado(s) exitosamente`);
      setValidationResults(null);
      setFile(null);
      setSelectedTrades(new Set());
      setEditedTrades({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = (lineNum) => {
    const newResults = validationResults.results.filter(r => r.line_num !== lineNum);
    setValidationResults({ ...validationResults, results: newResults });
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      newSet.delete(lineNum);
      return newSet;
    });
    setEditedTrades(prev => {
      const copy = { ...prev };
      delete copy[lineNum];
      return copy;
    });
  };

  const handleConfirmSingle = (lineNum) => {
    setSelectedTrades(new Set([lineNum]));
    handleConfirmImport();
  };

  return (
    <div className="tab-content">
      <h2>Importar Trades desde CSV</h2>

      <div style={{ backgroundColor: '#2d3748', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4a5568' }}>
        <p style={{ color: '#cbd5e0', margin: '0 0 10px 0', fontSize: '14px' }}>
          <strong>Formato requerido:</strong>
        </p>
        <code style={{ backgroundColor: '#1a1d29', padding: '10px', borderRadius: '4px', display: 'block', overflow: 'auto', fontSize: '12px', color: '#a0aec0' }}>
          account_id,symbol,trade_type,contracts,strike_price,premium_per_share,open_date,expiration_date,[close_date],[close_method],[close_price],[fees]
        </code>
        <p style={{ color: '#a0aec0', margin: '10px 0 0 0', fontSize: '12px' }}>
          Trade_type: CSP, CC, PUT, CALL | Fechas: YYYY-MM-DD | Campos entre [ ] son opcionales
        </p>
      </div>

      {!validationResults ? (
        <form onSubmit={handleValidateCSV} style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="form-control"
            />
          </div>
          <button type="submit" disabled={loading || !file} className="btn btn-primary">
            {loading ? 'Validando...' : 'Validar CSV'}
          </button>
        </form>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => {
              setValidationResults(null);
              setFile(null);
              setSelectedTrades(new Set());
              setEditedTrades({});
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{ padding: '10px 20px', background: '#2d3748', color: '#e5e7eb', border: '1px solid #4a5568', borderRadius: '8px', cursor: 'pointer' }}
          >
             Volver a cargar CSV
          </button>
        </div>
      )}

      {error && (
        <div style={{ color: '#fca5a5', background: '#7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dc2626' }}>
           {error}
        </div>
      )}

      {validationResults && (
        <div style={{ backgroundColor: '#1a1d29', padding: '20px', borderRadius: '8px', border: '1px solid #2d3748' }}>
          <h3 style={{ marginBottom: '15px', color: '#e5e7eb' }}> Validación completada - Edita los datos faltantes</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#2d3748', padding: '12px', borderRadius: '6px' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 5px 0' }}>Total</p>
              <p style={{ color: '#e5e7eb', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {validationResults.total_records}
              </p>
            </div>
            <div style={{ backgroundColor: '#2d3748', padding: '12px', borderRadius: '6px' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 5px 0' }}>Seleccionados</p>
              <p style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {selectedTrades.size}
              </p>
            </div>
            <div style={{ backgroundColor: '#2d3748', padding: '12px', borderRadius: '6px' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 5px 0' }}>Completos</p>
              <p style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {validationResults.results.filter(r => isTradeComplete(r)).length}
              </p>
            </div>
          </div>

          {validationResults.parse_errors && validationResults.parse_errors.length > 0 && (
            <div style={{ marginBottom: '20px', backgroundColor: '#1f2937', padding: '12px', borderRadius: '6px', border: '1px solid #dc2626' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '10px' }}> Errores de parseo:</h4>
              <ul style={{ color: '#fca5a5', margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                {validationResults.parse_errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResults.results && validationResults.results.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#2d3748',
                borderRadius: '8px',
                overflow: 'hidden',
                fontSize: '12px'
              }}>
                <thead style={{ backgroundColor: '#1a1d29' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}></th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Símbolo</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Contratos</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Prima</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Expiración</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Método Cierre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Fecha Cierre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>Precio Cierre</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', borderBottom: '1px solid #4a5568' }}>P/L</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#f87171', borderBottom: '1px solid #4a5568' }}>Acción</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#32d451', borderBottom: '1px solid #4a5568' }}>Confirmar</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResults.results.map((result, idx) => {
                    const isComplete = isTradeComplete(result);
                    const expired = isTradeExpired(result.trade.expiration_date);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #4a5568', backgroundColor: isComplete ? 'transparent' : '#3a2a2a' }}>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>
                          <input
                            type="checkbox"
                            checked={selectedTrades.has(result.line_num)}
                            onChange={() => toggleTradeSelection(result.line_num)}
                          />
                        </td>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>{result.trade.symbol}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>{result.trade.trade_type}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>{result.trade.contracts}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>${result.trade.premium_per_share?.toFixed(2)}</td>
                        <td style={{ padding: '12px', color: expired ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{result.trade.expiration_date}</td>
                        <td style={{ padding: '12px', color: expired ? '#ef4444' : '#e5e7eb', fontWeight: 'bold' }}>{expired ? 'Expirado' : 'Activo'}</td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={getEditedValue(result, 'close_method')}
                            onChange={(e) => handleEditCell(result.line_num, 'close_method', e.target.value)}
                            style={{
                              padding: '6px',
                              background: '#1f2937',
                              color: '#e5e7eb',
                              border: '1px solid #4a5568',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          >
                            <option value="">- Seleccionar -</option>
                            <option value="BTC">BTC</option>
                            <option value="Expired">Expired</option>
                            <option value="Assigned">Assigned</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={getEditedValue(result, 'close_date') === 'OPEN' ? '' : getEditedValue(result, 'close_date')}
                            onChange={(e) => handleEditCell(result.line_num, 'close_date', e.target.value)}
                            style={{
                              padding: '6px',
                              background: '#1f2937',
                              color: '#e5e7eb',
                              border: '1px solid #4a5568',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          />
                          <button
                            onClick={() => handleEditCell(result.line_num, 'close_date', 'OPEN')}
                            style={{
                              marginTop: '4px',
                              padding: '4px 8px',
                              background: '#2d3748',
                              color: '#e5e7eb',
                              border: '1px solid #4a5568',
                              borderRadius: '4px',
                              width: '100%',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            OPEN
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={getEditedValue(result, 'close_price')}
                            onChange={(e) => handleEditCell(result.line_num, 'close_price', e.target.value)}
                            placeholder="0.00"
                            style={{
                              padding: '6px',
                              background: '#1f2937',
                              color: '#e5e7eb',
                              border: '1px solid #4a5568',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '12px',
                          color: result.pl && result.pl > 0 ? '#10b981' : result.pl && result.pl < 0 ? '#f59e0b' : '#9ca3af',
                          fontWeight: 'bold'
                        }}>
                          {result.pl ? result.pl.toFixed(2) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleDeleteTrade(result.line_num)}
                            style={{
                              padding: '6px 10px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleConfirmSingle(result.line_num)}
                            style={{
                              padding: '6px 10px',
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Confirmar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedTrades.size > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              {loading ? 'Importando...' : ` Confirmar Importación (${selectedTrades.size} selected)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
