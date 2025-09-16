import React from 'react';
import SignalCard from './SignalCard';
import AgentCard from './AgentCard';
import MarketDataCard from './MarketDataCard';
import PricePredictionCard from './PricePredictionCard';

const TradingDashboard = ({ tradingSignal, marketData, connected, onRefresh, loading }) => {
  if (!tradingSignal && !loading) {
    return (
      <div className="container">
        <div className="no-data-card">
          <h3 className="font-bold font-xl mb-2">⏳ Waiting for Signal</h3>
          <p className="text-muted mb-4">
            No trading signal available yet. The system will generate a signal within 15 minutes.
          </p>
          <button className="button" onClick={onRefresh} disabled={!connected}>
            Generate Signal Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-grid">
        {/* Main Signal Overview */}
        <div className="signal-overview">
          <SignalCard signal={tradingSignal} />
        </div>

        {/* Market Data and Price Prediction */}
        {marketData && (
          <MarketDataCard data={marketData} />
        )}
        
        {tradingSignal?.pricePrediction && (
          <PricePredictionCard prediction={tradingSignal.pricePrediction} />
        )}
      </div>

      {/* Agent Results Section */}
      {tradingSignal?.agentResults && (
        <div className="card">
          <h3 className="font-bold font-xl mb-4">🤖 Agent Analysis</h3>
          <div className="agents-section">
            <AgentCard 
              name="Technical Analysis"
              icon="📈"
              result={tradingSignal.agentResults.technical}
              description="RSI, MACD, Moving Averages"
            />
            <AgentCard 
              name="Market Sentiment"
              icon="📊"
              result={tradingSignal.agentResults.sentiment}
              description="Volume, Breadth, Sentiment"
            />
            <AgentCard 
              name="Research Analysis"
              icon="🔍"
              result={tradingSignal.agentResults.research}
              description="News, Fundamentals, Economy"
            />
            <AgentCard 
              name="Risk Management"
              icon="🛡️"
              result={tradingSignal.agentResults.risk}
              description="Volatility, Position Sizing"
            />
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {tradingSignal?.recommendations && tradingSignal.recommendations.length > 0 && (
        <div className="card">
          <h3 className="font-bold font-xl mb-4">💡 Recommendations</h3>
          <ul className="recommendations-list">
            {tradingSignal.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TradingDashboard;