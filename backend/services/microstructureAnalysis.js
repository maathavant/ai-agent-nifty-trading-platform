// Market Microstructure Analysis - Order flow and liquidity analysis
const marketData = require('./marketData');

class MicrostructureAnalysis {
  constructor() {
    this.orderBookData = [];
    this.tradeFlow = [];
    this.institutionalPatterns = [];
    this.liquidityMetrics = new Map();
  }

  async analyzeMicrostructure(niftyData, topStocks) {
    try {
      console.log('🔬 Analyzing market microstructure...');
      
      // Analyze bid-ask spread patterns
      const spreadAnalysis = await this.analyzeSpread(niftyData);
      
      // Order flow analysis
      const orderFlow = await this.analyzeOrderFlow(niftyData, topStocks);
      
      // Smart money vs retail activity
      const institutionalActivity = await this.detectInstitutionalActivity(niftyData, topStocks);
      
      // Liquidity analysis
      const liquidityAnalysis = await this.analyzeLiquidity(niftyData, topStocks);
      
      // Market depth analysis
      const depthAnalysis = await this.analyzeMarketDepth(topStocks);
      
      return {
        liquidityRisk: spreadAnalysis.risk,
        orderFlowBias: orderFlow.bias,
        institutionalSentiment: institutionalActivity.sentiment,
        microTrend: this.calculateMicroTrend(orderFlow, institutionalActivity),
        spreadTightness: spreadAnalysis.tightness,
        volumeProfile: liquidityAnalysis.profile,
        depthQuality: depthAnalysis.quality,
        flowImbalance: orderFlow.imbalance,
        smartMoneyFlow: institutionalActivity.flow,
        retailSentiment: institutionalActivity.retailSentiment
      };
    } catch (error) {
      console.error('❌ Microstructure Analysis Error:', error);
      return this.getFallbackMicrostructureAnalysis();
    }
  }

  async analyzeSpread(niftyData) {
    // Simulate bid-ask spread analysis
    // In real implementation, this would analyze actual order book data
    
    const baseSpread = 0.05; // Base spread percentage
    const volatilityMultiplier = this.calculateVolatilityMultiplier(niftyData);
    const volumeImpact = this.calculateVolumeImpact(niftyData);
    
    const currentSpread = baseSpread * volatilityMultiplier * volumeImpact;
    
    let risk = 'LOW';
    let tightness = 'GOOD';
    
    if (currentSpread > 0.15) {
      risk = 'HIGH';
      tightness = 'POOR';
    } else if (currentSpread > 0.08) {
      risk = 'MEDIUM';
      tightness = 'MODERATE';
    }
    
    return {
      spread: currentSpread,
      risk: risk,
      tightness: tightness,
      volatilityImpact: volatilityMultiplier,
      volumeImpact: volumeImpact
    };
  }

  calculateVolatilityMultiplier(niftyData) {
    const intraDayRange = ((niftyData.high - niftyData.low) / niftyData.currentPrice) * 100;
    
    if (intraDayRange > 2.0) return 2.0;  // High volatility
    if (intraDayRange > 1.0) return 1.5;  // Medium volatility
    return 1.0; // Normal volatility
  }

  calculateVolumeImpact(niftyData) {
    const avgVolume = 50000000; // Average daily volume
    const volumeRatio = niftyData.volume / avgVolume;
    
    if (volumeRatio < 0.5) return 1.5;  // Low volume = wider spreads
    if (volumeRatio > 2.0) return 0.8;  // High volume = tighter spreads
    return 1.0; // Normal volume
  }

  async analyzeOrderFlow(niftyData, topStocks) {
    // Simulate order flow analysis
    const buyPressure = this.calculateBuyPressure(topStocks);
    const sellPressure = this.calculateSellPressure(topStocks);
    const netFlow = buyPressure - sellPressure;
    
    let bias = 'NEUTRAL';
    let imbalance = Math.abs(netFlow);
    
    if (netFlow > 0.3) bias = 'BULLISH';
    else if (netFlow < -0.3) bias = 'BEARISH';
    
    // Calculate flow consistency
    const flowConsistency = this.calculateFlowConsistency(topStocks);
    
    return {
      bias: bias,
      buyPressure: buyPressure,
      sellPressure: sellPressure,
      netFlow: netFlow,
      imbalance: imbalance,
      consistency: flowConsistency,
      strength: this.calculateFlowStrength(imbalance, flowConsistency)
    };
  }

  calculateBuyPressure(topStocks) {
    const positiveStocks = topStocks.filter(stock => stock.changePercent > 0);
    const strongPositives = positiveStocks.filter(stock => stock.changePercent > 1);
    
    return (positiveStocks.length + strongPositives.length) / (topStocks.length * 2);
  }

  calculateSellPressure(topStocks) {
    const negativeStocks = topStocks.filter(stock => stock.changePercent < 0);
    const strongNegatives = negativeStocks.filter(stock => stock.changePercent < -1);
    
    return (negativeStocks.length + strongNegatives.length) / (topStocks.length * 2);
  }

  calculateFlowConsistency(topStocks) {
    // Measure how consistent the flow direction is across stocks
    const changes = topStocks.map(stock => stock.changePercent);
    const positives = changes.filter(c => c > 0).length;
    const negatives = changes.filter(c => c < 0).length;
    const neutrals = changes.filter(c => Math.abs(c) < 0.1).length;
    
    const maxCategory = Math.max(positives, negatives, neutrals);
    return maxCategory / topStocks.length;
  }

  calculateFlowStrength(imbalance, consistency) {
    const combinedStrength = (imbalance + consistency) / 2;
    
    if (combinedStrength > 0.7) return 'VERY_STRONG';
    if (combinedStrength > 0.5) return 'STRONG';
    if (combinedStrength > 0.3) return 'MODERATE';
    return 'WEAK';
  }

  async detectInstitutionalActivity(niftyData, topStocks) {
    // Simulate institutional activity detection
    const largeCapMovement = this.analyzeLargeCapMovement(topStocks);
    const volumePatterns = this.analyzeVolumePatterns(niftyData, topStocks);
    const crossCurrents = this.detectCrossCurrents(topStocks);
    
    let sentiment = 'NEUTRAL';
    let flow = 'MIXED';
    let retailSentiment = 'NEUTRAL';
    
    // Institutional sentiment based on large cap leadership
    if (largeCapMovement.leadership > 0.6) {
      sentiment = largeCapMovement.direction > 0 ? 'BULLISH' : 'BEARISH';
      flow = largeCapMovement.direction > 0 ? 'BUYING' : 'SELLING';
    }
    
    // Retail sentiment (opposite to small cap behavior in some cases)
    retailSentiment = this.calculateRetailSentiment(topStocks, largeCapMovement);
    
    return {
      sentiment: sentiment,
      flow: flow,
      retailSentiment: retailSentiment,
      largeCapLeadership: largeCapMovement.leadership,
      volumeQuality: volumePatterns.quality,
      crossCurrents: crossCurrents,
      institutionalConfidence: this.calculateInstitutionalConfidence(largeCapMovement, volumePatterns)
    };
  }

  analyzeLargeCapMovement(topStocks) {
    // Define large caps (top 10 by market cap typically)
    const largeCaps = topStocks.slice(0, 10);
    const midCaps = topStocks.slice(10, 30);
    
    const largeCapAvg = largeCaps.reduce((sum, stock) => sum + stock.changePercent, 0) / largeCaps.length;
    const midCapAvg = midCaps.reduce((sum, stock) => sum + stock.changePercent, 0) / midCaps.length;
    
    const leadership = Math.abs(largeCapAvg) / (Math.abs(largeCapAvg) + Math.abs(midCapAvg) + 0.01);
    
    return {
      direction: largeCapAvg,
      leadership: leadership,
      largeCapAvg: largeCapAvg,
      midCapAvg: midCapAvg
    };
  }

  analyzeVolumePatterns(niftyData, topStocks) {
    // Analyze volume quality and patterns
    const avgVolume = 50000000;
    const volumeRatio = niftyData.volume / avgVolume;
    
    let quality = 'NORMAL';
    if (volumeRatio > 1.5) quality = 'HIGH';
    else if (volumeRatio < 0.7) quality = 'LOW';
    
    // Volume-price relationship
    const priceChange = niftyData.changePercent;
    let volumePriceRelation = 'NEUTRAL';
    
    if (priceChange > 0.5 && volumeRatio > 1.2) {
      volumePriceRelation = 'BULLISH_CONFIRMATION';
    } else if (priceChange < -0.5 && volumeRatio > 1.2) {
      volumePriceRelation = 'BEARISH_CONFIRMATION';
    } else if (Math.abs(priceChange) > 0.5 && volumeRatio < 0.8) {
      volumePriceRelation = 'LACK_OF_CONVICTION';
    }
    
    return {
      quality: quality,
      ratio: volumeRatio,
      priceRelation: volumePriceRelation
    };
  }

  detectCrossCurrents(topStocks) {
    // Detect divergences between different groups
    const banking = topStocks.filter(s => ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS'].includes(s.symbol));
    const it = topStocks.filter(s => ['TCS.NS', 'INFOSYS.NS', 'WIPRO.NS'].includes(s.symbol));
    
    if (banking.length > 0 && it.length > 0) {
      const bankingAvg = banking.reduce((sum, s) => sum + s.changePercent, 0) / banking.length;
      const itAvg = it.reduce((sum, s) => sum + s.changePercent, 0) / it.length;
      
      const divergence = Math.abs(bankingAvg - itAvg);
      
      if (divergence > 1.5) return 'STRONG_DIVERGENCE';
      if (divergence > 0.8) return 'MODERATE_DIVERGENCE';
    }
    
    return 'ALIGNED';
  }

  calculateRetailSentiment(topStocks, largeCapMovement) {
    // Simplified retail sentiment calculation
    const smallerStocks = topStocks.slice(30); // Smaller stocks more retail-driven
    
    if (smallerStocks.length > 0) {
      const smallCapAvg = smallerStocks.reduce((sum, s) => sum + s.changePercent, 0) / smallerStocks.length;
      
      if (smallCapAvg > 1) return 'BULLISH';
      if (smallCapAvg < -1) return 'BEARISH';
    }
    
    return 'NEUTRAL';
  }

  calculateInstitutionalConfidence(largeCapMovement, volumePatterns) {
    let confidence = 50; // Base confidence
    
    // Add confidence for strong large cap leadership
    if (largeCapMovement.leadership > 0.7) confidence += 20;
    
    // Add confidence for volume confirmation
    if (volumePatterns.priceRelation.includes('CONFIRMATION')) confidence += 15;
    
    // Reduce confidence for lack of conviction
    if (volumePatterns.priceRelation === 'LACK_OF_CONVICTION') confidence -= 20;
    
    return Math.min(95, Math.max(5, confidence));
  }

  async analyzeLiquidity(niftyData, topStocks) {
    // Analyze overall market liquidity
    const volumeProfile = this.calculateVolumeProfile(niftyData);
    const marketImpact = this.estimateMarketImpact(niftyData);
    const liquidityRisk = this.assessLiquidityRisk(volumeProfile, marketImpact);
    
    return {
      profile: volumeProfile,
      impact: marketImpact,
      risk: liquidityRisk
    };
  }

  calculateVolumeProfile(niftyData) {
    const avgVolume = 50000000;
    const ratio = niftyData.volume / avgVolume;
    
    if (ratio > 2.0) return 'VERY_HIGH';
    if (ratio > 1.5) return 'HIGH';
    if (ratio > 0.8) return 'NORMAL';
    if (ratio > 0.5) return 'LOW';
    return 'VERY_LOW';
  }

  estimateMarketImpact(niftyData) {
    // Estimate market impact of large orders
    const volatility = ((niftyData.high - niftyData.low) / niftyData.currentPrice) * 100;
    
    if (volatility > 2.0) return 'HIGH_IMPACT';
    if (volatility > 1.0) return 'MODERATE_IMPACT';
    return 'LOW_IMPACT';
  }

  assessLiquidityRisk(volumeProfile, marketImpact) {
    if (volumeProfile === 'VERY_LOW' || marketImpact === 'HIGH_IMPACT') return 'HIGH';
    if (volumeProfile === 'LOW' || marketImpact === 'MODERATE_IMPACT') return 'MEDIUM';
    return 'LOW';
  }

  async analyzeMarketDepth(topStocks) {
    // Simulate market depth analysis
    const participationRate = this.calculateParticipationRate(topStocks);
    const depthQuality = this.assessDepthQuality(participationRate);
    
    return {
      participation: participationRate,
      quality: depthQuality
    };
  }

  calculateParticipationRate(topStocks) {
    const activeStocks = topStocks.filter(stock => Math.abs(stock.changePercent) > 0.1).length;
    return activeStocks / topStocks.length;
  }

  assessDepthQuality(participationRate) {
    if (participationRate > 0.8) return 'EXCELLENT';
    if (participationRate > 0.6) return 'GOOD';
    if (participationRate > 0.4) return 'MODERATE';
    return 'POOR';
  }

  calculateMicroTrend(orderFlow, institutionalActivity) {
    // Combine order flow and institutional signals
    const flowScore = this.getFlowScore(orderFlow.bias);
    const institutionalScore = this.getInstitutionalScore(institutionalActivity.sentiment);
    
    const combinedScore = (flowScore + institutionalScore) / 2;
    
    if (combinedScore > 0.6) return 'STRONG_BULLISH_MICRO';
    if (combinedScore > 0.2) return 'BULLISH_MICRO';
    if (combinedScore > -0.2) return 'NEUTRAL_MICRO';
    if (combinedScore > -0.6) return 'BEARISH_MICRO';
    return 'STRONG_BEARISH_MICRO';
  }

  getFlowScore(bias) {
    switch (bias) {
      case 'BULLISH': return 1;
      case 'BEARISH': return -1;
      default: return 0;
    }
  }

  getInstitutionalScore(sentiment) {
    switch (sentiment) {
      case 'BULLISH': return 1;
      case 'BEARISH': return -1;
      default: return 0;
    }
  }

  getFallbackMicrostructureAnalysis() {
    return {
      liquidityRisk: 'MEDIUM',
      orderFlowBias: 'NEUTRAL',
      institutionalSentiment: 'NEUTRAL',
      microTrend: 'NEUTRAL_MICRO',
      spreadTightness: 'MODERATE',
      volumeProfile: 'NORMAL',
      depthQuality: 'MODERATE',
      flowImbalance: 0.5,
      smartMoneyFlow: 'MIXED',
      retailSentiment: 'NEUTRAL'
    };
  }
}

module.exports = MicrostructureAnalysis;