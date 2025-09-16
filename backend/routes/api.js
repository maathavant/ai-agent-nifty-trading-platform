// Main API Routes for Nifty Trading System
const express = require('express');
const router = express.Router();
const agentOrchestrator = require('../services/agentOrchestrator');
const marketData = require('../services/marketData');

// Get current trading signal
router.get('/signal', async (req, res) => {
  try {
    console.log('API: Getting current trading signal...');
    const signal = await agentOrchestrator.runAnalysis();
    res.json({
      success: true,
      data: signal
    });
  } catch (error) {
    console.error('API Error - /signal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trading signal',
      message: error.message
    });
  }
});

// Get current market data
router.get('/market-data', async (req, res) => {
  try {
    console.log('API: Getting market data...');
    const data = await marketData.getNiftyIndexData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('API Error - /market-data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data',
      message: error.message
    });
  }
});

// Get Nifty 50 stocks data
router.get('/nifty50-stocks', async (req, res) => {
  try {
    console.log('API: Getting Nifty 50 stocks data...');
    const data = await marketData.getNifty50Stocks();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('API Error - /nifty50-stocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Nifty 50 stocks data',
      message: error.message
    });
  }
});

// Get historical data for specific stock
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1d', interval = '5m' } = req.query;
    
    console.log(`API: Getting historical data for ${symbol}...`);
    const data = await marketData.getHistoricalData(symbol, period, interval);
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error(`API Error - /historical/${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data',
      message: error.message
    });
  }
});

// Get technical indicators for a stock
router.get('/technical-indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`API: Getting technical indicators for ${symbol}...`);
    
    // Get historical data first
    const historicalData = await marketData.getHistoricalData(symbol, '1d', '5m');
    
    // Calculate basic technical indicators
    const indicators = calculateTechnicalIndicators(historicalData);
    
    res.json({
      success: true,
      data: {
        symbol: symbol,
        timestamp: new Date(),
        indicators: indicators
      }
    });
  } catch (error) {
    console.error(`API Error - /technical-indicators/${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate technical indicators',
      message: error.message
    });
  }
});

// Run specific agent analysis
router.get('/agent/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    console.log(`API: Running ${agentType} agent analysis...`);
    
    let result;
    const orchestrator = agentOrchestrator;
    
    switch (agentType.toLowerCase()) {
      case 'technical':
        result = await orchestrator.technicalAgent.analyze();
        break;
      case 'sentiment':
        result = await orchestrator.sentimentAgent.analyze();
        break;
      case 'research':
        result = await orchestrator.researchAgent.analyze();
        break;
      case 'risk':
        result = await orchestrator.riskAgent.analyze();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid agent type',
          message: 'Valid agents: technical, sentiment, research, risk'
        });
    }
    
    res.json({
      success: true,
      data: {
        agent: agentType,
        timestamp: new Date(),
        result: result
      }
    });
  } catch (error) {
    console.error(`API Error - /agent/${req.params.agentType}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to run ${req.params.agentType} agent`,
      message: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    message: 'Nifty Trading System API is running'
  });
});

// API Documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    title: 'Nifty Trading System API',
    version: '1.0.0',
    endpoints: {
      'GET /api/signal': 'Get current multi-agent trading signal',
      'GET /api/market-data': 'Get current Nifty index data',
      'GET /api/nifty50-stocks': 'Get all Nifty 50 stocks data',
      'GET /api/historical/:symbol': 'Get historical data for symbol (query: period, interval)',
      'GET /api/technical-indicators/:symbol': 'Get technical indicators for symbol',
      'GET /api/agent/:agentType': 'Run specific agent (technical, sentiment, research, risk)',
      'GET /api/health': 'Health check',
      'GET /api/docs': 'API documentation'
    },
    description: 'Multi-agent trading system API for Nifty 50 analysis and trading signals',
    features: [
      'Real-time market data',
      'Multi-agent analysis',
      'Technical indicators',
      'Market sentiment analysis',
      'Risk management',
      'Price predictions',
      '15-minute refresh cycle'
    ]
  });
});

// Helper function to calculate basic technical indicators
function calculateTechnicalIndicators(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return {
      error: 'No data available for calculations'
    };
  }

  try {
    const prices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);
    
    // Simple Moving Average (20 period)
    const sma20 = calculateSMA(prices, 20);
    
    // RSI (14 period)
    const rsi = calculateRSI(prices, 14);
    
    // Volume analysis
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    return {
      currentPrice: prices[prices.length - 1],
      sma20: sma20,
      rsi: rsi,
      volume: {
        current: currentVolume,
        average: avgVolume,
        ratio: volumeRatio,
        signal: volumeRatio > 1.5 ? 'HIGH' : volumeRatio < 0.5 ? 'LOW' : 'NORMAL'
      },
      trend: sma20 && prices[prices.length - 1] > sma20 ? 'BULLISH' : 'BEARISH',
      momentum: rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'
    };
  } catch (error) {
    return {
      error: 'Failed to calculate indicators',
      message: error.message
    };
  }
}

// Simple Moving Average calculation
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  
  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((acc, price) => acc + price, 0);
  return Math.round((sum / period) * 100) / 100;
}

// RSI calculation
function calculateRSI(prices, period = 14) {
  if (prices.length <= period) return 50; // Default neutral RSI
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

module.exports = router;