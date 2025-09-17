// Performance Tracker - Real-time validation and model optimization
const marketData = require('./marketData');

class PerformanceTracker {
  constructor() {
    this.predictions = [];
    this.results = [];
    this.modelWeights = {
      ai: 0.6,
      technical: 0.4,
      historical: 0.0
    };
    this.accuracyThresholds = {
      excellent: 80,
      good: 65,
      poor: 45
    };
    this.maxPredictions = 500; // Keep last 500 predictions
  }

  async trackPrediction(signal, confidence, targetPrice, timestamp, agentData) {
    const prediction = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signal: signal,
      confidence: confidence,
      targetPrice: targetPrice,
      timestamp: timestamp,
      actualOutcome: null,
      accuracy: null,
      validationTime: null,
      agentData: agentData,
      marketConditions: await this.captureMarketConditions()
    };
    
    this.predictions.push(prediction);
    
    // Clean up old predictions
    if (this.predictions.length > this.maxPredictions) {
      this.predictions = this.predictions.slice(-this.maxPredictions);
    }
    
    console.log(`📊 Tracking prediction ${prediction.id}: ${signal} (${confidence}% confidence)`);
    
    // Schedule validation after 15 minutes
    setTimeout(() => {
      this.validatePrediction(prediction.id);
    }, 15 * 60 * 1000);
    
    return prediction.id;
  }

  async captureMarketConditions() {
    try {
      const niftyData = await marketData.getNiftyIndexData();
      return {
        price: niftyData.currentPrice,
        volatility: ((niftyData.high - niftyData.low) / niftyData.currentPrice) * 100,
        volume: niftyData.volume,
        time: new Date().getHours(),
        changePercent: niftyData.changePercent
      };
    } catch (error) {
      return {
        price: 0,
        volatility: 0,
        volume: 0,
        time: new Date().getHours(),
        changePercent: 0
      };
    }
  }

  async validatePrediction(predictionId) {
    try {
      const prediction = this.predictions.find(p => p.id === predictionId);
      if (!prediction || prediction.actualOutcome !== null) return;
      
      console.log(`🔍 Validating prediction ${predictionId}...`);
      
      // Get current market price
      const currentData = await marketData.getNiftyIndexData();
      const actualPrice = currentData.currentPrice;
      
      // Calculate actual price movement
      const actualMove = ((actualPrice - prediction.targetPrice) / prediction.targetPrice) * 100;
      
      // Calculate accuracy based on signal vs actual movement
      const accuracy = this.calculateAccuracy(prediction.signal, actualMove, prediction.confidence);
      
      // Update prediction with results
      prediction.actualOutcome = actualMove;
      prediction.accuracy = accuracy;
      prediction.validationTime = new Date();
      prediction.actualPrice = actualPrice;
      
      // Add to results for analysis
      this.results.push({
        id: prediction.id,
        signal: prediction.signal,
        predicted: prediction.targetPrice,
        actual: actualPrice,
        accuracy: accuracy,
        confidence: prediction.confidence,
        timestamp: prediction.timestamp,
        validationTime: prediction.validationTime
      });
      
      console.log(`✅ Prediction ${predictionId} validated: ${accuracy.toFixed(1)}% accuracy`);
      
      // Adjust model weights based on performance
      this.adjustModelWeights(prediction);
      
      // Clean up old results
      if (this.results.length > this.maxPredictions) {
        this.results = this.results.slice(-this.maxPredictions);
      }
      
    } catch (error) {
      console.error(`❌ Error validating prediction ${predictionId}:`, error);
    }
  }

  calculateAccuracy(signal, actualMove, confidence) {
    let baseAccuracy = 0;
    
    // Calculate accuracy based on signal correctness
    if (signal === 'BUY' && actualMove > 0) {
      baseAccuracy = Math.min(100, 70 + (actualMove * 10)); // Reward larger positive moves
    } else if (signal === 'SELL' && actualMove < 0) {
      baseAccuracy = Math.min(100, 70 + (Math.abs(actualMove) * 10)); // Reward larger negative moves
    } else if (signal === 'HOLD' && Math.abs(actualMove) < 0.2) {
      baseAccuracy = 80; // Good accuracy for correctly predicting stability
    } else if (signal === 'HOLD' && Math.abs(actualMove) < 0.5) {
      baseAccuracy = 60; // Moderate accuracy for near-stable prediction
    } else {
      // Wrong signal
      baseAccuracy = Math.max(0, 30 - (Math.abs(actualMove) * 5)); // Penalty for wrong direction
    }
    
    // Adjust accuracy based on confidence calibration
    const confidenceAccuracy = this.calculateConfidenceAccuracy(confidence, baseAccuracy);
    
    return Math.max(0, Math.min(100, (baseAccuracy + confidenceAccuracy) / 2));
  }

  calculateConfidenceAccuracy(confidence, baseAccuracy) {
    // Reward well-calibrated confidence
    const confidenceError = Math.abs(confidence - baseAccuracy);
    
    if (confidenceError < 10) return 100; // Well calibrated
    if (confidenceError < 20) return 80;  // Reasonably calibrated
    if (confidenceError < 30) return 60;  // Poorly calibrated
    return 40; // Very poorly calibrated
  }

  adjustModelWeights(prediction) {
    const accuracy = prediction.accuracy;
    const agentData = prediction.agentData;
    
    // Get current model performance
    const recentAccuracy = this.getRecentAccuracy(20); // Last 20 predictions
    
    // Adjust weights based on performance
    if (accuracy > this.accuracyThresholds.excellent) {
      // Excellent prediction - slightly increase weight of contributing factors
      if (agentData.aiWeight > agentData.traditionalWeight && accuracy > recentAccuracy.overall) {
        this.modelWeights.ai = Math.min(0.8, this.modelWeights.ai + 0.02);
        this.modelWeights.technical = Math.max(0.2, this.modelWeights.technical - 0.02);
      }
    } else if (accuracy < this.accuracyThresholds.poor) {
      // Poor prediction - adjust weights
      if (agentData.aiWeight > agentData.traditionalWeight) {
        this.modelWeights.ai = Math.max(0.3, this.modelWeights.ai - 0.03);
        this.modelWeights.technical = Math.min(0.7, this.modelWeights.technical + 0.03);
      }
    }
    
    console.log(`🔧 Model weights adjusted: AI=${(this.modelWeights.ai*100).toFixed(0)}%, Technical=${(this.modelWeights.technical*100).toFixed(0)}%`);
  }

  getModelAccuracy() {
    const validPredictions = this.predictions.filter(p => p.actualOutcome !== null);
    if (validPredictions.length === 0) return 50; // No data
    
    const totalAccuracy = validPredictions.reduce((sum, p) => sum + p.accuracy, 0);
    return totalAccuracy / validPredictions.length;
  }

  getRecentAccuracy(count = 10) {
    const recentPredictions = this.predictions
      .filter(p => p.actualOutcome !== null)
      .slice(-count);
    
    if (recentPredictions.length === 0) {
      return { overall: 50, count: 0, trend: 'INSUFFICIENT_DATA' };
    }
    
    const totalAccuracy = recentPredictions.reduce((sum, p) => sum + p.accuracy, 0);
    const overallAccuracy = totalAccuracy / recentPredictions.length;
    
    // Calculate trend
    const firstHalf = recentPredictions.slice(0, Math.floor(recentPredictions.length / 2));
    const secondHalf = recentPredictions.slice(Math.floor(recentPredictions.length / 2));
    
    let trend = 'STABLE';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAccuracy = firstHalf.reduce((sum, p) => sum + p.accuracy, 0) / firstHalf.length;
      const secondAccuracy = secondHalf.reduce((sum, p) => sum + p.accuracy, 0) / secondHalf.length;
      
      if (secondAccuracy > firstAccuracy + 5) trend = 'IMPROVING';
      if (secondAccuracy < firstAccuracy - 5) trend = 'DECLINING';
    }
    
    return {
      overall: overallAccuracy,
      count: recentPredictions.length,
      trend: trend
    };
  }

  getPerformanceStats() {
    const validPredictions = this.predictions.filter(p => p.actualOutcome !== null);
    
    if (validPredictions.length === 0) {
      return {
        totalPredictions: 0,
        overallAccuracy: 50,
        bySignal: { BUY: 50, SELL: 50, HOLD: 50 },
        recentTrend: 'INSUFFICIENT_DATA',
        modelWeights: this.modelWeights
      };
    }
    
    // Calculate accuracy by signal type
    const bySignal = {
      BUY: this.calculateSignalAccuracy(validPredictions, 'BUY'),
      SELL: this.calculateSignalAccuracy(validPredictions, 'SELL'),
      HOLD: this.calculateSignalAccuracy(validPredictions, 'HOLD')
    };
    
    // Recent performance
    const recentAccuracy = this.getRecentAccuracy(20);
    
    return {
      totalPredictions: validPredictions.length,
      overallAccuracy: this.getModelAccuracy(),
      bySignal: bySignal,
      recentAccuracy: recentAccuracy.overall,
      recentTrend: recentAccuracy.trend,
      modelWeights: this.modelWeights,
      confidenceCalibration: this.calculateConfidenceCalibration(validPredictions)
    };
  }

  calculateSignalAccuracy(predictions, signal) {
    const signalPredictions = predictions.filter(p => p.signal === signal);
    if (signalPredictions.length === 0) return 50;
    
    const totalAccuracy = signalPredictions.reduce((sum, p) => sum + p.accuracy, 0);
    return totalAccuracy / signalPredictions.length;
  }

  calculateConfidenceCalibration(predictions) {
    // Group predictions by confidence ranges
    const ranges = [
      { min: 80, max: 100, predictions: [] },
      { min: 60, max: 79, predictions: [] },
      { min: 40, max: 59, predictions: [] },
      { min: 20, max: 39, predictions: [] }
    ];
    
    predictions.forEach(p => {
      const range = ranges.find(r => p.confidence >= r.min && p.confidence <= r.max);
      if (range) range.predictions.push(p);
    });
    
    const calibration = ranges.map(range => {
      if (range.predictions.length === 0) return { range: `${range.min}-${range.max}`, calibration: 0, count: 0 };
      
      const avgConfidence = range.predictions.reduce((sum, p) => sum + p.confidence, 0) / range.predictions.length;
      const avgAccuracy = range.predictions.reduce((sum, p) => sum + p.accuracy, 0) / range.predictions.length;
      
      return {
        range: `${range.min}-${range.max}`,
        calibration: Math.abs(avgConfidence - avgAccuracy),
        count: range.predictions.length,
        avgConfidence: avgConfidence,
        avgAccuracy: avgAccuracy
      };
    });
    
    return calibration;
  }

  getOptimalWeights() {
    return this.modelWeights;
  }

  // Method to export performance data for analysis
  exportPerformanceData() {
    return {
      predictions: this.predictions.filter(p => p.actualOutcome !== null),
      stats: this.getPerformanceStats(),
      weights: this.modelWeights,
      timestamp: new Date()
    };
  }
}

module.exports = PerformanceTracker;