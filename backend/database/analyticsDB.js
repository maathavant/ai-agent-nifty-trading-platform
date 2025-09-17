const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Analytics Database Manager
 * Handles all persistence operations for trading suggestions, outcomes, and performance metrics
 */
class AnalyticsDB {
  constructor() {
    this.dbPath = path.join(__dirname, 'analytics.db');
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Connect to database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err.message);
          throw err;
        }
        console.log('✅ Connected to Analytics SQLite database');
      });

      // Create tables using schema
      await this.createTables();
      this.isInitialized = true;
      
      console.log('✅ Analytics database initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables from schema
   */
  async createTables() {
    const schemaPath = path.join(__dirname, 'analytics_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Analytics schema file not found');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await this.runQuery(statement);
      }
    }
  }

  /**
   * Run a SQL query with promise wrapper
   */
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, lastID: this.lastID });
        }
      });
    });
  }

  /**
   * Get query results with promise wrapper
   */
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all query results with promise wrapper
   */
  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Store a trading suggestion
   */
  async storeTradingSuggestion(suggestion) {
    try {
      const suggestionId = uuidv4();
      const expiresAt = this.calculateExpiryTime(suggestion.timeframe);

      const sql = `
        INSERT INTO trading_suggestions (
          suggestion_id, agent_name, signal, confidence, target_price, stop_loss,
          reasoning, market_price, timeframe, data_quality, expires_at,
          market_conditions, technical_indicators, fundamental_data,
          global_sentiment, volatility_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        suggestionId,
        suggestion.agent,
        suggestion.signal,
        suggestion.confidence,
        suggestion.targetPrice || null,
        suggestion.stopLoss || null,
        suggestion.reasoning,
        suggestion.marketPrice,
        suggestion.timeframe,
        suggestion.dataQuality || 'MEDIUM',
        expiresAt,
        JSON.stringify(suggestion.marketConditions || {}),
        JSON.stringify(suggestion.technicalIndicators || {}),
        JSON.stringify(suggestion.fundamentalData || {}),
        suggestion.globalSentiment || null,
        suggestion.volatilityLevel || null
      ];

      const result = await this.runQuery(sql, params);
      
      console.log(`✅ Stored trading suggestion: ${suggestionId} (${suggestion.agent}: ${suggestion.signal})`);
      
      return {
        suggestionId,
        success: true,
        recordId: result.lastID
      };

    } catch (error) {
      console.error('❌ Error storing trading suggestion:', error);
      throw error;
    }
  }

  /**
   * Record actual market outcome for a suggestion
   */
  async recordActualOutcome(suggestionId, outcome) {
    try {
      // Get original suggestion for comparison
      const suggestion = await this.getSuggestion(suggestionId);
      
      if (!suggestion) {
        throw new Error(`Suggestion ${suggestionId} not found`);
      }

      const timeElapsed = Math.floor((Date.now() - new Date(suggestion.created_at).getTime()) / (1000 * 60));
      const priceChange = ((outcome.actualPrice - suggestion.market_price) / suggestion.market_price) * 100;
      const priceDirection = priceChange > 0.1 ? 'UP' : priceChange < -0.1 ? 'DOWN' : 'FLAT';
      
      // Calculate if prediction was correct
      const isCorrect = this.evaluatePredictionAccuracy(suggestion, outcome, priceDirection);
      const accuracyScore = this.calculateAccuracyScore(suggestion, outcome, priceChange);
      const profitLoss = this.calculateProfitLoss(suggestion, outcome, priceChange);

      const sql = `
        INSERT INTO actual_outcomes (
          suggestion_id, outcome_type, actual_price, price_change, price_direction,
          time_elapsed, is_correct, accuracy_score, profit_loss, market_volatility, volume_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        suggestionId,
        outcome.outcomeType || 'PRICE_MOVEMENT',
        outcome.actualPrice,
        priceChange,
        priceDirection,
        timeElapsed,
        isCorrect,
        accuracyScore,
        profitLoss,
        outcome.marketVolatility || null,
        JSON.stringify(outcome.volumeData || {})
      ];

      const result = await this.runQuery(sql, params);
      
      console.log(`✅ Recorded outcome for ${suggestionId}: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (${accuracyScore.toFixed(1)}%)`);
      
      // Update performance metrics
      await this.updatePerformanceMetrics(suggestion.agent_name);
      
      return {
        success: true,
        isCorrect,
        accuracyScore,
        profitLoss,
        recordId: result.lastID
      };

    } catch (error) {
      console.error('❌ Error recording actual outcome:', error);
      throw error;
    }
  }

  /**
   * Get suggestion by ID
   */
  async getSuggestion(suggestionId) {
    const sql = 'SELECT * FROM trading_suggestions WHERE suggestion_id = ?';
    return await this.getQuery(sql, [suggestionId]);
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentName, period = 'MONTHLY') {
    const sql = `
      SELECT * FROM performance_metrics 
      WHERE agent_name = ? AND metric_period = ?
      ORDER BY period_start DESC
      LIMIT 1
    `;
    return await this.getQuery(sql, [agentName, period]);
  }

  /**
   * Get system-wide analytics
   */
  async getSystemAnalytics(days = 30) {
    const sql = `
      SELECT * FROM system_analytics 
      WHERE date >= date('now', '-${days} days')
      ORDER BY date DESC
    `;
    return await this.allQuery(sql);
  }

  /**
   * Get recent suggestions with outcomes
   */
  async getRecentSuggestionsWithOutcomes(limit = 50) {
    const sql = `
      SELECT 
        ts.*,
        ao.actual_price,
        ao.price_change,
        ao.is_correct,
        ao.accuracy_score,
        ao.profit_loss,
        ao.recorded_at as outcome_time
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      ORDER BY ts.created_at DESC
      LIMIT ?
    `;
    return await this.allQuery(sql, [limit]);
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformanceSummary() {
    const sql = `
      SELECT * FROM agent_performance_summary
      ORDER BY accuracy_rate DESC
    `;
    return await this.allQuery(sql);
  }

  /**
   * Get daily performance data
   */
  async getDailyPerformance(days = 30) {
    const sql = `
      SELECT * FROM daily_performance
      WHERE date >= date('now', '-${days} days')
      ORDER BY date DESC
    `;
    return await this.allQuery(sql, [days]);
  }

  /**
   * Get confidence accuracy analysis
   */
  async getConfidenceAccuracyAnalysis() {
    const sql = 'SELECT * FROM confidence_accuracy_analysis';
    return await this.allQuery(sql);
  }

  /**
   * Update performance metrics for an agent
   */
  async updatePerformanceMetrics(agentName) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Calculate metrics for the last 30 days
      const metrics = await this.calculateAgentMetrics(agentName, thirtyDaysAgo, today);
      
      // Insert or update metrics
      const sql = `
        INSERT OR REPLACE INTO performance_metrics (
          agent_name, metric_period, period_start, period_end,
          total_suggestions, correct_predictions, incorrect_predictions,
          overall_accuracy, buy_signal_accuracy, sell_signal_accuracy, hold_signal_accuracy,
          avg_confidence, high_confidence_accuracy, medium_confidence_accuracy, low_confidence_accuracy,
          avg_profit_loss, total_profit_loss, win_rate, avg_holding_time,
          high_quality_accuracy, medium_quality_accuracy, low_quality_accuracy,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        agentName, 'MONTHLY', thirtyDaysAgo, today,
        metrics.totalSuggestions, metrics.correctPredictions, metrics.incorrectPredictions,
        metrics.overallAccuracy, metrics.buySignalAccuracy, metrics.sellSignalAccuracy, metrics.holdSignalAccuracy,
        metrics.avgConfidence, metrics.highConfidenceAccuracy, metrics.mediumConfidenceAccuracy, metrics.lowConfidenceAccuracy,
        metrics.avgProfitLoss, metrics.totalProfitLoss, metrics.winRate, metrics.avgHoldingTime,
        metrics.highQualityAccuracy, metrics.mediumQualityAccuracy, metrics.lowQualityAccuracy
      ];

      await this.runQuery(sql, params);
      
      console.log(`✅ Updated performance metrics for ${agentName}`);

    } catch (error) {
      console.error(`❌ Error updating performance metrics for ${agentName}:`, error);
    }
  }

  /**
   * Calculate agent metrics for a given period
   */
  async calculateAgentMetrics(agentName, startDate, endDate) {
    const sql = `
      SELECT 
        ts.*,
        ao.is_correct,
        ao.profit_loss,
        ao.time_elapsed
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.agent_name = ? 
        AND DATE(ts.created_at) BETWEEN ? AND ?
    `;
    
    const suggestions = await this.allQuery(sql, [agentName, startDate, endDate]);
    
    const metrics = {
      totalSuggestions: suggestions.length,
      correctPredictions: 0,
      incorrectPredictions: 0,
      overallAccuracy: 0,
      buySignalAccuracy: 0,
      sellSignalAccuracy: 0,
      holdSignalAccuracy: 0,
      avgConfidence: 0,
      highConfidenceAccuracy: 0,
      mediumConfidenceAccuracy: 0,
      lowConfidenceAccuracy: 0,
      avgProfitLoss: 0,
      totalProfitLoss: 0,
      winRate: 0,
      avgHoldingTime: 0,
      highQualityAccuracy: 0,
      mediumQualityAccuracy: 0,
      lowQualityAccuracy: 0
    };

    if (suggestions.length === 0) return metrics;

    // Calculate basic metrics
    let totalConfidence = 0;
    let totalProfitLoss = 0;
    let totalHoldingTime = 0;
    let winningTrades = 0;
    let validOutcomes = 0;

    // Signal-specific counts
    const signalStats = { BUY: { total: 0, correct: 0 }, SELL: { total: 0, correct: 0 }, HOLD: { total: 0, correct: 0 }};
    const confidenceStats = { high: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, low: { total: 0, correct: 0 }};
    const qualityStats = { HIGH: { total: 0, correct: 0 }, MEDIUM: { total: 0, correct: 0 }, LOW: { total: 0, correct: 0 }};

    suggestions.forEach(suggestion => {
      totalConfidence += suggestion.confidence;
      
      // Signal stats
      signalStats[suggestion.signal].total++;
      
      // Confidence stats
      const confidenceLevel = suggestion.confidence >= 80 ? 'high' : suggestion.confidence >= 50 ? 'medium' : 'low';
      confidenceStats[confidenceLevel].total++;
      
      // Quality stats
      if (suggestion.data_quality) {
        qualityStats[suggestion.data_quality].total++;
      }

      if (suggestion.is_correct !== null) {
        validOutcomes++;
        
        if (suggestion.is_correct) {
          metrics.correctPredictions++;
          signalStats[suggestion.signal].correct++;
          confidenceStats[confidenceLevel].correct++;
          if (suggestion.data_quality) {
            qualityStats[suggestion.data_quality].correct++;
          }
        } else {
          metrics.incorrectPredictions++;
        }

        if (suggestion.profit_loss !== null) {
          totalProfitLoss += suggestion.profit_loss;
          if (suggestion.profit_loss > 0) winningTrades++;
        }

        if (suggestion.time_elapsed !== null) {
          totalHoldingTime += suggestion.time_elapsed;
        }
      }
    });

    // Calculate percentages
    metrics.avgConfidence = totalConfidence / suggestions.length;
    metrics.overallAccuracy = validOutcomes > 0 ? (metrics.correctPredictions / validOutcomes) * 100 : 0;
    
    metrics.buySignalAccuracy = signalStats.BUY.total > 0 ? (signalStats.BUY.correct / signalStats.BUY.total) * 100 : 0;
    metrics.sellSignalAccuracy = signalStats.SELL.total > 0 ? (signalStats.SELL.correct / signalStats.SELL.total) * 100 : 0;
    metrics.holdSignalAccuracy = signalStats.HOLD.total > 0 ? (signalStats.HOLD.correct / signalStats.HOLD.total) * 100 : 0;
    
    metrics.highConfidenceAccuracy = confidenceStats.high.total > 0 ? (confidenceStats.high.correct / confidenceStats.high.total) * 100 : 0;
    metrics.mediumConfidenceAccuracy = confidenceStats.medium.total > 0 ? (confidenceStats.medium.correct / confidenceStats.medium.total) * 100 : 0;
    metrics.lowConfidenceAccuracy = confidenceStats.low.total > 0 ? (confidenceStats.low.correct / confidenceStats.low.total) * 100 : 0;
    
    metrics.highQualityAccuracy = qualityStats.HIGH.total > 0 ? (qualityStats.HIGH.correct / qualityStats.HIGH.total) * 100 : 0;
    metrics.mediumQualityAccuracy = qualityStats.MEDIUM.total > 0 ? (qualityStats.MEDIUM.correct / qualityStats.MEDIUM.total) * 100 : 0;
    metrics.lowQualityAccuracy = qualityStats.LOW.total > 0 ? (qualityStats.LOW.correct / qualityStats.LOW.total) * 100 : 0;
    
    metrics.avgProfitLoss = validOutcomes > 0 ? totalProfitLoss / validOutcomes : 0;
    metrics.totalProfitLoss = totalProfitLoss;
    metrics.winRate = validOutcomes > 0 ? (winningTrades / validOutcomes) * 100 : 0;
    metrics.avgHoldingTime = validOutcomes > 0 ? totalHoldingTime / validOutcomes : 0;

    return metrics;
  }

  /**
   * Create performance alert
   */
  async createAlert(alertType, severity, agentName, message, thresholdValue, actualValue) {
    const sql = `
      INSERT INTO performance_alerts (
        alert_type, severity, agent_name, message, threshold_value, actual_value
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [alertType, severity, agentName, message, thresholdValue, actualValue];
    const result = await this.runQuery(sql, params);
    
    console.log(`🚨 Created ${severity} alert: ${alertType} for ${agentName}`);
    return result.lastID;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    const sql = `
      SELECT * FROM performance_alerts 
      WHERE is_resolved = FALSE 
      ORDER BY severity DESC, created_at DESC
    `;
    return await this.allQuery(sql);
  }

  /**
   * Calculate expiry time based on timeframe
   */
  calculateExpiryTime(timeframe) {
    const now = new Date();
    const minutes = timeframe === '15min' ? 15 : 
                   timeframe === '1hour' ? 60 :
                   timeframe === '4hour' ? 240 :
                   timeframe === '1day' ? 1440 : 60;
    
    return new Date(now.getTime() + minutes * 60 * 1000).toISOString();
  }

  /**
   * Evaluate if prediction was correct
   */
  evaluatePredictionAccuracy(suggestion, outcome, priceDirection) {
    switch (suggestion.signal) {
      case 'BUY':
        return priceDirection === 'UP';
      case 'SELL':
        return priceDirection === 'DOWN';
      case 'HOLD':
        return priceDirection === 'FLAT';
      default:
        return false;
    }
  }

  /**
   * Calculate accuracy score (0-100)
   */
  calculateAccuracyScore(suggestion, outcome, priceChange) {
    const absChange = Math.abs(priceChange);
    
    if (suggestion.signal === 'HOLD') {
      // For HOLD signals, accuracy decreases with larger movements
      return Math.max(0, 100 - absChange * 10);
    } else {
      // For BUY/SELL signals, accuracy increases with correct direction movement
      const isCorrectDirection = (suggestion.signal === 'BUY' && priceChange > 0) || 
                                (suggestion.signal === 'SELL' && priceChange < 0);
      
      if (isCorrectDirection) {
        return Math.min(100, 60 + absChange * 5); // Base 60% + movement bonus
      } else {
        return Math.max(0, 40 - absChange * 5); // Penalty for wrong direction
      }
    }
  }

  /**
   * Calculate theoretical profit/loss
   */
  calculateProfitLoss(suggestion, outcome, priceChange) {
    switch (suggestion.signal) {
      case 'BUY':
        return priceChange; // Long position
      case 'SELL':
        return -priceChange; // Short position
      case 'HOLD':
        return 0; // No position
      default:
        return 0;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Analytics database connection closed');
        }
      });
    }
  }
}

module.exports = AnalyticsDB;