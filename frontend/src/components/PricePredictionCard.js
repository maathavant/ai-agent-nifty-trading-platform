import React from 'react';

const PricePredictionCard = ({ prediction }) => {
  if (!prediction) {
    return null;
  }

  const getMovementColor = (expectedMove) => {
    if (expectedMove > 0) return '#4caf50';
    if (expectedMove < 0) return '#f44336';
    return '#ffa726';
  };

  const getMovementIcon = (expectedMove) => {
    if (expectedMove > 0.3) return '🚀';
    if (expectedMove > 0) return '📈';
    if (expectedMove < -0.3) return '💥';
    if (expectedMove < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="card">
      <h3 className="font-bold font-xl mb-4">🎯 Price Prediction</h3>
      
      <div className="text-center mb-4">
        <div className="font-2xl font-bold mb-2">
          ₹{prediction.targetPrice}
        </div>
        
        <div className="font-large mb-2" style={{ color: getMovementColor(prediction.expectedMove) }}>
          {getMovementIcon(prediction.expectedMove)} {prediction.expectedMove > 0 ? '+' : ''}{prediction.expectedMove}%
        </div>
        
        <div className="text-muted">
          Confidence: <span className="text-primary font-bold">{prediction.confidence}%</span>
        </div>
      </div>

      <div className="price-grid">
        <div className="price-item">
          <div className="price-label">Current Price</div>
          <div className="price-value">₹{prediction.currentPrice}</div>
        </div>
        
        <div className="price-item">
          <div className="price-label">Target Price</div>
          <div className="price-value text-primary">₹{prediction.targetPrice}</div>
        </div>
        
        <div className="price-item">
          <div className="price-label">Support Level</div>
          <div className="price-value text-success">₹{prediction.supportLevel}</div>
        </div>
        
        <div className="price-item">
          <div className="price-label">Resistance Level</div>
          <div className="price-value text-danger">₹{prediction.resistanceLevel}</div>
        </div>
      </div>

      {prediction.priceRange && (
        <div className="mt-4">
          <div className="text-muted mb-2 font-bold" style={{ fontSize: '0.9rem' }}>
            Expected Price Range ({prediction.timeframe}):
          </div>
          <div className="text-center">
            <span className="text-success font-bold">₹{prediction.priceRange.min}</span>
            <span className="text-muted mx-2">—</span>
            <span className="text-danger font-bold">₹{prediction.priceRange.max}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-muted" style={{ fontSize: '0.8rem' }}>
        Timeframe: {prediction.timeframe}
      </div>
    </div>
  );
};

export default PricePredictionCard;