const AnalyticsDB = require('../database/analyticsDB');
const marketData = require('../data/marketData');

/**
 * Trading Logger - Integrates with agents to track suggestions and outcomes
 * Automatically logs trading signals and monitors actual market movements
 */
class TradingLogger {
  constructor() {
    this.analyticsDB = new AnalyticsDB();
    this.isInitialized = false;
    this.activeSuggestions = new Map(); // Track active suggestions
    this.outcomeTimer = null;
    this.monitoringInterval = 5 * 60 * 1000; // Check every 5 minutes
  }

  /**
   * Initialize the trading logger
   */
  async initialize() {
    try {
      await this.analyticsDB.initialize();
      this.isInitialized = true;
      
      // Start monitoring active suggestions
      this.startOutcomeMonitoring();
      
      console.log('✅ Trading Logger initialized successfully');
      
    } catch (error) {
      console.error('❌ Trading Logger initialization error:', error);
      throw error;
    }
  }

  /**
   * Log a trading suggestion from any agent
   */
  async logTradingSuggestion(agentResult) {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ Trading Logger not initialized, skipping suggestion logging');
        return null;
      }

      // Get current market price
      const currentPrice = await this.getCurrentMarketPrice();
      
      // Extract and enhance suggestion data
      const suggestionData = {
        agent: agentResult.agent || 'multi-agent', // Default for orchestrated results
        signal: agentResult.signal,
        confidence: agentResult.confidence,
        reasoning: agentResult.reasoning,
        timeframe: agentResult.timeframe || '15min',
        marketPrice: currentPrice,
        dataQuality: agentResult.dataQuality || 'MEDIUM',
        targetPrice: agentResult.targetPrice || agentResult.pricePrediction?.targetPrice,
        stopLoss: agentResult.stopLoss,
        
        // Additional context
        marketConditions: this.extractMarketConditions(agentResult),
        technicalIndicators: this.extractTechnicalIndicators(agentResult),
        fundamentalData: this.extractFundamentalData(agentResult),
        globalSentiment: agentResult.globalSentiment,
        volatilityLevel: this.assessVolatilityLevel(agentResult)
      };

      // Store in database
      const result = await this.analyticsDB.storeTradingSuggestion(suggestionData);
      
      if (result.success) {
        // Track for outcome monitoring
        this.activeSuggestions.set(result.suggestionId, {
          ...suggestionData,
          suggestionId: result.suggestionId,
          createdAt: new Date(),
          expiresAt: this.calculateExpiryTime(suggestionData.timeframe)
        });

        console.log(`📊 Logged suggestion: ${result.suggestionId} (${agentResult.agent}: ${agentResult.signal} ${agentResult.confidence}%)`);
        
        return result.suggestionId;
      }

    } catch (error) {
      console.error('❌ Error logging trading suggestion:', error);
      return null;
    }
  }

  /**
   * Manually record an outcome (for testing or immediate feedback)
   */
  async recordOutcome(suggestionId, actualPrice, additionalData = {}) {
    try {
      const outcome = {
        actualPrice,
        outcomeType: 'MANUAL_ENTRY',
        marketVolatility: additionalData.volatility,
        volumeData: additionalData.volume,
        ...additionalData
      };

      const result = await this.analyticsDB.recordActualOutcome(suggestionId, outcome);
      
      // Remove from active tracking
      this.activeSuggestions.delete(suggestionId);
      
      return result;

    } catch (error) {
      console.error('❌ Error recording outcome:', error);
      throw error;
    }
  }

  /**
   * Start monitoring active suggestions for outcomes
   */
  startOutcomeMonitoring() {
    if (this.outcomeTimer) {
      clearInterval(this.outcomeTimer);
    }

    this.outcomeTimer = setInterval(() => {
      this.checkSuggestionOutcomes();
    }, this.monitoringInterval);

    console.log('🔄 Started outcome monitoring (5-minute intervals)');
  }

  /**
   * Check outcomes for all active suggestions
   */
  async checkSuggestionOutcomes() {
    try {
      if (this.activeSuggestions.size === 0) {
        return;
      }

      console.log(`🔍 Checking outcomes for ${this.activeSuggestions.size} active suggestions...`);

      const currentPrice = await this.getCurrentMarketPrice();
      const now = new Date();

      for (const [suggestionId, suggestion] of this.activeSuggestions) {
        try {
          // Check if suggestion has expired
          if (now > suggestion.expiresAt) {
            await this.recordExpiryOutcome(suggestionId, suggestion, currentPrice);
            this.activeSuggestions.delete(suggestionId);
            continue;
          }

          // Check for significant price movement (>1% for 15min, >2% for longer timeframes)
          const priceChange = Math.abs((currentPrice - suggestion.marketPrice) / suggestion.marketPrice) * 100;
          const threshold = suggestion.timeframe === '15min' ? 1.0 : 2.0;

          if (priceChange >= threshold) {
            await this.recordMovementOutcome(suggestionId, suggestion, currentPrice);
            this.activeSuggestions.delete(suggestionId);
          }

        } catch (error) {
          console.error(`❌ Error checking outcome for ${suggestionId}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in outcome monitoring:', error);
    }
  }

  /**
   * Record outcome when suggestion expires
   */
  async recordExpiryOutcome(suggestionId, suggestion, currentPrice) {
    const outcome = {
      actualPrice: currentPrice,
      outcomeType: 'EXPIRY',
      marketVolatility: await this.getCurrentVolatility()
    };

    const result = await this.analyticsDB.recordActualOutcome(suggestionId, outcome);
    console.log(`⏰ Recorded expiry outcome for ${suggestionId}: ${result.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    
    return result;
  }

  /**
   * Record outcome when significant price movement occurs
   */
  async recordMovementOutcome(suggestionId, suggestion, currentPrice) {
    const outcome = {
      actualPrice: currentPrice,
      outcomeType: 'PRICE_MOVEMENT',
      marketVolatility: await this.getCurrentVolatility()
    };

    const result = await this.analyticsDB.recordActualOutcome(suggestionId, outcome);
    console.log(`📈 Recorded movement outcome for ${suggestionId}: ${result.isCorrect ? 'CORRECT' : 'INCORRECT'} (${result.accuracyScore.toFixed(1)}%)`);
    
    return result;
  }

  /**
   * Get performance summary for all agents
   */
  async getPerformanceSummary() {
    try {
      const summary = await this.analyticsDB.getAgentPerformanceSummary();
      const daily = await this.analyticsDB.getDailyPerformance(7);
      const confidence = await this.analyticsDB.getConfidenceAccuracyAnalysis();

      return {
        agentPerformance: summary,
        dailyPerformance: daily,
        confidenceAnalysis: confidence,
        activeSuggestions: this.activeSuggestions.size
      };

    } catch (error) {
      console.error('❌ Error getting performance summary:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific agent
   */
  async getAgentAnalytics(agentName) {
    try {
      const performance = await this.analyticsDB.getAgentPerformance(agentName);
      const recentSuggestions = await this.analyticsDB.getRecentSuggestionsWithOutcomes(20);
      
      // Filter for this agent
      const agentSuggestions = recentSuggestions.filter(s => s.agent_name === agentName);

      return {
        performance,
        recentSuggestions: agentSuggestions,
        activeSuggestions: Array.from(this.activeSuggestions.values())
          .filter(s => s.agent === agentName)
      };

    } catch (error) {
      console.error(`❌ Error getting analytics for ${agentName}:`, error);
      throw error;
    }
  }

  /**
   * Create performance alert
   */
  async createAlert(agentName, alertType, message, threshold, actual) {
    try {
      const severity = this.determineSeverity(alertType, threshold, actual);
      
      await this.analyticsDB.createAlert(
        alertType, 
        severity, 
        agentName, 
        message, 
        threshold, 
        actual
      );

      console.log(`🚨 Alert created: ${alertType} for ${agentName} (${severity})`);

    } catch (error) {
      console.error('❌ Error creating alert:', error);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    return await this.analyticsDB.getActiveAlerts();
  }

  /**
   * Helper methods
   */
  
  async getCurrentMarketPrice() {
    try {
      const niftyData = await marketData.getNiftyIndexData();
      return niftyData.currentPrice || 19500; // Fallback price
    } catch (error) {
      console.warn('⚠️ Could not get current market price, using fallback');
      return 19500;
    }
  }

  async getCurrentVolatility() {
    try {
      // Calculate simple volatility from recent price movements
      // In production, this would use actual volatility calculations
      return Math.random() * 20 + 10; // 10-30% volatility range
    } catch (error) {
      return 15; // Default volatility
    }
  }

  calculateExpiryTime(timeframe) {
    const now = new Date();
    const minutes = timeframe === '15min' ? 15 : 
                   timeframe === '1hour' ? 60 :
                   timeframe === '4hour' ? 240 :
                   timeframe === '1day' ? 1440 : 60;
    
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  extractMarketConditions(agentResult) {
    return {
      timestamp: new Date().toISOString(),
      volatility: agentResult.volatility,
      trend: agentResult.trend,
      volume: agentResult.volume
    };
  }

  extractTechnicalIndicators(agentResult) {
    if (agentResult.analysis && agentResult.analysis.technicalAnalysis) {
      return agentResult.analysis.technicalAnalysis;
    }
    return {};
  }

  extractFundamentalData(agentResult) {
    if (agentResult.analysis && agentResult.analysis.fundamentalData) {
      return agentResult.analysis.fundamentalData;
    }
    return {};
  }

  assessVolatilityLevel(agentResult) {
    // Simple volatility assessment
    if (agentResult.confidence < 50) return 'HIGH';
    else if (agentResult.confidence < 70) return 'MEDIUM';
    else return 'LOW';
  }

  determineSeverity(alertType, threshold, actual) {
    const diff = Math.abs(actual - threshold) / threshold;
    
    if (diff > 0.3) return 'HIGH';
    else if (diff > 0.1) return 'MEDIUM';
    else return 'LOW';
  }

  /**
   * Stop monitoring and cleanup
   */
  stop() {
    if (this.outcomeTimer) {
      clearInterval(this.outcomeTimer);
      this.outcomeTimer = null;
    }
    
    if (this.analyticsDB) {
      this.analyticsDB.close();
    }
    
    console.log('✅ Trading Logger stopped');
  }
}

module.exports = TradingLogger;