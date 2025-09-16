import React from 'react';

const MarketDataCard = ({ data }) => {
  if (!data) {
    return (
      <div className="card">
        <h3 className="font-bold font-xl mb-4">📊 Market Data</h3>
        <div className="text-center">
          <div className="loading-spinner"></div>
          <div className="mt-2 text-muted">Loading market data...</div>
        </div>
      </div>
    );
  }

  const getChangeColor = (change) => {
    if (change > 0) return '#4caf50';
    if (change < 0) return '#f44336';
    return '#ffa726';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="card">
      <h3 className="font-bold font-xl mb-4">📊 Market Data</h3>
      
      <div className="text-center mb-4">
        <div className="font-2xl font-bold mb-2">
          ₹{data.currentPrice || data.price || 'N/A'}
        </div>
        
        {(data.change !== undefined || data.changePercent !== undefined) && (
          <div className="font-large" style={{ color: getChangeColor(data.change || data.changePercent) }}>
            {getChangeIcon(data.change || data.changePercent)} 
            {data.change && ` ₹${data.change.toFixed(2)}`}
            {data.changePercent && ` (${data.changePercent.toFixed(2)}%)`}
          </div>
        )}
      </div>

      <div className="price-grid">
        {data.high && (
          <div className="price-item">
            <div className="price-label">Day High</div>
            <div className="price-value text-success">₹{data.high}</div>
          </div>
        )}
        
        {data.low && (
          <div className="price-item">
            <div className="price-label">Day Low</div>
            <div className="price-value text-danger">₹{data.low}</div>
          </div>
        )}
        
        {data.volume && (
          <div className="price-item">
            <div className="price-label">Volume</div>
            <div className="price-value">{formatVolume(data.volume)}</div>
          </div>
        )}
        
        {data.marketCap && (
          <div className="price-item">
            <div className="price-label">Market Cap</div>
            <div className="price-value">{formatVolume(data.marketCap)}</div>
          </div>
        )}
      </div>

      {data.timestamp && (
        <div className="mt-4 text-center text-muted" style={{ fontSize: '0.8rem' }}>
          Last Updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const formatVolume = (volume) => {
  if (volume >= 10000000) { // 1 crore
    return `${(volume / 10000000).toFixed(1)}Cr`;
  } else if (volume >= 100000) { // 1 lakh
    return `${(volume / 100000).toFixed(1)}L`;
  } else if (volume >= 1000) { // 1 thousand
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

export default MarketDataCard;