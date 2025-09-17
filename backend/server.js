const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const agentOrchestrator = require('./services/agentOrchestrator');
const TradingLogger = require('./services/tradingLogger');
const AnalyticsEngine = require('./services/analyticsEngine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize Trading Logger and Analytics Engine
const tradingLogger = new TradingLogger();
const analyticsEngine = new AnalyticsEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api', apiRoutes);

// Static files for analytics dashboard
app.use('/analytics', express.static(path.join(__dirname, 'public/analytics')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nifty Trading System Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      '/api/signal': 'Get current trading signal',
      '/api/market-data': 'Get market data',
      '/api/nifty50-stocks': 'Get Nifty 50 stocks',
      '/api/historical/:symbol': 'Get historical data',
      '/api/technical-indicators/:symbol': 'Get technical indicators', 
      '/api/agent/:agentType': 'Run specific agent',
      '/api/health': 'Health check',
      '/api/docs': 'API documentation',
      '/api/latest-signal': 'Get latest cached signal',
      '/health': 'Quick health check'
    }
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send latest signal if available
  if (latestTradingSignal) {
    socket.emit('tradingSignal', latestTradingSignal);
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global variable to store the latest trading signal
let latestTradingSignal = null;

// Cron job - Run analysis every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running 15-minute analysis...');
  try {
    const signal = await agentOrchestrator.runAnalysis();
    latestTradingSignal = signal;
    
    // Log the trading signal for analytics
    if (signal && signal.signal) {
      await tradingLogger.logTradingSuggestion(signal);
    }
    
    // Broadcast to all connected clients
    io.emit('tradingSignal', signal);
    console.log('Trading signal broadcasted:', signal);
  } catch (error) {
    console.error('Error in scheduled analysis:', error);
  }
});

// Endpoint to get latest signal
app.get('/api/latest-signal', (req, res) => {
  res.json(latestTradingSignal || { status: 'No signal available yet' });
});

// Analytics endpoints
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const summary = await tradingLogger.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

app.get('/api/analytics/agent/:agentName', async (req, res) => {
  try {
    const analytics = await tradingLogger.getAgentAnalytics(req.params.agentName);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting agent analytics:', error);
    res.status(500).json({ error: 'Failed to get agent analytics' });
  }
});

// Enhanced Analytics endpoints with Analytics Engine
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const overview = await analyticsEngine.getSystemOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Analytics API Routes
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const overview = await tradingLogger.getPerformanceSummary();
    res.json(overview);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

app.get('/api/analytics/agents', async (req, res) => {
  try {
    // Get all agent analytics
    const agentNames = ['multi-agent', 'technical', 'sentiment', 'research', 'risk'];
    const agents = [];
    
    for (const agentName of agentNames) {
      try {
        const analytics = await tradingLogger.getAgentAnalytics(agentName);
        if (analytics) {
          agents.push({
            name: agentName,
            totalSignals: analytics.totalSignals || 0,
            successRate: analytics.successRate || 0,
            totalPnL: analytics.totalPnL || 0,
            grade: analytics.grade || 'N/A'
          });
        }
      } catch (err) {
        console.log(`No data for agent ${agentName}`);
      }
    }
    
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    res.status(500).json({ error: 'Failed to fetch agent performance' });
  }
});

app.get('/api/analytics/charts', async (req, res) => {
  try {
    const { timeframe = '1d' } = req.query;
    // For now, return mock data until we have enough real data
    const chartData = {
      confidenceData: [],
      timeframeData: [0, 0, 0, 0],
      signalDistribution: [0, 0, 0],
      dailyTrends: {
        dates: [],
        successRates: [],
        pnlValues: []
      },
      pnlDistribution: {
        labels: [],
        values: []
      }
    };
    
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

app.get('/api/analytics/alerts', async (req, res) => {
  try {
    const alerts = await tradingLogger.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Legacy analytics endpoints (keeping for backward compatibility)
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const summary = await tradingLogger.getPerformanceSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

app.get('/api/analytics/agent/:agentName', async (req, res) => {
  try {
    const analytics = await tradingLogger.getAgentAnalytics(req.params.agentName);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting agent analytics:', error);
    res.status(500).json({ error: 'Failed to get agent analytics' });
  }
});

// Manual outcome recording for testing
app.post('/api/analytics/record-outcome', async (req, res) => {
  try {
    const { suggestionId, actualPrice, additionalData } = req.body;
    const result = await tradingLogger.recordOutcome(suggestionId, actualPrice, additionalData);
    res.json(result);
  } catch (error) {
    console.error('Error recording outcome:', error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Nifty 50 Trading System Backend Started');
  console.log(`Analytics dashboard available at http://localhost:${PORT}/analytics/analytics.html`);
  
  // Initialize Trading Logger and Analytics Engine
  try {
    await tradingLogger.initialize();
    await analyticsEngine.initialize();
    console.log('✅ Trading Logger and Analytics Engine initialized');
  } catch (error) {
    console.error('❌ Analytics initialization failed:', error);
  }
  
  // Run initial analysis
  setTimeout(async () => {
    try {
      const signal = await agentOrchestrator.runAnalysis();
      latestTradingSignal = signal;
      
      // Log initial signal
      if (signal && signal.signal) {
        await tradingLogger.logTradingSuggestion(signal);
      }
      
      console.log('Initial analysis completed:', signal);
    } catch (error) {
      console.error('Error in initial analysis:', error);
    }
  }, 5000);
});

module.exports = { app, io };