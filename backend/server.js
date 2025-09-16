const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const agentOrchestrator = require('./services/agentOrchestrator');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Nifty 50 Trading System Backend Started');
  
  // Run initial analysis
  setTimeout(async () => {
    try {
      const signal = await agentOrchestrator.runAnalysis();
      latestTradingSignal = signal;
      console.log('Initial analysis completed:', signal);
    } catch (error) {
      console.error('Error in initial analysis:', error);
    }
  }, 5000);
});

module.exports = { app, io };