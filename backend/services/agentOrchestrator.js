// Agent Orchestrator - Coordinates all agents and generates final trading signal
const TechnicalAnalysisAgent = require('../agents/technicalAnalysis');
const MarketSentimentAgent = require('../agents/marketSentiment');
const ResearchAgent = require('../agents/research');
const RiskManagementAgent = require('../agents/riskManagement');
const marketData = require('./marketData');

class AgentOrchestrator {
  constructor() {
    this.technicalAgent = new TechnicalAnalysisAgent();
    this.sentimentAgent = new MarketSentimentAgent();
    this.researchAgent = new ResearchAgent();
    this.riskAgent = new RiskManagementAgent();
    
    this.agentWeights = {
      technical: 0.35,      // Technical analysis gets highest weight
      sentiment: 0.25,      // Market sentiment
      research: 0.25,       // Research and fundamentals
      risk: 0.15           // Risk management (modifier)
    };
  }

  async runAnalysis() {
    console.log('Starting multi-agent analysis...');
    
    try {
      // Get current market data
      const currentMarketData = await marketData.getNiftyIndexData();
      
      // Run all agents in parallel
      const [technicalResult, sentimentResult, researchResult, riskResult] = await Promise.all([
        this.technicalAgent.analyze(),
        this.sentimentAgent.analyze(),
        this.researchAgent.analyze(),
        this.riskAgent.analyze()
      ]);

      // Aggregate results
      const aggregatedSignal = this.aggregateSignals({
        technical: technicalResult,
        sentiment: sentimentResult,
        research: researchResult,
        risk: riskResult
      });

      // Calculate price prediction
      const pricePrediction = this.calculatePricePrediction(
        currentMarketData,
        { technical: technicalResult, sentiment: sentimentResult, research: researchResult }
      );

      // Generate final trading signal
      const finalSignal = {
        timestamp: new Date(),
        currentPrice: currentMarketData.currentPrice,
        signal: aggregatedSignal.action,
        confidence: aggregatedSignal.confidence,
        reasoning: aggregatedSignal.reasoning,
        pricePrediction: pricePrediction,
        timeframe: '15min',
        marketData: {
          price: currentMarketData.currentPrice,
          change: currentMarketData.change,
          changePercent: currentMarketData.changePercent,
          volume: currentMarketData.volume,
          high: currentMarketData.high,
          low: currentMarketData.low
        },
        agentResults: {
          technical: {
            signal: technicalResult.signal,
            confidence: technicalResult.confidence,
            key_indicators: this.extractKeyIndicators(technicalResult)
          },
          sentiment: {
            signal: sentimentResult.signal,
            confidence: sentimentResult.confidence,
            market_mood: this.extractMarketMood(sentimentResult)
          },
          research: {
            signal: researchResult.signal,
            confidence: researchResult.confidence,
            key_factors: this.extractResearchFactors(researchResult)
          },
          risk: {
            signal: riskResult.signal,
            confidence: riskResult.confidence,
            risk_level: this.extractRiskLevel(riskResult),
            recommendations: riskResult.recommendations || []
          }
        },
        recommendations: this.generateRecommendations(aggregatedSignal, riskResult),
        nextAnalysis: new Date(Date.now() + 15 * 60 * 1000) // Next analysis in 15 minutes
      };

      console.log('Multi-agent analysis completed:', {
        signal: finalSignal.signal,
        confidence: finalSignal.confidence,
        prediction: pricePrediction
      });

      return finalSignal;
      
    } catch (error) {
      console.error('Error in agent orchestration:', error);
      return this.getErrorSignal(error);
    }
  }

  aggregateSignals(results) {
    const signals = {
      BUY: 0,
      SELL: 0,
      HOLD: 0
    };

    let totalConfidence = 0;
    let validAgents = 0;
    const reasoningParts = [];

    // Process each agent's signal
    Object.keys(results).forEach(agentType => {
      const result = results[agentType];
      
      if (result.signal && agentType !== 'risk') {
        const weight = this.agentWeights[agentType];
        const confidence = (result.confidence || 50) / 100;
        const weightedScore = weight * confidence;

        if (result.signal === 'BUY' || result.signal === 'APPROVE_TRADE') {
          signals.BUY += weightedScore;
        } else if (result.signal === 'SELL') {
          signals.SELL += weightedScore;
        } else {
          signals.HOLD += weightedScore;
        }

        totalConfidence += result.confidence || 50;
        validAgents++;
        
        reasoningParts.push(`${agentType}: ${result.signal} (${result.confidence}%)`);
      }
    });

    // Apply risk management modifier
    const riskResult = results.risk;
    let riskModifier = 1.0;
    
    if (riskResult.signal === 'AVOID_TRADE') {
      riskModifier = 0.3; // Significantly reduce confidence
      reasoningParts.push('Risk: HIGH RISK - Trade discouraged');
    } else if (riskResult.signal === 'CAUTIOUS_TRADE') {
      riskModifier = 0.7; // Moderately reduce confidence
      reasoningParts.push('Risk: MODERATE - Trade with caution');
    } else {
      reasoningParts.push('Risk: LOW - Trade approved');
    }

    // Determine final signal
    const maxSignal = Math.max(signals.BUY, signals.SELL, signals.HOLD);
    let finalAction = 'HOLD';
    
    if (maxSignal === signals.BUY && signals.BUY > 0.4) {
      finalAction = 'BUY';
    } else if (maxSignal === signals.SELL && signals.SELL > 0.4) {
      finalAction = 'SELL';
    }

    // Calculate confidence
    const baseConfidence = validAgents > 0 ? totalConfidence / validAgents : 50;
    const adjustedConfidence = Math.round(baseConfidence * riskModifier);
    const finalConfidence = Math.max(20, Math.min(95, adjustedConfidence));

    return {
      action: finalAction,
      confidence: finalConfidence,
      reasoning: reasoningParts.join('; '),
      signalStrength: {
        BUY: Math.round(signals.BUY * 100),
        SELL: Math.round(signals.SELL * 100),
        HOLD: Math.round(signals.HOLD * 100)
      },
      riskAdjustment: Math.round((1 - riskModifier) * 100)
    };
  }

  calculatePricePrediction(currentData, agentResults) {
    const currentPrice = currentData.currentPrice;
    let priceMovement = 0;
    let confidenceSum = 0;
    let agentCount = 0;

    // Technical analysis prediction
    if (agentResults.technical.signal === 'BUY') {
      priceMovement += 0.8; // Expect 0.8% move up
    } else if (agentResults.technical.signal === 'SELL') {
      priceMovement -= 0.8;
    }
    confidenceSum += agentResults.technical.confidence || 50;
    agentCount++;

    // Sentiment analysis prediction
    if (agentResults.sentiment.signal === 'BUY') {
      priceMovement += 0.5; // Expect 0.5% move up
    } else if (agentResults.sentiment.signal === 'SELL') {
      priceMovement -= 0.5;
    }
    confidenceSum += agentResults.sentiment.confidence || 50;
    agentCount++;

    // Research analysis prediction
    if (agentResults.research.signal === 'BUY') {
      priceMovement += 0.6; // Expect 0.6% move up
    } else if (agentResults.research.signal === 'SELL') {
      priceMovement -= 0.6;
    }
    confidenceSum += agentResults.research.confidence || 50;
    agentCount++;

    // Calculate predicted price range
    const avgConfidence = agentCount > 0 ? confidenceSum / agentCount : 50;
    const confidenceFactor = avgConfidence / 100;
    
    const adjustedMovement = priceMovement * confidenceFactor;
    const targetPrice = currentPrice * (1 + adjustedMovement / 100);
    
    // Calculate support and resistance levels
    const volatilityFactor = 0.5; // Assume 0.5% volatility
    const supportLevel = targetPrice * (1 - volatilityFactor / 100);
    const resistanceLevel = targetPrice * (1 + volatilityFactor / 100);

    return {
      currentPrice: Math.round(currentPrice * 100) / 100,
      targetPrice: Math.round(targetPrice * 100) / 100,
      expectedMove: Math.round(adjustedMovement * 100) / 100,
      supportLevel: Math.round(supportLevel * 100) / 100,
      resistanceLevel: Math.round(resistanceLevel * 100) / 100,
      confidence: Math.round(avgConfidence),
      timeframe: '15 minutes',
      priceRange: {
        min: Math.round(supportLevel * 100) / 100,
        max: Math.round(resistanceLevel * 100) / 100
      }
    };
  }

  extractKeyIndicators(technicalResult) {
    if (!technicalResult.analysis) return {};
    
    return {
      rsi: technicalResult.analysis.rsi?.value || 'N/A',
      macd: technicalResult.analysis.macd?.action || 'NEUTRAL',
      sma: technicalResult.analysis.sma?.signal || 'NEUTRAL',
      bollinger: technicalResult.analysis.bollinger?.signal || 'NEUTRAL'
    };
  }

  extractMarketMood(sentimentResult) {
    if (!sentimentResult.analysis) return {};
    
    return {
      overall: sentimentResult.analysis.overallSentiment?.sentiment || 'NEUTRAL',
      breadth: sentimentResult.analysis.marketBreadth?.signal || 'NEUTRAL',
      volume: sentimentResult.analysis.volumeAnalysis?.signal || 'NEUTRAL'
    };
  }

  extractResearchFactors(researchResult) {
    if (!researchResult.analysis) return {};
    
    return {
      news: researchResult.analysis.newsAnalysis?.overallSentiment || 'NEUTRAL',
      fundamentals: researchResult.analysis.fundamentalData?.recommendation || 'HOLD',
      economic: researchResult.analysis.economicIndicators?.riskAssessment || 'MEDIUM',
      global: researchResult.analysis.globalMarketImpact?.globalSentiment || 'NEUTRAL'
    };
  }

  extractRiskLevel(riskResult) {
    return {
      overall: riskResult.riskScore ? this.getRiskCategory(riskResult.riskScore) : 'MEDIUM',
      score: Math.round((riskResult.riskScore || 0.5) * 100),
      volatility: riskResult.analysis?.volatilityRisk?.level || 'MEDIUM',
      liquidity: riskResult.analysis?.liquidityRisk?.level || 'LOW'
    };
  }

  getRiskCategory(score) {
    if (score < 0.3) return 'LOW';
    else if (score < 0.6) return 'MEDIUM';
    else return 'HIGH';
  }

  generateRecommendations(signal, riskResult) {
    const recommendations = [];
    
    // Signal-based recommendations
    if (signal.action === 'BUY') {
      recommendations.push('Consider long position with proper risk management');
      recommendations.push(`Target confidence: ${signal.confidence}%`);
    } else if (signal.action === 'SELL') {
      recommendations.push('Consider short position or exit long positions');
      recommendations.push(`Target confidence: ${signal.confidence}%`);
    } else {
      recommendations.push('Hold current positions or wait for clearer signals');
    }

    // Risk-based recommendations
    if (riskResult.recommendations) {
      recommendations.push(...riskResult.recommendations.slice(0, 2));
    }

    // Position sizing recommendation
    if (signal.confidence > 70) {
      recommendations.push('High confidence - standard position size appropriate');
    } else if (signal.confidence > 50) {
      recommendations.push('Moderate confidence - consider reduced position size');
    } else {
      recommendations.push('Low confidence - minimal position size or avoid trade');
    }

    return recommendations;
  }

  getErrorSignal(error) {
    return {
      timestamp: new Date(),
      signal: 'HOLD',
      confidence: 0,
      reasoning: `Analysis error: ${error.message}`,
      error: true,
      pricePrediction: {
        currentPrice: 0,
        targetPrice: 0,
        expectedMove: 0,
        confidence: 0
      },
      agentResults: {},
      recommendations: ['System error - avoid trading until resolved'],
      nextAnalysis: new Date(Date.now() + 15 * 60 * 1000)
    };
  }
}

module.exports = new AgentOrchestrator();