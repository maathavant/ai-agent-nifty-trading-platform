import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">
            N50
          </div>
          <div>
            <div className="logo-text">Nifty Trading System</div>
            <div className="logo-subtitle">Multi-Agent Analysis Platform</div>
          </div>
        </div>
        
        <div className="header-stats">
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Real-time • 15min cycles • AI-powered
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;