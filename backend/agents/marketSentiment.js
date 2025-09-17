// Market Sentiment Agent - Enhanced with OpenAI for intelligent analysis
const marketData = require('../services/marketData');
const OpenAI = require('openai');
const HistoricalAnalysis = require('../services/historicalAnalysis');
const PerformanceTracker = require('../services/performanceTracker');
const MicrostructureAnalysis = require('../services/microstructureAnalysis');

class MarketSentimentAgent {
  constructor() {
    this.name = 'Market Sentiment Agent';
    this.description = 'AI-powered market sentiment analysis with advanced accuracy features';
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
    
    // Initialize advanced analysis components
    this.historicalAnalysis = new HistoricalAnalysis();
    this.performanceTracker = new PerformanceTracker();
    this.microstructureAnalysis = new MicrostructureAnalysis();
  }

  async analyze() {
    try {
      console.log('🎯 Enhanced Market Sentiment Agent analyzing...');
      
      // Get market data
      const [sentimentData, niftyData, topStocks] = await Promise.all([
        marketData.getMarketSentiment(),
        marketData.getNiftyIndexData(),
        marketData.getTopNiftyStocks()
      ]);

      // Traditional technical analysis
      const traditionalAnalysis = {
        overallSentiment: sentimentData,
        volumeAnalysis: this.analyzeVolume(niftyData),
        marketBreadth: this.analyzeMarketBreadth(topStocks),
        volatility: this.analyzeVolatility(niftyData),
        momentumAnalysis: this.analyzeMomentum(niftyData, topStocks)
      };
      
      // Historical pattern analysis
      const currentMarketConditions = {
        volatility: traditionalAnalysis.volatility.intraDayRange,
        momentum: traditionalAnalysis.momentumAnalysis.strength === 'Strong' ? 1 : 
                 traditionalAnalysis.momentumAnalysis.strength === 'Weak' ? -1 : 0,
        volumeRatio: traditionalAnalysis.volumeAnalysis.ratio,
        hour: new Date().getHours()
      };
      
      const historicalPatterns = await this.historicalAnalysis.analyzeHistoricalPatterns(currentMarketConditions);
      
      // Microstructure analysis
      const microstructure = await this.microstructureAnalysis.analyzeMicrostructure(niftyData, topStocks);

      // AI-Enhanced Analysis using OpenAI
      const aiAnalysis = await this.performAIAnalysis(traditionalAnalysis, niftyData, topStocks);
      
      // Get optimal weights from performance tracker
      const optimalWeights = this.performanceTracker.getOptimalWeights();

      // Enhanced combination with all factors
      const enhancedAnalysis = this.enhancedCombineAnalysis(
        traditionalAnalysis, 
        aiAnalysis, 
        historicalPatterns, 
        microstructure,
        optimalWeights
      );
      
      // Track this prediction for future learning
      if (enhancedAnalysis.signal !== 'HOLD') {
        const predictionId = await this.performanceTracker.trackPrediction(
          enhancedAnalysis.signal,
          enhancedAnalysis.confidence,
          niftyData.currentPrice * (1 + (enhancedAnalysis.expectedMove || 0) / 100),
          new Date(),
          {
            aiWeight: optimalWeights.ai,
            traditionalWeight: optimalWeights.technical,
            historicalWeight: optimalWeights.historical,
            marketConditions: currentMarketConditions
          }
        );
        enhancedAnalysis.predictionId = predictionId;
      }
      
      // Get performance stats
      const performanceStats = this.performanceTracker.getPerformanceStats();

      return {
        agent: this.name,
        timestamp: new Date(),
        signal: enhancedAnalysis.signal,
        confidence: enhancedAnalysis.confidence,
        analysis: {
          traditional: traditionalAnalysis,
          aiInsights: aiAnalysis,
          historical: historicalPatterns,
          microstructure: microstructure,
          combined: enhancedAnalysis
        },
        recommendations: enhancedAnalysis.recommendations,
        marketMood: enhancedAnalysis.marketMood,
        riskFactors: enhancedAnalysis.riskFactors,
        advancedInsights: [
          `Historical Accuracy: ${historicalPatterns.accuracy}% (${historicalPatterns.similarCount} patterns)`,
          `Microstructure: ${microstructure.orderFlowBias} flow, ${microstructure.smartMoneyFlow} smart money`,
          `Model Performance: ${performanceStats.overallAccuracy.toFixed(1)}% accuracy`,
          `Optimal Weights: AI=${(optimalWeights.ai*100).toFixed(0)}%, Technical=${(optimalWeights.technical*100).toFixed(0)}%`,
          `Prediction ID: ${enhancedAnalysis.predictionId || 'N/A'}`
        ],
        performanceStats: performanceStats
      };
      
    } catch (error) {
      console.error('❌ Enhanced Market Sentiment Agent Error:', error);
      return this.getFallbackAnalysis();
    }
  }

  async performAIAnalysis(traditionalAnalysis, niftyData, topStocks) {
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        console.log('⚠️ OpenAI API key not configured, using fallback analysis');
        return this.getFallbackAIAnalysis();
      }

      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const isMarketHours = (currentHour >= 9 && currentHour < 15) || (currentHour === 15 && currentMinute <= 30);
      const isOpeningHour = currentHour === 9;
      const isClosingHour = currentHour >= 15;

      const prompt = `
As an expert Nifty 50 quantitative analyst, analyze this real-time data for precise 15-minute trading signals:

CURRENT MARKET STATE:
- Nifty 50: ₹${niftyData.currentPrice} (${niftyData.changePercent > 0 ? '+' : ''}${niftyData.changePercent}%)
- Volume: ${niftyData.volume} vs avg 50M (${((niftyData.volume/50000000)*100).toFixed(1)}% of average)
- Range: ₹${niftyData.low} - ₹${niftyData.high} (${(((niftyData.high - niftyData.low)/niftyData.currentPrice)*100).toFixed(2)}% intraday range)
- Time: ${currentTime.toLocaleTimeString('en-IN')} (Market ${isMarketHours ? 'OPEN' : 'CLOSED'})
- Session: ${isOpeningHour ? 'OPENING' : isClosingHour ? 'CLOSING' : 'MID-SESSION'}

TECHNICAL SIGNALS:
- Volume Signal: ${traditionalAnalysis.volumeAnalysis.signal} (Strength: ${traditionalAnalysis.volumeAnalysis.strength})
- Market Breadth: ${traditionalAnalysis.marketBreadth.advancers} advancing, ${traditionalAnalysis.marketBreadth.decliners} declining (Ratio: ${traditionalAnalysis.marketBreadth.ratio.toFixed(2)})
- Volatility: ${traditionalAnalysis.volatility.level} (${traditionalAnalysis.volatility.intraDayRange.toFixed(2)}% range)
- Momentum: ${traditionalAnalysis.momentumAnalysis.signal} (Strength: ${traditionalAnalysis.momentumAnalysis.strength})

TOP NIFTY 50 PERFORMERS:
${topStocks.slice(0,5).map(s => `- ${s.symbol}: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`).join('\n')}

BOTTOM PERFORMERS:
${topStocks.slice(-3).map(s => `- ${s.symbol}: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`).join('\n')}

ANALYZE AND PROVIDE JSON RESPONSE:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "targetPrice": estimated_15min_price,
  "risk": "LOW|MEDIUM|HIGH",
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "reasoning": ["key factor 1", "key factor 2", "key factor 3"],
  "timeHorizon": "15_MINUTES",
  "stopLoss": suggested_stop_loss_level,
  "marketContext": "opening|mid_session|closing",
  "volumeConfirmation": true|false,
  "sectorRotation": "positive|negative|neutral"
}

Focus on immediate 15-minute price action with high precision.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a quantitative analyst specializing in Nifty 50 intraday trading with 85%+ accuracy.
            Current IST: ${currentTime.toLocaleString('en-IN')}.
            Market Hours: 9:15 AM - 3:30 PM IST.
            Focus on 15-minute precision signals.
            ALWAYS respond with valid JSON only - no additional text.
            Consider market microstructure, institutional flow, and real-time sentiment.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content);
      return this.enhancedParseAIResponse(aiResponse, traditionalAnalysis);
      
    } catch (error) {
      console.error('🔴 OpenAI Analysis Error:', error);
      return this.getFallbackAIAnalysis();
    }
  }

  enhancedParseAIResponse(aiResponse, traditionalAnalysis) {
    try {
      // Validate and enhance AI response
      const enhancedResponse = {
        overallSentiment: aiResponse.sentiment || 'NEUTRAL',
        tradingSignal: aiResponse.signal || 'HOLD',
        confidence: Math.min(95, Math.max(20, aiResponse.confidence || 50)),
        targetPrice: aiResponse.targetPrice || 0,
        risk: aiResponse.risk || 'MEDIUM',
        reasoning: aiResponse.reasoning || ['No specific reasoning provided'],
        timeHorizon: aiResponse.timeHorizon || '15_MINUTES',
        stopLoss: aiResponse.stopLoss || 0,
        marketContext: aiResponse.marketContext || 'mid_session',
        volumeConfirmation: aiResponse.volumeConfirmation || false,
        sectorRotation: aiResponse.sectorRotation || 'neutral',
        fullAnalysis: JSON.stringify(aiResponse),
        keyFactors: aiResponse.reasoning || ['AI analysis completed'],
        riskFactors: this.extractRiskFactors(aiResponse),
        marketOutlook: this.determineMarketOutlook(aiResponse)
      };

      return enhancedResponse;
    } catch (error) {
      console.error('🔴 Enhanced AI Response Parsing Error:', error);
      return this.getFallbackAIAnalysis();
    }
  }

  extractRiskFactors(aiResponse) {
    const risks = [];
    
    if (aiResponse.risk === 'HIGH') {
      risks.push('High market risk identified');
    }
    
    if (aiResponse.volumeConfirmation === false) {
      risks.push('Volume not confirming price action');
    }
    
    if (aiResponse.marketContext === 'closing') {
      risks.push('End of session volatility');
    }
    
    if (aiResponse.sectorRotation === 'negative') {
      risks.push('Negative sector rotation detected');
    }

    return risks.length > 0 ? risks : ['Standard market risks apply'];
  }

  determineMarketOutlook(aiResponse) {
    if (aiResponse.sentiment === 'BULLISH' && aiResponse.confidence > 70) {
      return 'Strong Positive';
    } else if (aiResponse.sentiment === 'BEARISH' && aiResponse.confidence > 70) {
      return 'Strong Negative';
    } else if (aiResponse.sentiment === 'BULLISH') {
      return 'Moderately Positive';
    } else if (aiResponse.sentiment === 'BEARISH') {
      return 'Moderately Negative';
    }
    return 'Neutral';
  }

  parseAIResponse(aiInsights) {
    const sentimentMatch = aiInsights.match(/sentiment[:\s]*(BULLISH|BEARISH|NEUTRAL)/i);
    const signalMatch = aiInsights.match(/signal[:\s]*(BUY|SELL|HOLD)/i);
    const confidenceMatch = aiInsights.match(/confidence[:\s]*(\d+)%?/i);
    
    return {
      overallSentiment: sentimentMatch ? sentimentMatch[1].toUpperCase() : 'NEUTRAL',
      tradingSignal: signalMatch ? signalMatch[1].toUpperCase() : 'HOLD',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
      fullAnalysis: aiInsights,
      keyFactors: this.extractKeyFactors(aiInsights),
      riskFactors: this.extractRiskFactors(aiInsights),
      marketOutlook: this.extractOutlook(aiInsights)
    };
  }

  extractKeyFactors(text) {
    const factors = [];
    if (text.toLowerCase().includes('volume')) factors.push('Volume patterns');
    if (text.toLowerCase().includes('breadth')) factors.push('Market breadth');
    if (text.toLowerCase().includes('volatility')) factors.push('Volatility levels');
    if (text.toLowerCase().includes('momentum')) factors.push('Price momentum');
    return factors;
  }

  extractRiskFactors(text) {
    const risks = [];
    if (text.toLowerCase().includes('high risk')) risks.push('High market risk');
    if (text.toLowerCase().includes('volatile')) risks.push('High volatility');
    if (text.toLowerCase().includes('uncertain')) risks.push('Market uncertainty');
    return risks;
  }

  extractOutlook(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('positive') || lowerText.includes('bullish')) return 'Positive';
    if (lowerText.includes('negative') || lowerText.includes('bearish')) return 'Negative';
    return 'Neutral';
  }

  combineAnalysis(traditional, ai) {
    // Dynamic weight adjustment based on market conditions
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const isOpeningHour = currentHour === 9;
    const isClosingHour = currentHour >= 15;
    const volatility = traditional.volatility.intraDayRange;
    const volumeRatio = traditional.volumeAnalysis.ratio;
    
    // Base weights
    let aiWeight = 0.6;
    let traditionalWeight = 0.4;
    
    // Adjust weights based on market conditions
    if (volatility > 2) {
      // High volatility - trust traditional indicators more
      aiWeight = 0.4;
      traditionalWeight = 0.6;
      console.log('🔄 High volatility detected - increasing traditional analysis weight');
    }
    
    if (isOpeningHour || isClosingHour) {
      // Opening/closing hours - increase AI weight for sentiment
      aiWeight = 0.7;
      traditionalWeight = 0.3;
      console.log('🔄 Opening/Closing hours - increasing AI sentiment weight');
    }
    
    // Volume-based confidence adjustment
    let confidenceMultiplier = 1.0;
    if (volumeRatio < 0.5) {
      confidenceMultiplier = 0.8; // Low volume = lower confidence
      console.log('🔄 Low volume detected - reducing confidence');
    } else if (volumeRatio > 2.0) {
      confidenceMultiplier = 1.2; // High volume = higher confidence
      console.log('🔄 High volume detected - increasing confidence');
    }
    
    const signalScores = { 'BUY': 1, 'HOLD': 0, 'SELL': -1 };
    const traditionalScore = signalScores[traditional.overallSentiment?.signal || 'HOLD'] || 0;
    const aiScore = signalScores[ai.tradingSignal] || 0;
    
    const combinedScore = (traditionalScore * traditionalWeight) + (aiScore * aiWeight);
    
    let finalSignal = 'HOLD';
    if (combinedScore > 0.3) finalSignal = 'BUY';
    else if (combinedScore < -0.3) finalSignal = 'SELL';
    
    const traditionalConfidence = traditional.overallSentiment?.confidence || 50;
    const rawConfidence = Math.round(
      (traditionalConfidence * traditionalWeight) + (ai.confidence * aiWeight)
    );
    
    // Apply confidence multiplier
    const finalConfidence = Math.min(95, Math.max(20, rawConfidence * confidenceMultiplier));

    return {
      signal: finalSignal,
      confidence: finalConfidence,
      marketMood: ai.overallSentiment,
      recommendations: this.generateRecommendations(finalSignal, finalConfidence, ai),
      riskFactors: ai.riskFactors,
      keyInsights: [
        `AI Sentiment: ${ai.overallSentiment}`,
        `Market Outlook: ${ai.marketOutlook}`,
        `Volume Pattern: ${traditional.volumeAnalysis.signal}`,
        `Weights Used: AI=${(aiWeight*100).toFixed(0)}%, Traditional=${(traditionalWeight*100).toFixed(0)}%`,
        `Confidence Multiplier: ${confidenceMultiplier.toFixed(2)}x`
      ],
      weightingDetails: {
        aiWeight,
        traditionalWeight,
        confidenceMultiplier,
        volatilityAdjustment: volatility > 2,
        timeAdjustment: isOpeningHour || isClosingHour,
        volumeAdjustment: volumeRatio < 0.5 || volumeRatio > 2.0
      }
    };
  }

  enhancedCombineAnalysis(traditional, ai, historical, microstructure, optimalWeights) {
    // Use performance-optimized weights
    let aiWeight = optimalWeights.ai;
    let traditionalWeight = optimalWeights.technical;
    let historicalWeight = optimalWeights.historical || 0.2;
    let microWeight = 0.15;
    
    // Normalize weights
    const totalWeight = aiWeight + traditionalWeight + historicalWeight + microWeight;
    aiWeight /= totalWeight;
    traditionalWeight /= totalWeight;
    historicalWeight /= totalWeight;
    microWeight /= totalWeight;
    
    // Dynamic adjustment based on market conditions
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const isOpeningHour = currentHour === 9;
    const isClosingHour = currentHour >= 15;
    const volatility = traditional.volatility.intraDayRange;
    const volumeRatio = traditional.volumeAnalysis.ratio;
    
    // Market condition adjustments
    if (volatility > 2) {
      // High volatility - increase historical weight
      historicalWeight *= 1.3;
      aiWeight *= 0.9;
    }
    
    if (isOpeningHour || isClosingHour) {
      // Opening/closing - increase AI and microstructure weight
      aiWeight *= 1.2;
      microWeight *= 1.4;
    }
    
    // Historical confidence adjustment
    let confidenceMultiplier = historical.confidenceAdjustment || 1.0;
    if (historical.accuracy > 80) confidenceMultiplier *= 1.1;
    if (historical.accuracy < 50) confidenceMultiplier *= 0.9;
    
    // Microstructure adjustment
    if (microstructure.liquidityRisk === 'HIGH') confidenceMultiplier *= 0.8;
    if (microstructure.orderFlowBias !== 'NEUTRAL') confidenceMultiplier *= 1.1;
    
    // Calculate weighted signal scores
    const signalScores = { 'BUY': 1, 'HOLD': 0, 'SELL': -1 };
    const traditionalScore = signalScores[traditional.overallSentiment?.signal || 'HOLD'] || 0;
    const aiScore = signalScores[ai.tradingSignal] || 0;
    const historicalScore = this.getHistoricalSignalScore(historical);
    const microScore = this.getMicrostructureSignalScore(microstructure);
    
    const combinedScore = (traditionalScore * traditionalWeight) + 
                         (aiScore * aiWeight) + 
                         (historicalScore * historicalWeight) + 
                         (microScore * microWeight);
    
    // Determine final signal with enhanced thresholds
    let finalSignal = 'HOLD';
    if (combinedScore > 0.25) finalSignal = 'BUY';
    else if (combinedScore < -0.25) finalSignal = 'SELL';
    
    // Calculate enhanced confidence
    const traditionalConfidence = traditional.overallSentiment?.confidence || 50;
    const rawConfidence = Math.round(
      (traditionalConfidence * traditionalWeight) + 
      (ai.confidence * aiWeight) + 
      (historical.confidence === 'HIGH' ? 80 : historical.confidence === 'MEDIUM' ? 60 : 40) * historicalWeight +
      (this.getMicrostructureConfidence(microstructure) * microWeight)
    );
    
    const finalConfidence = Math.min(95, Math.max(20, rawConfidence * confidenceMultiplier));
    
    // Calculate expected move based on historical patterns
    const expectedMove = this.calculateExpectedMove(historical, microstructure, finalSignal);
    
    return {
      signal: finalSignal,
      confidence: finalConfidence,
      expectedMove: expectedMove,
      marketMood: ai.overallSentiment,
      recommendations: this.generateEnhancedRecommendations(finalSignal, finalConfidence, ai, historical, microstructure),
      riskFactors: this.combineRiskFactors(ai.riskFactors, historical, microstructure),
      keyInsights: [
        `Enhanced AI Sentiment: ${ai.overallSentiment}`,
        `Historical Match: ${historical.accuracy}% accuracy (${historical.similarCount} patterns)`,
        `Microstructure: ${microstructure.orderFlowBias} flow, ${microstructure.liquidityRisk} liquidity risk`,
        `Optimal Weights: AI=${(aiWeight*100).toFixed(0)}%, Tech=${(traditionalWeight*100).toFixed(0)}%, Hist=${(historicalWeight*100).toFixed(0)}%, Micro=${(microWeight*100).toFixed(0)}%`,
        `Confidence Multiplier: ${confidenceMultiplier.toFixed(2)}x`,
        `Expected 15min Move: ${expectedMove > 0 ? '+' : ''}${expectedMove.toFixed(2)}%`
      ],
      enhancedMetrics: {
        historicalAccuracy: historical.accuracy,
        patternMatches: historical.similarCount,
        microstructureBias: microstructure.orderFlowBias,
        liquidityRisk: microstructure.liquidityRisk,
        smartMoneyFlow: microstructure.smartMoneyFlow,
        dominantPattern: historical.dominantPattern,
        riskAdjustment: historical.riskAdjustment
      }
    };
  }

  getHistoricalSignalScore(historical) {
    switch (historical.dominantPattern) {
      case 'BULLISH_PATTERN': return 0.8;
      case 'BEARISH_PATTERN': return -0.8;
      default: return 0;
    }
  }

  getMicrostructureSignalScore(microstructure) {
    let score = 0;
    
    if (microstructure.orderFlowBias === 'BULLISH') score += 0.6;
    else if (microstructure.orderFlowBias === 'BEARISH') score -= 0.6;
    
    if (microstructure.institutionalSentiment === 'BULLISH') score += 0.4;
    else if (microstructure.institutionalSentiment === 'BEARISH') score -= 0.4;
    
    return Math.max(-1, Math.min(1, score));
  }

  getMicrostructureConfidence(microstructure) {
    let confidence = 50;
    
    if (microstructure.liquidityRisk === 'LOW') confidence += 15;
    else if (microstructure.liquidityRisk === 'HIGH') confidence -= 15;
    
    if (microstructure.depthQuality === 'EXCELLENT') confidence += 10;
    else if (microstructure.depthQuality === 'POOR') confidence -= 10;
    
    return Math.max(20, Math.min(80, confidence));
  }

  calculateExpectedMove(historical, microstructure, signal) {
    let baseMove = 0;
    
    if (signal === 'BUY') baseMove = 0.3;
    else if (signal === 'SELL') baseMove = -0.3;
    
    // Adjust based on historical patterns
    if (historical.avgOutcome && Math.abs(historical.avgOutcome) > 0.1) {
      baseMove = historical.avgOutcome * 0.7; // Weight historical outcome
    }
    
    // Adjust based on microstructure
    if (microstructure.flowImbalance > 0.7) {
      baseMove *= 1.2; // Strong flow imbalance suggests larger move
    }
    
    return baseMove;
  }

  generateEnhancedRecommendations(signal, confidence, ai, historical, microstructure) {
    const recommendations = [];
    
    if (signal === 'BUY') {
      recommendations.push('🟢 Enhanced BUY signal detected');
      if (confidence > 75 && historical.accuracy > 70) {
        recommendations.push('🎯 High confidence with strong historical backing');
      }
      if (microstructure.smartMoneyFlow === 'BUYING') {
        recommendations.push('💰 Smart money flow confirms bullish sentiment');
      }
    } else if (signal === 'SELL') {
      recommendations.push('🔴 Enhanced SELL signal detected');
      if (confidence > 75 && historical.accuracy > 70) {
        recommendations.push('🎯 High confidence with strong historical backing');
      }
      if (microstructure.smartMoneyFlow === 'SELLING') {
        recommendations.push('💰 Smart money flow confirms bearish sentiment');
      }
    } else {
      recommendations.push('⚪ HOLD - Mixed signals or low conviction');
    }
    
    // Risk management recommendations
    if (microstructure.liquidityRisk === 'HIGH') {
      recommendations.push('⚠️ High liquidity risk - reduce position size');
    }
    
    if (historical.riskAdjustment > 1.2) {
      recommendations.push('📊 Historical volatility suggests increased risk');
    }
    
    return recommendations;
  }

  combineRiskFactors(aiRisks, historical, microstructure) {
    const risks = [...(aiRisks || [])];
    
    if (historical.accuracy < 60) {
      risks.push('Low historical pattern accuracy');
    }
    
    if (microstructure.liquidityRisk === 'HIGH') {
      risks.push('High market liquidity risk');
    }
    
    if (microstructure.flowImbalance > 0.8) {
      risks.push('Extreme order flow imbalance');
    }
    
    return risks;
  }

  generateRecommendations(signal, confidence, aiAnalysis) {
    const recommendations = [];
    
    if (signal === 'BUY') {
      recommendations.push('🟢 Consider long positions with risk management');
      if (confidence > 70) {
        recommendations.push('High AI confidence - standard position size');
      } else {
        recommendations.push('Moderate confidence - reduced position size');
      }
    } else if (signal === 'SELL') {
      recommendations.push('🔴 Consider short positions or exit longs');
      recommendations.push('Monitor support levels closely');
    } else {
      recommendations.push('🟡 Hold positions and wait for clearer signals');
    }
    
    if (aiAnalysis.riskFactors.length > 0) {
      recommendations.push(`⚠️ Risk Alert: ${aiAnalysis.riskFactors[0]}`);
    }
    
    return recommendations;
  }

  getFallbackAIAnalysis() {
    return {
      overallSentiment: 'NEUTRAL',
      tradingSignal: 'HOLD',
      confidence: 40,
      fullAnalysis: 'AI analysis unavailable - using traditional methods',
      keyFactors: ['Technical indicators only'],
      riskFactors: ['AI analysis unavailable'],
      marketOutlook: 'Neutral'
    };
  }

  getFallbackAnalysis() {
    return {
      agent: this.name,
      signal: 'HOLD',
      confidence: 30,
      analysis: {
        error: 'Analysis unavailable',
        fallback: true
      },
      recommendations: ['System error - avoid trading until resolved'],
      timestamp: new Date()
    };
  }

  analyzeVolume(niftyData) {
    // Analyze volume patterns for sentiment
    const avgVolume = 50000000; // Assumed average daily volume
    const currentVolume = niftyData.volume || 0;
    const volumeRatio = currentVolume / avgVolume;
    
    let volumeSignal = 'NEUTRAL';
    let volumeStrength = 'MEDIUM';
    
    if (volumeRatio > 1.5) {
      volumeSignal = niftyData.changePercent > 0 ? 'BULLISH_VOLUME' : 'BEARISH_VOLUME';
      volumeStrength = 'HIGH';
    } else if (volumeRatio < 0.7) {
      volumeSignal = 'LOW_CONVICTION';
      volumeStrength = 'LOW';
    }
    
    return {
      signal: volumeSignal,
      strength: volumeStrength,
      ratio: volumeRatio,
      currentVolume: currentVolume
    };
  }

  analyzeSectorRotation(topStocks) {
    // Enhanced sector rotation analysis with inter-market relationships
    const sectorPerformance = {
      banking: topStocks.filter(stock => 
        ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'SBIN.NS'].includes(stock.symbol)
      ),
      it: topStocks.filter(stock => 
        ['TCS.NS', 'INFOSYS.NS', 'WIPRO.NS', 'HCLTECH.NS'].includes(stock.symbol)
      ),
      energy: topStocks.filter(stock => 
        ['RELIANCE.NS', 'ONGC.NS', 'POWERGRID.NS'].includes(stock.symbol)
      ),
      fmcg: topStocks.filter(stock => 
        ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS'].includes(stock.symbol)
      ),
      auto: topStocks.filter(stock => 
        ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS'].includes(stock.symbol)
      ),
      pharma: topStocks.filter(stock => 
        ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS'].includes(stock.symbol)
      ),
      metal: topStocks.filter(stock => 
        ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'COALINDIA.NS'].includes(stock.symbol)
      )
    };

    const sectorAvgs = {};
    const sectorStrengths = {};
    const sectorTrends = {};
    
    Object.keys(sectorPerformance).forEach(sector => {
      const stocks = sectorPerformance[sector];
      if (stocks.length > 0) {
        const avg = stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length;
        const strength = this.calculateSectorStrength(stocks);
        const trend = this.calculateSectorTrend(stocks);
        
        sectorAvgs[sector] = avg;
        sectorStrengths[sector] = strength;
        sectorTrends[sector] = trend;
      } else {
        sectorAvgs[sector] = 0;
        sectorStrengths[sector] = 'WEAK';
        sectorTrends[sector] = 'NEUTRAL';
      }
    });

    const leadingSector = Object.keys(sectorAvgs).reduce((a, b) => 
      sectorAvgs[a] > sectorAvgs[b] ? a : b
    );

    const laggingSector = Object.keys(sectorAvgs).reduce((a, b) => 
      sectorAvgs[a] < sectorAvgs[b] ? a : b
    );

    // Calculate rotation strength
    const rotationStrength = Math.abs(sectorAvgs[leadingSector] - sectorAvgs[laggingSector]);
    
    // Determine rotation signal
    let rotationSignal = 'WEAK_ROTATION';
    if (rotationStrength > 2) rotationSignal = 'STRONG_ROTATION';
    if (rotationStrength > 1.5) rotationSignal = 'MODERATE_ROTATION';

    // Calculate market leadership quality
    const leadershipQuality = this.calculateLeadershipQuality(sectorAvgs, sectorStrengths);

    return {
      sectorPerformance: sectorAvgs,
      sectorStrengths: sectorStrengths,
      sectorTrends: sectorTrends,
      leadingSector: leadingSector,
      laggingSector: laggingSector,
      leaderPerformance: sectorAvgs[leadingSector],
      rotationStrength: rotationStrength,
      rotationSignal: rotationSignal,
      leadershipQuality: leadershipQuality,
      marketBreadthSignal: this.calculateMarketBreadthFromSectors(sectorAvgs)
    };
  }

  calculateSectorStrength(sectorStocks) {
    const positiveStocks = sectorStocks.filter(stock => stock.changePercent > 0).length;
    const totalStocks = sectorStocks.length;
    const strengthRatio = positiveStocks / totalStocks;
    
    if (strengthRatio >= 0.8) return 'VERY_STRONG';
    if (strengthRatio >= 0.6) return 'STRONG';
    if (strengthRatio >= 0.4) return 'MODERATE';
    if (strengthRatio >= 0.2) return 'WEAK';
    return 'VERY_WEAK';
  }

  calculateSectorTrend(sectorStocks) {
    const avgChange = sectorStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / sectorStocks.length;
    
    if (avgChange > 1.5) return 'STRONG_BULLISH';
    if (avgChange > 0.5) return 'BULLISH';
    if (avgChange > -0.5) return 'NEUTRAL';
    if (avgChange > -1.5) return 'BEARISH';
    return 'STRONG_BEARISH';
  }

  calculateLeadershipQuality(sectorAvgs, sectorStrengths) {
    const sectors = Object.keys(sectorAvgs);
    const positiveSectors = sectors.filter(sector => sectorAvgs[sector] > 0).length;
    const strongSectors = sectors.filter(sector => 
      sectorStrengths[sector] === 'STRONG' || sectorStrengths[sector] === 'VERY_STRONG'
    ).length;
    
    const leadershipRatio = (positiveSectors + strongSectors) / (sectors.length * 2);
    
    if (leadershipRatio >= 0.7) return 'EXCELLENT';
    if (leadershipRatio >= 0.5) return 'GOOD';
    if (leadershipRatio >= 0.3) return 'MODERATE';
    return 'POOR';
  }

  calculateMarketBreadthFromSectors(sectorAvgs) {
    const sectors = Object.values(sectorAvgs);
    const positiveSectors = sectors.filter(avg => avg > 0).length;
    const totalSectors = sectors.length;
    const breadthRatio = positiveSectors / totalSectors;
    
    if (breadthRatio >= 0.7) return 'BROAD_BASED_RALLY';
    if (breadthRatio >= 0.5) return 'SELECTIVE_STRENGTH';
    if (breadthRatio >= 0.3) return 'MIXED_SIGNALS';
    return 'BROAD_BASED_WEAKNESS';
  }

  analyzeMarketBreadth(topStocks) {
    const totalStocks = topStocks.length;
    const advancers = topStocks.filter(stock => stock.changePercent > 0).length;
    const decliners = topStocks.filter(stock => stock.changePercent < 0).length;
    const unchanged = totalStocks - advancers - decliners;
    
    const advanceDeclineRatio = advancers / (decliners + 1); // Add 1 to avoid division by zero
    
    let breadthSignal = 'NEUTRAL';
    if (advanceDeclineRatio > 2) breadthSignal = 'STRONG_BULLISH';
    else if (advanceDeclineRatio > 1.5) breadthSignal = 'BULLISH';
    else if (advanceDeclineRatio < 0.5) breadthSignal = 'BEARISH';
    else if (advanceDeclineRatio < 0.33) breadthSignal = 'STRONG_BEARISH';
    
    return {
      advancers,
      decliners,
      unchanged,
      ratio: advanceDeclineRatio,
      signal: breadthSignal,
      participation: (advancers + decliners) / totalStocks
    };
  }

  analyzeVolatility(niftyData) {
    // Calculate intraday volatility
    const high = niftyData.high || niftyData.currentPrice;
    const low = niftyData.low || niftyData.currentPrice;
    const close = niftyData.currentPrice;
    
    const intraDayRange = ((high - low) / close) * 100;
    const changePercent = Math.abs(niftyData.changePercent || 0);
    
    let volatilityLevel = 'NORMAL';
    let volatilitySignal = 'NEUTRAL';
    
    if (intraDayRange > 2 || changePercent > 1.5) {
      volatilityLevel = 'HIGH';
      volatilitySignal = 'INCREASED_RISK';
    } else if (intraDayRange < 0.5 && changePercent < 0.3) {
      volatilityLevel = 'LOW';
      volatilitySignal = 'CONSOLIDATION';
    }
    
    return {
      level: volatilityLevel,
      signal: volatilitySignal,
      intraDayRange: intraDayRange,
      changePercent: changePercent
    };
  }

  analyzeMomentum(niftyData, topStocks) {
    const niftyMomentum = niftyData.changePercent || 0;
    const avgStockMomentum = topStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / topStocks.length;
    
    const momentumDivergence = Math.abs(niftyMomentum - avgStockMomentum);
    
    let momentumSignal = 'NEUTRAL';
    let momentumStrength = 'MEDIUM';
    
    if (niftyMomentum > 0.5 && avgStockMomentum > 0.3) {
      momentumSignal = 'STRONG_BULLISH';
      momentumStrength = 'HIGH';
    } else if (niftyMomentum < -0.5 && avgStockMomentum < -0.3) {
      momentumSignal = 'STRONG_BEARISH';
      momentumStrength = 'HIGH';
    } else if (momentumDivergence > 0.5) {
      momentumSignal = 'DIVERGENCE_WARNING';
      momentumStrength = 'WEAK';
    }
    
    return {
      signal: momentumSignal,
      strength: momentumStrength,
      niftyMomentum: niftyMomentum,
      stockMomentum: avgStockMomentum,
      divergence: momentumDivergence
    };
  }

  generateSentimentSignal(analysis) {
    let bullishScore = 0;
    let bearishScore = 0;
    let neutralScore = 0;
    
    // Overall sentiment weight: 30%
    const sentimentWeight = 0.3;
    if (analysis.overallSentiment.sentiment === 'BULLISH') bullishScore += sentimentWeight;
    else if (analysis.overallSentiment.sentiment === 'BEARISH') bearishScore += sentimentWeight;
    else neutralScore += sentimentWeight;
    
    // Volume analysis weight: 20%
    const volumeWeight = 0.2;
    if (analysis.volumeAnalysis.signal === 'BULLISH_VOLUME') bullishScore += volumeWeight;
    else if (analysis.volumeAnalysis.signal === 'BEARISH_VOLUME') bearishScore += volumeWeight;
    else if (analysis.volumeAnalysis.signal === 'LOW_CONVICTION') neutralScore += volumeWeight;
    
    // Market breadth weight: 25%
    const breadthWeight = 0.25;
    if (analysis.marketBreadth.signal.includes('BULLISH')) bullishScore += breadthWeight;
    else if (analysis.marketBreadth.signal.includes('BEARISH')) bearishScore += breadthWeight;
    else neutralScore += breadthWeight;
    
    // Momentum analysis weight: 15%
    const momentumWeight = 0.15;
    if (analysis.momentumAnalysis.signal === 'STRONG_BULLISH') bullishScore += momentumWeight;
    else if (analysis.momentumAnalysis.signal === 'STRONG_BEARISH') bearishScore += momentumWeight;
    else neutralScore += momentumWeight;
    
    // Volatility impact weight: 10%
    const volatilityWeight = 0.1;
    if (analysis.volatility.signal === 'INCREASED_RISK') bearishScore += volatilityWeight;
    else if (analysis.volatility.signal === 'CONSOLIDATION') neutralScore += volatilityWeight;
    
    // Determine final signal
    let action = 'HOLD';
    let confidence = 0;
    let reasoning = '';
    
    const maxScore = Math.max(bullishScore, bearishScore, neutralScore);
    
    if (maxScore === bullishScore && bullishScore > 0.5) {
      action = 'BUY';
      confidence = Math.min(bullishScore * 90, 85);
      reasoning = `Positive market sentiment prevails. Bullish indicators: ${(bullishScore * 100).toFixed(1)}%`;
    } else if (maxScore === bearishScore && bearishScore > 0.5) {
      action = 'SELL';
      confidence = Math.min(bearishScore * 90, 85);
      reasoning = `Negative market sentiment dominates. Bearish indicators: ${(bearishScore * 100).toFixed(1)}%`;
    } else {
      confidence = 40;
      reasoning = `Mixed market sentiment. Bullish: ${(bullishScore * 100).toFixed(1)}%, Bearish: ${(bearishScore * 100).toFixed(1)}%`;
    }
    
    return { action, confidence, reasoning };
  }
}

module.exports = MarketSentimentAgent;