const AnalyticsDB = require('../database/analyticsDB');

/**
 * Analytics Engine - Advanced analytics and performance calculations
 * Provides comprehensive performance metrics, success rates, and insights
 */
class AnalyticsEngine {
  constructor() {
    this.analyticsDB = new AnalyticsDB();
    this.isInitialized = false;
  }

  /**
   * Initialize the analytics engine
   */
  async initialize() {
    try {
      await this.analyticsDB.initialize();
      this.isInitialized = true;
      console.log('✅ Analytics Engine initialized');
    } catch (error) {
      console.error('❌ Analytics Engine initialization error:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive system analytics
   */
  async generateSystemAnalytics() {
    try {
      const analytics = {
        overview: await this.getSystemOverview(),
        agentPerformance: await this.getAgentPerformanceAnalysis(),
        confidenceAnalysis: await this.getConfidenceEffectiveness(),
        timeframeAnalysis: await this.getTimeframePerformance(),
        signalAnalysis: await this.getSignalTypeAnalysis(),
        dataQualityImpact: await this.getDataQualityAnalysis(),
        trendsAndPatterns: await this.getTrendsAndPatterns(),
        riskMetrics: await this.getRiskMetrics(),
        alerts: await this.generatePerformanceAlerts()
      };

      return analytics;

    } catch (error) {
      console.error('❌ Error generating system analytics:', error);
      throw error;
    }
  }

  /**
   * Get system overview metrics
   */
  async getSystemOverview() {
    const sql = `
      SELECT 
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        COUNT(CASE WHEN ao.is_correct = 0 THEN 1 END) as incorrect_predictions,
        COUNT(CASE WHEN ao.is_correct IS NULL THEN 1 END) as pending_outcomes,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as overall_accuracy,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss,
        ROUND(SUM(ao.profit_loss), 4) as total_profit_loss,
        COUNT(CASE WHEN ao.profit_loss > 0 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.profit_loss IS NOT NULL THEN 1 END) as win_rate
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
    `;

    const overview = await this.analyticsDB.getQuery(sql);
    
    return {
      ...overview,
      period: '30 days',
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Get detailed agent performance analysis
   */
  async getAgentPerformanceAnalysis() {
    const sql = `
      SELECT 
        ts.agent_name,
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss,
        ROUND(SUM(ao.profit_loss), 4) as total_profit_loss,
        COUNT(CASE WHEN ao.profit_loss > 0 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.profit_loss IS NOT NULL THEN 1 END) as win_rate,
        COUNT(CASE WHEN ts.confidence >= 80 THEN 1 END) as high_confidence_count,
        COUNT(CASE WHEN ts.confidence >= 80 AND ao.is_correct = 1 THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN ts.confidence >= 80 AND ao.is_correct IS NOT NULL THEN 1 END), 0) as high_confidence_accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
      GROUP BY ts.agent_name
      ORDER BY accuracy_rate DESC
    `;

    const agents = await this.analyticsDB.allQuery(sql);
    
    // Calculate additional metrics for each agent
    for (const agent of agents) {
      agent.performance_grade = this.calculatePerformanceGrade(agent);
      agent.consistency_score = await this.calculateConsistencyScore(agent.agent_name);
      agent.trending = await this.calculateTrendDirection(agent.agent_name);
    }

    return agents;
  }

  /**
   * Analyze confidence level effectiveness
   */
  async getConfidenceEffectiveness() {
    const sql = `
      SELECT 
        CASE 
          WHEN ts.confidence >= 90 THEN 'Very High (90-100%)'
          WHEN ts.confidence >= 80 THEN 'High (80-89%)'
          WHEN ts.confidence >= 70 THEN 'Medium-High (70-79%)'
          WHEN ts.confidence >= 60 THEN 'Medium (60-69%)'
          WHEN ts.confidence >= 50 THEN 'Medium-Low (50-59%)'
          ELSE 'Low (<50%)'
        END as confidence_range,
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY 
        CASE 
          WHEN ts.confidence >= 90 THEN 'Very High (90-100%)'
          WHEN ts.confidence >= 80 THEN 'High (80-89%)'
          WHEN ts.confidence >= 70 THEN 'Medium-High (70-79%)'
          WHEN ts.confidence >= 60 THEN 'Medium (60-69%)'
          WHEN ts.confidence >= 50 THEN 'Medium-Low (50-59%)'
          ELSE 'Low (<50%)'
        END
      ORDER BY avg_confidence DESC
    `;

    return await this.analyticsDB.allQuery(sql);
  }

  /**
   * Analyze performance by timeframe
   */
  async getTimeframePerformance() {
    const sql = `
      SELECT 
        ts.timeframe,
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(AVG(ao.time_elapsed), 0) as avg_resolution_time_minutes,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY ts.timeframe
      ORDER BY accuracy_rate DESC
    `;

    return await this.analyticsDB.allQuery(sql);
  }

  /**
   * Analyze performance by signal type
   */
  async getSignalTypeAnalysis() {
    const sql = `
      SELECT 
        ts.signal,
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss,
        ROUND(SUM(ao.profit_loss), 4) as total_profit_loss,
        COUNT(CASE WHEN ao.profit_loss > 0 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.profit_loss IS NOT NULL THEN 1 END) as win_rate
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY ts.signal
      ORDER BY total_profit_loss DESC
    `;

    return await this.analyticsDB.allQuery(sql);
  }

  /**
   * Analyze impact of data quality on performance
   */
  async getDataQualityAnalysis() {
    const sql = `
      SELECT 
        ts.data_quality,
        COUNT(*) as total_suggestions,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) as correct_predictions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate,
        ROUND(AVG(ts.confidence), 2) as avg_confidence,
        ROUND(AVG(ao.profit_loss), 4) as avg_profit_loss
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
        AND ts.data_quality IS NOT NULL
      GROUP BY ts.data_quality
      ORDER BY accuracy_rate DESC
    `;

    return await this.analyticsDB.allQuery(sql);
  }

  /**
   * Identify trends and patterns
   */
  async getTrendsAndPatterns() {
    // Weekly performance trend
    const weeklyTrend = await this.analyticsDB.allQuery(`
      SELECT 
        strftime('%Y-%W', ts.created_at) as week,
        COUNT(*) as suggestions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-8 weeks')
        AND ao.is_correct IS NOT NULL
      GROUP BY strftime('%Y-%W', ts.created_at)
      ORDER BY week DESC
      LIMIT 8
    `);

    // Hourly performance pattern
    const hourlyPattern = await this.analyticsDB.allQuery(`
      SELECT 
        strftime('%H', ts.created_at) as hour,
        COUNT(*) as suggestions,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY strftime('%H', ts.created_at)
      ORDER BY hour
    `);

    // Best performing combinations
    const bestCombinations = await this.analyticsDB.allQuery(`
      SELECT 
        ts.agent_name,
        ts.signal,
        ts.timeframe,
        COUNT(*) as count,
        ROUND(COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END), 2) as accuracy_rate
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY ts.agent_name, ts.signal, ts.timeframe
      HAVING COUNT(*) >= 5
      ORDER BY accuracy_rate DESC
      LIMIT 10
    `);

    return {
      weekly_trend: weeklyTrend,
      hourly_pattern: hourlyPattern,
      best_combinations: bestCombinations
    };
  }

  /**
   * Calculate risk metrics
   */
  async getRiskMetrics() {
    const profitLossData = await this.analyticsDB.allQuery(`
      SELECT ao.profit_loss
      FROM actual_outcomes ao
      JOIN trading_suggestions ts ON ao.suggestion_id = ts.suggestion_id
      WHERE ts.created_at >= date('now', '-30 days')
        AND ao.profit_loss IS NOT NULL
      ORDER BY ao.recorded_at
    `);

    if (profitLossData.length === 0) {
      return {
        max_drawdown: 0,
        volatility: 0,
        sharpe_ratio: 0,
        value_at_risk_95: 0,
        total_trades: 0
      };
    }

    const returns = profitLossData.map(d => d.profit_loss);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Calculate volatility (standard deviation)
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;

    for (const ret of returns) {
      runningTotal += ret;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = (peak - runningTotal) / Math.abs(peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate Sharpe ratio (assuming risk-free rate of 6% annually = 0.5% monthly)
    const riskFreeRate = 0.5; // Monthly risk-free rate
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;

    // Calculate Value at Risk (95% confidence)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk95 = sortedReturns[varIndex] || 0;

    return {
      max_drawdown: Math.round(maxDrawdown * 100) / 100,
      volatility: Math.round(volatility * 10000) / 100, // Percentage
      sharpe_ratio: Math.round(sharpeRatio * 100) / 100,
      value_at_risk_95: Math.round(valueAtRisk95 * 10000) / 100,
      total_trades: returns.length,
      avg_return: Math.round(avgReturn * 10000) / 100
    };
  }

  /**
   * Generate performance alerts
   */
  async generatePerformanceAlerts() {
    const alerts = [];
    
    // Check for agents with low accuracy
    const lowAccuracyAgents = await this.analyticsDB.allQuery(`
      SELECT 
        ts.agent_name,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END) as accuracy_rate
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-7 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY ts.agent_name
      HAVING COUNT(*) >= 5 AND accuracy_rate < 40
    `);

    for (const agent of lowAccuracyAgents) {
      alerts.push({
        type: 'LOW_ACCURACY',
        severity: 'HIGH',
        agent: agent.agent_name,
        message: `${agent.agent_name} accuracy dropped to ${agent.accuracy_rate.toFixed(1)}%`,
        threshold: 40,
        actual: agent.accuracy_rate
      });
    }

    // Check for high confidence failures
    const highConfidenceFailures = await this.analyticsDB.allQuery(`
      SELECT 
        ts.agent_name,
        COUNT(*) as high_conf_incorrect
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.created_at >= date('now', '-7 days')
        AND ts.confidence >= 80
        AND ao.is_correct = 0
      GROUP BY ts.agent_name
      HAVING COUNT(*) >= 3
    `);

    for (const agent of highConfidenceFailures) {
      alerts.push({
        type: 'HIGH_CONFIDENCE_FAILURES',
        severity: 'MEDIUM',
        agent: agent.agent_name,
        message: `${agent.agent_name} had ${agent.high_conf_incorrect} high-confidence failures`,
        threshold: 2,
        actual: agent.high_conf_incorrect
      });
    }

    return alerts;
  }

  /**
   * Helper methods
   */
  
  calculatePerformanceGrade(agentStats) {
    const accuracy = agentStats.accuracy_rate || 0;
    const winRate = agentStats.win_rate || 0;
    const avgProfit = agentStats.avg_profit_loss || 0;

    let score = 0;
    
    // Accuracy scoring (40% weight)
    if (accuracy >= 80) score += 40;
    else if (accuracy >= 70) score += 32;
    else if (accuracy >= 60) score += 24;
    else if (accuracy >= 50) score += 16;
    else score += accuracy * 0.32;

    // Win rate scoring (30% weight)
    if (winRate >= 70) score += 30;
    else if (winRate >= 60) score += 24;
    else if (winRate >= 50) score += 18;
    else score += winRate * 0.3;

    // Profit scoring (30% weight)
    if (avgProfit > 2) score += 30;
    else if (avgProfit > 1) score += 24;
    else if (avgProfit > 0) score += 18;
    else if (avgProfit > -1) score += 10;
    else score += 0;

    if (score >= 90) return 'A+';
    else if (score >= 80) return 'A';
    else if (score >= 70) return 'B+';
    else if (score >= 60) return 'B';
    else if (score >= 50) return 'C+';
    else if (score >= 40) return 'C';
    else return 'D';
  }

  async calculateConsistencyScore(agentName) {
    // Calculate daily accuracy variance over the last 14 days
    const dailyAccuracy = await this.analyticsDB.allQuery(`
      SELECT 
        DATE(ts.created_at) as date,
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END) as daily_accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.agent_name = ?
        AND ts.created_at >= date('now', '-14 days')
        AND ao.is_correct IS NOT NULL
      GROUP BY DATE(ts.created_at)
      HAVING COUNT(*) >= 2
    `, [agentName]);

    if (dailyAccuracy.length < 3) return 'Insufficient Data';

    const accuracies = dailyAccuracy.map(d => d.daily_accuracy);
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    if (stdDev < 10) return 'Very High';
    else if (stdDev < 20) return 'High';
    else if (stdDev < 30) return 'Medium';
    else return 'Low';
  }

  async calculateTrendDirection(agentName) {
    // Compare last 7 days with previous 7 days
    const recent = await this.analyticsDB.getQuery(`
      SELECT 
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END) as accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.agent_name = ?
        AND ts.created_at >= date('now', '-7 days')
        AND ao.is_correct IS NOT NULL
    `, [agentName]);

    const previous = await this.analyticsDB.getQuery(`
      SELECT 
        COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / 
        COUNT(CASE WHEN ao.is_correct IS NOT NULL THEN 1 END) as accuracy
      FROM trading_suggestions ts
      LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
      WHERE ts.agent_name = ?
        AND ts.created_at >= date('now', '-14 days')
        AND ts.created_at < date('now', '-7 days')
        AND ao.is_correct IS NOT NULL
    `, [agentName]);

    if (!recent || !previous || recent.accuracy === null || previous.accuracy === null) {
      return 'Stable';
    }

    const diff = recent.accuracy - previous.accuracy;
    
    if (diff > 10) return 'Improving';
    else if (diff < -10) return 'Declining';
    else return 'Stable';
  }

  /**
   * Close database connection
   */
  close() {
    if (this.analyticsDB) {
      this.analyticsDB.close();
    }
  }
}

module.exports = AnalyticsEngine;