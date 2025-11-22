import React, { useEffect, useState, useContext } from 'react';
import { ActiveAccountContext } from '../context/ActiveAccountContext';

function PositionsPage() {
  const { activeAccount, loadingActiveAccount } = useContext(ActiveAccountContext);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');

  useEffect(() => {
    if (!activeAccount || loadingActiveAccount) return;
    setLoading(true);
    fetch(`/api/v1/positions?status=${statusFilter}`, {
      headers: {
        'X-Active-Account': activeAccount.account_id.toString()
      }
    })
      .then(res => res.json())
      .then(data => {
        setPositions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading positions", err);
        setLoading(false);
      });
  }, [statusFilter, activeAccount, loadingActiveAccount]);

  const groupedPositions = positions.reduce((acc, pos) => {
    const key = pos.symbol;
    if (!acc[key]) {
      acc[key] = {
        symbol: pos.symbol,
        totalShares: 0,
        totalCost: 0,
        origins: new Set(),
      };
    }
    acc[key].totalShares += pos.shares;
    acc[key].totalCost += pos.cost_basis_per_share * pos.shares;
    acc[key].origins.add(pos.wheel_id ? 'Asignación de Put' : 'Compra');
    return acc;
  }, {});

  const groupedArray = Object.values(groupedPositions).map(item => ({
    ...item,
    packages: Math.floor(item.totalShares / 100),
    avgCostPerShare: item.totalCost / item.totalShares,
    origin: Array.from(item.origins).join(', '),
  }));

  if (loading) return <div>Cargando posiciones...</div>;

  return (
    <div>
      <h2>Posiciones</h2>
      <label>
        Filtrar por estado:
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="OPEN">Abiertas</option>
          <option value="CLOSED">Cerradas</option>
        </select>
      </label>
      <table border="1" cellPadding="5" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Símbolo</th>
            <th>Acciones Totales</th>
            <th>Paquetes (100 acciones)</th>
            <th>Costo Promedio por Acción</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          {groupedArray.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>No hay posiciones</td>
            </tr>
          ) : (
            groupedArray.map(pos => (
              <tr key={pos.symbol}>
                <td>{pos.symbol}</td>
                <td>{pos.totalShares}</td>
                <td>{pos.packages}</td>
                <td>{pos.avgCostPerShare.toFixed(2)}</td>
                <td>{pos.origin}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PositionsPage;
