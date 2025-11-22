import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/App.css';
import TradesPage from './pages/TradesPage';
import PositionsPage from './pages/PositionsPage';
import WheelsPage from './pages/WheelsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ManagementPage from './pages/ManagementPage';
import PortfolioPage from './pages/PortfolioPage';
import { ActiveAccountProvider } from './context/ActiveAccountContext';
import ActiveAccountLabel from './pages/ActiveAccountLabel';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <div className="sidebar">
      <div className="logo">Options Wheel Tracker</div>
      <Link to="/trades" className={`nav-item ${isActive('/trades')}`}>
        <span></span> Trades
      </Link>
      <Link to="/positions" className={`nav-item ${isActive('/positions')}`}>
        <span></span> Positions
      </Link>
      <Link to="/wheels" className={`nav-item ${isActive('/wheels')}`}>
        <span></span> Wheels
      </Link>
      <Link to="/portfolio" className={`nav-item ${isActive('/portfolio')}`}>
        <span></span> Portfolio
      </Link>
      <Link to="/ticker" className={`nav-item ${isActive('/ticker')}`}>
        <span></span> Ticker Analysis
      </Link>
      <Link to="/analytics" className={`nav-item ${isActive('/analytics')}`}>
        <span></span> Analytics
      </Link>
      <Link to="/management" className={`nav-item ${isActive('/management')}`}>
        <span></span> Management
      </Link>
    </div>
  );
}

// Render principal sin banda
function App() {
  return (
    <ActiveAccountProvider>
      <Router>
        <div className="app" style={{ position: 'relative' }}>
          <Sidebar />
          <ActiveAccountLabel />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<TradesPage />} />
              <Route path="/trades" element={<TradesPage />} />
              <Route path="/positions" element={<PositionsPage />} />
              <Route path="/wheels" element={<WheelsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/management" element={<ManagementPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ActiveAccountProvider>
  );
}

export default App;
