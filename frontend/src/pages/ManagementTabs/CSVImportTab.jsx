import React, { useState } from 'react';

export default function CSVImportTab() {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setReport(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/trades/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setReport(data);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Importar Trades desde CSV</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <input type="file" accept=".csv" onChange={handleFileChange} className="form-control" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {error && <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>}

      {report && (
        <div style={{ backgroundColor: '#1a1d29', padding: '20px', borderRadius: '8px', border: '1px solid #2d3748' }}>
          <h3>Reporte de Importación</h3>
          <p> Trades importados: <strong>{report.imported_count}</strong></p>
          {report.errors && report.errors.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4 style={{ color: '#f59e0b' }}> Errores encontrados:</h4>
              <ul style={{ color: '#9ca3af' }}>
                {report.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
