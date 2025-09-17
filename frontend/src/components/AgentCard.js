import React from 'react';

const AgentCard = ({ name, icon, result, description }) => {
  if (!result) {
    return (
      <div className="agent-card">
        <div className="agent-header">
          <div className="agent-name">{icon} {name}</div>
          <div className="confidence-badge">Loading...</div>
        </div>
        <div className="text-muted">{description}</div>
        <div className="mt-4">
          <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
        </div>
      </div>
    );
  }

  const getSignalBadgeClass = (signal) => {
    if (!signal) return 'neutral';
    switch (signal.toLowerCase()) {
      case 'buy':
      case 'approve_trade':
        return 'buy';
      case 'sell':
        return 'sell';
      case 'hold':
      case 'cautious_trade':
        return 'hold';
      default:
        return 'neutral';
    }
  };

  const getSignalDisplay = (signal) => {
    if (!signal) return 'N/A';
    switch (signal.toLowerCase()) {
      case 'approve_trade': return 'APPROVE';
      case 'cautious_trade': return 'CAUTIOUS';
      case 'avoid_trade': return 'AVOID';
      default: return signal;
    }
  };

  return (
    <div className="agent-card">
      <div className="agent-header">
        <div className="agent-name">{icon} {name}</div>
        <div className="confidence-badge">
          {result.confidence || 0}%
        </div>
      </div>
      
      <div className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
        {description}
      </div>

      <div className="mb-4">
        <div className={`signal-badge ${getSignalBadgeClass(result.signal)}`}>
          <span>{getSignalDisplay(result.signal)}</span>
        </div>
      </div>

      {/* Agent-specific details */}
      {result.key_indicators && (
        <div className="mt-4">
          <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Key Indicators:
          </div>
          <div className="grid grid-2" style={{ gap: '8px', fontSize: '0.8rem' }}>
            {Object.entries(result.key_indicators).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'uppercase' }}>{key}:</span>
                <span className="font-bold">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.market_mood && (
        <div className="mt-4">
          <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Market Mood:
          </div>
          <div className="grid grid-2" style={{ gap: '8px', fontSize: '0.8rem' }}>
            {Object.entries(result.market_mood).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{key}:</span>
                <span className="font-bold">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.key_factors && (
        <div className="mt-4">
          <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Key Factors:
          </div>
          <div className="grid grid-2" style={{ gap: '8px', fontSize: '0.8rem' }}>
            {Object.entries(result.key_factors).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{key}:</span>
                <span className="font-bold">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.risk_level && (
        <div className="mt-4">
          <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Risk Assessment:
          </div>
          <div className="grid grid-2" style={{ gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Overall:</span>
              <span className={`font-bold ${
                (typeof result.risk_level === 'object' ? result.risk_level.overall || result.risk_level.level : result.risk_level) === 'HIGH' ? 'text-danger' : 
                (typeof result.risk_level === 'object' ? result.risk_level.overall || result.risk_level.level : result.risk_level) === 'MEDIUM' ? 'text-warning' : 'text-success'
              }`}>
                {typeof result.risk_level === 'object' ? 
                  (result.risk_level.overall || result.risk_level.level || 'N/A') : 
                  result.risk_level}
              </span>
            </div>
            {typeof result.risk_level === 'object' && result.risk_level.score && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Score:</span>
                <span className="font-bold">{result.risk_level.score}/100</span>
              </div>
            )}
            {typeof result.risk_level === 'object' && result.risk_level.factors && (
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Factors:</div>
                <div style={{ fontSize: '0.75rem' }}>
                  {Array.isArray(result.risk_level.factors) ? 
                    result.risk_level.factors.slice(0, 2).join(', ') :
                    typeof result.risk_level.factors === 'string' ? result.risk_level.factors :
                    'Various factors considered'
                  }
                </div>
              </div>
            )}
            {typeof result.risk_level === 'object' && result.risk_level.positiveFactors && (
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Positive Factors:</div>
                <div style={{ fontSize: '0.75rem' }}>
                  {Array.isArray(result.risk_level.positiveFactors) ? 
                    result.risk_level.positiveFactors.slice(0, 2).join(', ') :
                    typeof result.risk_level.positiveFactors === 'string' ? result.risk_level.positiveFactors :
                    'Positive indicators present'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="mt-4">
          <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
            Recommendations:
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
            {result.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '6px 10px', 
                marginBottom: '4px', 
                borderRadius: '4px',
                borderLeft: '2px solid rgba(0,255,136,0.5)'
              }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AgentCard;