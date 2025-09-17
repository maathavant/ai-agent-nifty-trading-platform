// Historical Analysis Service - Pattern Recognition for Improved Accuracy
const marketData = require('./marketData');

class HistoricalAnalysis {
  constructor() {
    this.patterns = new Map();
    this.accuracy = new Map();
    this.historicalData = [];
    this.maxHistoryDays = 30;
  }

  async analyzeHistoricalPatterns(currentData) {
    try {
      console.log('📊 Analyzing historical patterns...');
      
      // Fetch historical data if not cached
      if (this.historicalData.length === 0) {
        await this.loadHistoricalData();
      }
      
      // Find similar market conditions
      const similarConditions = this.findSimilarConditions(currentData);
      
      // Calculate success rate of past signals
      const patternAccuracy = this.calculatePatternAccuracy(similarConditions);
      
      // Generate pattern-based confidence adjustment
      const confidenceAdjustment = this.calculateConfidenceAdjustment(patternAccuracy);
      
      return {
        similarCount: similarConditions.length,
        avgOutcome: this.calculateAvgOutcome(similarConditions),
        accuracy: patternAccuracy,
        confidence: this.calculateHistoricalConfidence(patternAccuracy),
        confidenceAdjustment: confidenceAdjustment,
        dominantPattern: this.identifyDominantPattern(similarConditions),
        riskAdjustment: this.calculateRiskAdjustment(similarConditions)
      };
    } catch (error) {
      console.error('❌ Historical Analysis Error:', error);
      return this.getFallbackHistoricalAnalysis();
    }
  }

  async loadHistoricalData() {
    // Simulate historical data loading
    // In real implementation, this would fetch from database or API
    console.log('📈 Loading historical market data...');
    
    this.historicalData = this.generateSimulatedHistoricalData();
    console.log(`✅ Loaded ${this.historicalData.length} historical data points`);
  }

  generateSimulatedHistoricalData() {
    const data = [];
    const now = new Date();
    
    // Generate 30 days of 15-minute intervals during market hours
    for (let day = 0; day < this.maxHistoryDays; day++) {
      const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate data for market hours (9:15 AM to 3:30 PM)
      for (let hour = 9; hour <= 15; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          if (hour === 9 && minute < 15) continue; // Market starts at 9:15
          if (hour === 15 && minute > 30) continue; // Market ends at 3:30
          
          data.push(this.generateDataPoint(date, hour, minute));
        }
      }
    }
    
    return data.reverse(); // Most recent first
  }

  generateDataPoint(date, hour, minute) {
    const basePrice = 19800 + Math.sin(date.getTime() / (24 * 60 * 60 * 1000)) * 200;
    const volatility = 0.5 + Math.random() * 2; // 0.5% to 2.5%
    const volume = 30000000 + Math.random() * 40000000; // 30M to 70M
    const momentum = (Math.random() - 0.5) * 2; // -1% to +1%
    
    return {
      timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute),
      price: basePrice,
      volatility: volatility,
      volume: volume,
      momentum: momentum,
      hour: hour,
      minute: minute,
      actualOutcome: (Math.random() - 0.5) * 1, // -0.5% to +0.5% 15-min move
      signal: Math.random() > 0.5 ? 'BUY' : Math.random() > 0.5 ? 'SELL' : 'HOLD'
    };
  }

  findSimilarConditions(current) {
    const threshold = {
      volatility: 0.5, // Within 0.5% volatility
      momentum: 0.3,   // Within 0.3% momentum
      volume: 0.3,     // Within 30% volume ratio
      time: 1          // Within 1 hour
    };

    return this.historicalData.filter(point => {
      const volSimilar = Math.abs(point.volatility - current.volatility) < threshold.volatility;
      const momentumSimilar = Math.abs(point.momentum - current.momentum) < threshold.momentum;
      const volumeSimilar = Math.abs((point.volume / 50000000) - current.volumeRatio) < threshold.volume;
      const timeSimilar = Math.abs(point.hour - current.hour) <= threshold.time;
      
      return volSimilar && momentumSimilar && volumeSimilar && timeSimilar;
    });
  }

  calculatePatternAccuracy(similarConditions) {
    if (similarConditions.length === 0) return 50; // No data = neutral accuracy
    
    const correctPredictions = similarConditions.filter(condition => {
      const predicted = condition.signal;
      const actual = condition.actualOutcome;
      
      if (predicted === 'BUY' && actual > 0) return true;
      if (predicted === 'SELL' && actual < 0) return true;
      if (predicted === 'HOLD' && Math.abs(actual) < 0.1) return true;
      
      return false;
    });
    
    return Math.round((correctPredictions.length / similarConditions.length) * 100);
  }

  calculateAvgOutcome(similarConditions) {
    if (similarConditions.length === 0) return 0;
    
    const totalOutcome = similarConditions.reduce((sum, condition) => 
      sum + condition.actualOutcome, 0
    );
    
    return totalOutcome / similarConditions.length;
  }

  calculateHistoricalConfidence(accuracy) {
    // Convert accuracy percentage to confidence adjustment
    if (accuracy >= 80) return 'HIGH';
    if (accuracy >= 60) return 'MEDIUM';
    return 'LOW';
  }

  calculateConfidenceAdjustment(accuracy) {
    // Adjust confidence based on historical accuracy
    if (accuracy >= 80) return 1.2; // Increase confidence by 20%
    if (accuracy >= 60) return 1.0; // Neutral
    if (accuracy >= 40) return 0.8; // Decrease confidence by 20%
    return 0.6; // Decrease confidence by 40%
  }

  identifyDominantPattern(similarConditions) {
    if (similarConditions.length === 0) return 'INSUFFICIENT_DATA';
    
    const signals = similarConditions.map(c => c.signal);
    const buyCount = signals.filter(s => s === 'BUY').length;
    const sellCount = signals.filter(s => s === 'SELL').length;
    const holdCount = signals.filter(s => s === 'HOLD').length;
    
    const max = Math.max(buyCount, sellCount, holdCount);
    
    if (max === buyCount) return 'BULLISH_PATTERN';
    if (max === sellCount) return 'BEARISH_PATTERN';
    return 'NEUTRAL_PATTERN';
  }

  calculateRiskAdjustment(similarConditions) {
    if (similarConditions.length === 0) return 1.0;
    
    const outcomes = similarConditions.map(c => Math.abs(c.actualOutcome));
    const avgVolatility = outcomes.reduce((sum, outcome) => sum + outcome, 0) / outcomes.length;
    
    // Higher historical volatility = higher risk adjustment
    if (avgVolatility > 0.5) return 1.3; // 30% risk increase
    if (avgVolatility > 0.3) return 1.1; // 10% risk increase
    return 1.0; // No adjustment
  }

  getFallbackHistoricalAnalysis() {
    return {
      similarCount: 0,
      avgOutcome: 0,
      accuracy: 50,
      confidence: 'MEDIUM',
      confidenceAdjustment: 1.0,
      dominantPattern: 'INSUFFICIENT_DATA',
      riskAdjustment: 1.0
    };
  }

  // Method to add new data point for learning
  addDataPoint(prediction, actualOutcome) {
    const dataPoint = {
      timestamp: new Date(),
      prediction: prediction,
      actualOutcome: actualOutcome,
      accuracy: this.calculatePredictionAccuracy(prediction, actualOutcome)
    };
    
    this.historicalData.unshift(dataPoint); // Add to beginning
    
    // Keep only recent data
    if (this.historicalData.length > 1000) {
      this.historicalData.pop();
    }
    
    console.log(`📊 Added new data point: Prediction=${prediction.signal}, Actual=${actualOutcome.toFixed(2)}%`);
  }

  calculatePredictionAccuracy(prediction, actual) {
    if (prediction.signal === 'BUY' && actual > 0) return 1;
    if (prediction.signal === 'SELL' && actual < 0) return 1;
    if (prediction.signal === 'HOLD' && Math.abs(actual) < 0.1) return 1;
    return 0;
  }

  getAccuracyStats() {
    const recentData = this.historicalData.slice(0, 100); // Last 100 predictions
    if (recentData.length === 0) return { overall: 50, recent: 50, trend: 'STABLE' };
    
    const overallAccuracy = this.calculatePatternAccuracy(this.historicalData);
    const recentAccuracy = this.calculatePatternAccuracy(recentData);
    
    let trend = 'STABLE';
    if (recentAccuracy > overallAccuracy + 5) trend = 'IMPROVING';
    if (recentAccuracy < overallAccuracy - 5) trend = 'DECLINING';
    
    return {
      overall: overallAccuracy,
      recent: recentAccuracy,
      trend: trend,
      dataPoints: this.historicalData.length
    };
  }
}

module.exports = HistoricalAnalysis;