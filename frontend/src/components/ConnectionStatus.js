import React from 'react';

const ConnectionStatus = ({ connected, lastUpdate, onRefresh, loading }) => {
  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="connection-status">
      <div className="connection-content">
        <div className="connection-info">
          <div className="connection-item">
            <span className={`status-indicator ${connected ? 'status-online' : 'status-offline'}`}></span>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {lastUpdate && (
            <div className="connection-item">
              <span>📊</span>
              <span>Last Update: {formatTime(lastUpdate)} ({getTimeAgo(lastUpdate)})</span>
            </div>
          )}
          
          <div className="connection-item">
            <span>🔄</span>
            <span>Auto-refresh: 15 minutes</span>
          </div>
        </div>
        
        <button 
          className="refresh-button"
          onClick={onRefresh}
          disabled={loading || !connected}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Refresh Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;