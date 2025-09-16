import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import TradingDashboard from './components/TradingDashboard';
import Header from './components/Header';
import ConnectionStatus from './components/ConnectionStatus';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradingSignal, setTradingSignal] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('tradingSignal', (signal) => {
      console.log('Received trading signal:', signal);
      setTradingSignal(signal);
      setLastUpdate(new Date());
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
      setError('Failed to connect to server');
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get latest signal
        const signalResponse = await axios.get(`${API_BASE_URL}/api/latest-signal`);
        if (signalResponse.data && signalResponse.data.signal) {
          setTradingSignal(signalResponse.data);
        }

        // Get market data
        const marketResponse = await axios.get(`${API_BASE_URL}/api/market-data`);
        if (marketResponse.data.success) {
          setMarketData(marketResponse.data.data);
        }

        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/signal`);
      if (response.data.success) {
        setTradingSignal(response.data.data);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Error refreshing signal:', err);
      setError('Failed to refresh trading signal');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tradingSignal) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Header />
        <ConnectionStatus 
          connected={connected} 
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          loading={loading}
        />
        
        {error && (
          <div className="container">
            <div className="card" style={{ borderLeft: '4px solid #f44336' }}>
              <div className="text-danger font-bold">Error</div>
              <div className="text-muted mt-1">{error}</div>
              <button 
                className="button mt-4" 
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}
        
        <TradingDashboard 
          tradingSignal={tradingSignal}
          marketData={marketData}
          connected={connected}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;