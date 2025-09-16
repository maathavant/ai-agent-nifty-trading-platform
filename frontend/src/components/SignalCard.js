import React from 'react';

const SignalCard = ({ signal }) => {
  if (!signal) {
    return (
      <div className="card signal-card hold">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <div className="mt-4 font-bold">Generating Signal...</div>
        </div>
      </div>
    );
  }

  const getSignalClass = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy': return 'buy';
      case 'sell': return 'sell';
      default: return 'hold';
    }
  };

  const getSignalIcon = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      default: return '⏸️';
    }
  };

  const getSignalColor = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy': return '#4caf50';
      case 'sell': return '#f44336';
      default: return '#ffa726';
    }
  };

  return (
    <div className={`card signal-card ${getSignalClass(signal.signal)} pulse`}>
      <div className="text-center">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {getSignalIcon(signal.signal)}
        </div>
        
        <h2 className="font-2xl font-bold mb-2" style={{ color: getSignalColor(signal.signal) }}>
          {signal.signal || 'HOLD'}
        </h2>
        
        <div className="font-xl mb-4">
          Confidence: <span className="font-bold text-primary">{signal.confidence}%</span>
        </div>

        {signal.currentPrice && (
          <div className="font-large mb-4">
            Current Price: <span className="font-bold">₹{signal.currentPrice}</span>
          </div>
        )}

        {signal.reasoning && (
          <div className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
            {signal.reasoning}
          </div>
        )}

        {signal.timestamp && (
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
            Generated: {new Date(signal.timestamp).toLocaleString()}
          </div>
        )}

        {signal.nextAnalysis && (
          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
            Next Analysis: {new Date(signal.nextAnalysis).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Signal Strength Breakdown */}
      {signal.signalStrength && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-muted mb-2 font-bold" style={{ fontSize: '0.9rem' }}>
            Signal Strength Breakdown:
          </div>
          <div className="grid grid-3" style={{ gap: '8px' }}>
            <div className="text-center">
              <div style={{ color: '#4caf50', fontWeight: 'bold' }}>BUY</div>
              <div>{signal.signalStrength.BUY}%</div>
            </div>
            <div className="text-center">
              <div style={{ color: '#f44336', fontWeight: 'bold' }}>SELL</div>
              <div>{signal.signalStrength.SELL}%</div>
            </div>
            <div className="text-center">
              <div style={{ color: '#ffa726', fontWeight: 'bold' }}>HOLD</div>
              <div>{signal.signalStrength.HOLD}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalCard;