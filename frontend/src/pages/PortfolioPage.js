import React, { useEffect, useState } from 'react';

function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/portfolio')
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading portfolio", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando portfolio...</div>;

  if (portfolio.length === 0) return <div>No hay posiciones en el portfolio.</div>;

  return (
    <div>
      <h2>Portfolio consolidado</h2>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Símbolo</th>
            <th>Total Acciones</th>
            <th>Cuentas involucradas</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map(item => (
            <tr key={item.symbol}>
              <td>{item.symbol}</td>
              <td>{item.total_shares}</td>
              <td>{item.accounts.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioPage;
