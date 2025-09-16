import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-card">
      <div className="loading-spinner"></div>
      <div className="mt-4 text-primary font-bold">
        Loading Trading System...
      </div>
      <div className="mt-2 text-muted">
        Initializing agents and fetching market data
      </div>
    </div>
  );
};

export default LoadingScreen;