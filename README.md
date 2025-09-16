# Nifty 50 Multi-Agent Trading System

A sophisticated real-time trading system that uses multiple AI agents to analyze the Nifty 50 index and provide actionable trading signals with 15-minute refresh cycles.

## 🚀 Features

### Multi-Agent Analysis
- **Technical Analysis Agent**: RSI, MACD, Moving Averages, Bollinger Bands
- **Market Sentiment Agent**: Volume analysis, market breadth, sentiment scoring
- **Research Agent**: News analysis, fundamental data, economic indicators
- **Risk Management Agent**: Volatility assessment, position sizing, risk scoring

### Real-Time Capabilities
- **Live Market Data**: Yahoo Finance API integration
- **WebSocket Connections**: Real-time signal broadcasts
- **Auto-Refresh**: 15-minute analysis cycles
- **Price Predictions**: Target prices with confidence intervals

### Modern Web Interface
- **Responsive Dashboard**: Real-time trading signals and agent status
- **Live Charts**: Market data visualization
- **Agent Insights**: Individual agent analysis and recommendations
- **Connection Status**: Real-time connectivity monitoring

## 🏗️ Architecture

```
nifty-trading-system/
├── backend/              # Node.js Express server
│   ├── agents/          # AI trading agents
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   └── server.js        # Main server file
├── frontend/            # React dashboard
│   ├── src/
│   │   ├── components/  # React components
│   │   └── App.js       # Main app
│   └── package.json
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **Axios** for external API calls
- **node-cron** for scheduled analysis
- **Yahoo Finance API** for market data

### Frontend
- **React 18** with modern hooks
- **Socket.io-client** for real-time updates
- **Styled Components** for responsive design
- **Axios** for API communication

## ⚡ Quick Start

### Prerequisites
- Node.js 16+ and npm
- Internet connection for market data

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Dashboard available at `http://localhost:3000`

## 📊 API Endpoints

### Core Trading APIs
- `GET /api/signal` - Get current multi-agent trading signal
- `GET /api/market-data` - Get current Nifty index data
- `GET /api/nifty50-stocks` - Get all Nifty 50 stocks data
- `GET /api/historical/:symbol` - Get historical data
- `GET /api/technical-indicators/:symbol` - Get technical indicators

### Agent-Specific APIs
- `GET /api/agent/technical` - Run technical analysis agent
- `GET /api/agent/sentiment` - Run market sentiment agent
- `GET /api/agent/research` - Run research agent
- `GET /api/agent/risk` - Run risk management agent

### System APIs
- `GET /api/health` - Health check
- `GET /api/docs` - API documentation
- `GET /` - System overview

## 🤖 Agent Details

### Technical Analysis Agent
- **RSI Analysis**: Overbought/oversold conditions
- **MACD Signals**: Trend momentum and crossovers
- **Moving Averages**: SMA/EMA trend analysis
- **Bollinger Bands**: Volatility and price extremes
- **Volume Analysis**: Trading volume patterns

### Market Sentiment Agent
- **Sentiment Scoring**: Overall market mood analysis
- **Volume Analysis**: Unusual volume detection
- **Market Breadth**: Advance/decline ratios
- **Sector Rotation**: Cross-sector momentum

### Research Agent
- **News Analysis**: Market-moving news sentiment
- **Fundamental Data**: P/E ratios, financial metrics
- **Economic Indicators**: GDP, inflation, policy impact
- **Global Markets**: International market influence

### Risk Management Agent
- **Volatility Risk**: Historical and implied volatility
- **Liquidity Risk**: Market depth and spread analysis
- **Position Sizing**: Optimal trade size calculation
- **Stop-Loss**: Risk-adjusted exit strategies

## 📈 Signal Generation

### Signal Types
- **BUY**: Bullish sentiment across agents (>60% confidence)
- **SELL**: Bearish sentiment across agents (>60% confidence)
- **HOLD**: Mixed signals or low confidence (<60%)

### Confidence Calculation
```javascript
finalConfidence = (
  technicalWeight * technicalConfidence +
  sentimentWeight * sentimentConfidence +
  researchWeight * researchConfidence
) * riskAdjustment
```

### Agent Weights
- Technical Analysis: 35%
- Market Sentiment: 25%
- Research Analysis: 25%
- Risk Management: 15% (modifier)

## 🎯 Price Prediction

The system generates 15-minute price predictions using:
- **Technical indicators** (RSI, MACD momentum)
- **Sentiment analysis** (volume and breadth data)
- **Research factors** (news and fundamental analysis)
- **Risk adjustment** (volatility and market conditions)

### Prediction Output
- **Target Price**: Expected price in 15 minutes
- **Expected Move**: Percentage change prediction
- **Support/Resistance**: Key price levels
- **Confidence Score**: Prediction reliability (0-100%)

## 🔄 Real-Time Features

### Auto-Refresh Cycle
- **15-minute intervals**: Automated analysis execution
- **WebSocket broadcast**: Real-time signal distribution
- **Cache management**: Latest signals stored for quick access

### Live Updates
- **Connection status**: Real-time connectivity monitoring
- **Agent status**: Individual agent health and performance
- **Market data**: Live price and volume updates
- **Signal history**: Recent analysis results

## 🛡️ Error Handling

### Backend Resilience
- **API fallbacks**: Mock data when external APIs fail
- **Error boundaries**: Graceful degradation
- **Rate limiting**: API protection and optimization
- **Logging**: Comprehensive error tracking

### Frontend Robustness
- **Connection recovery**: Automatic reconnection
- **Error boundaries**: Component-level error handling
- **Loading states**: User feedback during operations
- **Offline support**: Basic functionality without connection

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
PORT=5000
NODE_ENV=development

# API Rate Limits
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Agent Configuration
Agents can be tuned by modifying their analysis parameters in the respective agent files:
- `agents/technicalAnalysis.js`
- `agents/marketSentiment.js`
- `agents/research.js`
- `agents/riskManagement.js`

## 📱 Mobile Support

The dashboard is fully responsive and optimized for:
- **Desktop**: Full feature set with multiple columns
- **Tablet**: Adapted layout with essential information
- **Mobile**: Compact view with swipe navigation

## 🔍 Monitoring

### System Health
- **API endpoints**: `/health` and `/api/health`
- **Connection status**: Real-time WebSocket monitoring
- **Agent performance**: Individual agent success rates
- **Market data quality**: Data freshness and accuracy

### Performance Metrics
- **Response times**: API endpoint performance
- **Analysis speed**: Agent execution times
- **Prediction accuracy**: Historical signal performance
- **System uptime**: Service availability tracking

## 🚀 Deployment

### Production Setup
1. **Environment**: Set `NODE_ENV=production`
2. **Process management**: Use PM2 or similar
3. **Reverse proxy**: Nginx for load balancing
4. **SSL/HTTPS**: Secure connections for production
5. **Monitoring**: Application performance monitoring

### Docker Support
```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-agent`
3. Commit changes: `git commit -am 'Add new sentiment agent'`
4. Push branch: `git push origin feature/new-agent`
5. Submit pull request

### Code Standards
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Testing**: Unit tests for agents and API endpoints
- **Documentation**: JSDoc for function documentation

## 📄 License

MIT License - see LICENSE file for details

## 🔗 API Documentation

For detailed API documentation with examples, visit: `http://localhost:5000/api/docs`

## 🆘 Support

### Common Issues
1. **Connection errors**: Check if backend server is running on port 5000
2. **No signals**: Verify internet connection for market data access
3. **Performance issues**: Check system resources and API rate limits

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in backend environment.

---

**Built with ❤️ for Indian stock market traders**