// Market Data Service - Fetches real-time Nifty 50 data
const axios = require('axios');

class MarketDataService {
  constructor() {
    this.niftySymbols = [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'BHARTIARTL.NS', 'ICICIBANK.NS',
      'INFOSYS.NS', 'SBIN.NS', 'LICI.NS', 'ITC.NS', 'HINDUNILVR.NS',
      'LT.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
      'SUNPHARMA.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'BAJFINANCE.NS', 'NESTLEIND.NS'
    ];
    this.niftyIndex = '^NSEI';
  }

  // Fetch current Nifty 50 index data
  async getNiftyIndexData() {
    try {
      // Using Yahoo Finance API alternative or mock data
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${this.niftyIndex}`, {
        timeout: 10000
      });
      
      const data = response.data.chart.result[0];
      const meta = data.meta;
      const quote = data.indicators.quote[0];
      
      return {
        symbol: this.niftyIndex,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: quote.volume[quote.volume.length - 1],
        timestamp: new Date(),
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
        open: meta.regularMarketDayRange
      };
    } catch (error) {
      console.error('Error fetching Nifty index data:', error.message);
      // Return mock data if API fails
      return this.getMockNiftyData();
    }
  }

  // Fetch historical data for technical analysis
  async getHistoricalData(symbol = this.niftyIndex, period = '1d', interval = '5m') {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        params: {
          period1: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
          period2: Math.floor(Date.now() / 1000),
          interval: interval
        },
        timeout: 10000
      });

      const data = response.data.chart.result[0];
      const timestamps = data.timestamp;
      const quotes = data.indicators.quote[0];

      return timestamps.map((timestamp, index) => ({
        timestamp: new Date(timestamp * 1000),
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      })).filter(item => item.close !== null);
    } catch (error) {
      console.error('Error fetching historical data:', error.message);
      return this.getMockHistoricalData();
    }
  }

  // Get top Nifty 50 stocks performance
  async getTopNiftyStocks() {
    try {
      const stockPromises = this.niftySymbols.slice(0, 10).map(symbol => 
        this.getStockData(symbol)
      );
      
      const stocks = await Promise.all(stockPromises);
      return stocks.filter(stock => stock !== null).sort((a, b) => b.changePercent - a.changePercent);
    } catch (error) {
      console.error('Error fetching top Nifty stocks:', error.message);
      return this.getMockStocksData();
    }
  }

  async getStockData(symbol) {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        timeout: 5000
      });
      
      const data = response.data.chart.result[0];
      const meta = data.meta;
      
      return {
        symbol: symbol,
        name: meta.longName || symbol,
        currentPrice: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Mock data fallbacks
  getMockNiftyData() {
    const basePrice = 19500 + (Math.random() - 0.5) * 200;
    const change = (Math.random() - 0.5) * 100;
    
    return {
      symbol: '^NSEI',
      currentPrice: basePrice,
      previousClose: basePrice - change,
      change: change,
      changePercent: (change / (basePrice - change)) * 100,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      timestamp: new Date(),
      high: basePrice + Math.random() * 50,
      low: basePrice - Math.random() * 50,
      open: basePrice + (Math.random() - 0.5) * 30
    };
  }

  getMockHistoricalData() {
    const data = [];
    const basePrice = 19500;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.5) * 20;
      currentPrice += change;
      
      data.push({
        timestamp: new Date(Date.now() - (100 - i) * 5 * 60 * 1000),
        open: currentPrice - change,
        high: currentPrice + Math.random() * 10,
        low: currentPrice - Math.random() * 10,
        close: currentPrice,
        volume: Math.floor(Math.random() * 100000) + 50000
      });
    }
    
    return data;
  }

  getMockStocksData() {
    return [
      { symbol: 'RELIANCE.NS', name: 'Reliance Industries', currentPrice: 2450, change: 25, changePercent: 1.03, volume: 1500000 },
      { symbol: 'TCS.NS', name: 'Tata Consultancy Services', currentPrice: 3680, change: -15, changePercent: -0.41, volume: 800000 },
      { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', currentPrice: 1580, change: 12, changePercent: 0.77, volume: 2000000 },
      { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', currentPrice: 950, change: 8, changePercent: 0.85, volume: 1200000 },
      { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', currentPrice: 980, change: -5, changePercent: -0.51, volume: 1800000 }
    ];
  }

  // Calculate market sentiment based on multiple factors
  async getMarketSentiment() {
    try {
      const niftyData = await this.getNiftyIndexData();
      const topStocks = await this.getTopNiftyStocks();
      
      const advancers = topStocks.filter(stock => stock.changePercent > 0).length;
      const decliners = topStocks.filter(stock => stock.changePercent < 0).length;
      
      const sentimentScore = (advancers - decliners) / topStocks.length;
      
      let sentiment = 'NEUTRAL';
      if (sentimentScore > 0.3) sentiment = 'BULLISH';
      else if (sentimentScore < -0.3) sentiment = 'BEARISH';
      
      return {
        sentiment,
        score: sentimentScore,
        advancers,
        decliners,
        niftyChange: niftyData.changePercent,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error calculating market sentiment:', error.message);
      return {
        sentiment: 'NEUTRAL',
        score: 0,
        advancers: 5,
        decliners: 5,
        niftyChange: 0,
        timestamp: new Date()
      };
    }
  }
}

module.exports = new MarketDataService();