// Risk Management Agent - Assesses and manages trading risks
const marketData = require('../services/marketData');
const OpenAI = require('openai');

class RiskManagementAgent {
  constructor() {
    this.name = 'Risk Management Agent';
    this.maxRiskThreshold = 0.8; // 80% confidence threshold
    this.volatilityThreshold = 2.0; // 2% daily volatility threshold
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyze() {
    console.log('🔄 Risk Management Agent: Starting AI-enhanced risk analysis...');
    
    try {
      const niftyData = await marketData.getNiftyIndexData();
      const historicalData = await marketData.getHistoricalData();
      
      const analysis = {
        volatilityRisk: this.calculateVolatilityRisk(historicalData, niftyData),
        liquidityRisk: this.assessLiquidityRisk(niftyData),
        marketRisk: this.assessMarketRisk(niftyData, historicalData),
        concentrationRisk: this.assessConcentrationRisk(),
        drawdownRisk: this.calculateDrawdownRisk(historicalData),
        correlationRisk: await this.assessCorrelationRisk(),
        timeDecayRisk: this.assessTimeDecayRisk(),
        positionSizing: this.calculatePositionSizing(niftyData, historicalData)
      };

      // Enhanced AI Risk Analysis
      const aiRiskInsights = await this.performAIAnalysis(analysis, niftyData);

      const signal = this.generateRiskSignal(analysis, aiRiskInsights);
      
      return {
        agent: this.name,
        signal: signal.action,
        confidence: signal.confidence,
        analysis: analysis,
        reasoning: signal.reasoning,
        riskScore: signal.riskScore,
        recommendations: signal.recommendations,
        aiInsights: aiRiskInsights,
        timeframe: '15min',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Risk Management Analysis Error:', error.message);
      return {
        agent: this.name,
        signal: 'HOLD',
        confidence: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  calculateVolatilityRisk(historicalData, currentData) {
    if (!historicalData || historicalData.length < 20) {
      return { level: 'UNKNOWN', score: 0.5, volatility: 0 };
    }

    // Calculate 20-day historical volatility
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i].close && historicalData[i-1].close) {
        const dailyReturn = (historicalData[i].close - historicalData[i-1].close) / historicalData[i-1].close;
        returns.push(dailyReturn);
      }
    }

    if (returns.length === 0) {
      return { level: 'UNKNOWN', score: 0.5, volatility: 0 };
    }

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

    let level = 'LOW';
    let score = 0.2;

    if (volatility > 25) {
      level = 'HIGH';
      score = 0.8;
    } else if (volatility > 18) {
      level = 'MEDIUM';
      score = 0.5;
    } else if (volatility > 12) {
      level = 'LOW_MEDIUM';
      score = 0.3;
    }

    return {
      level,
      score,
      volatility: volatility,
      intraDayVol: this.calculateIntraDayVolatility(currentData),
      trend: this.getVolatilityTrend(returns)
    };
  }

  calculateIntraDayVolatility(currentData) {
    const high = currentData.high || currentData.currentPrice;
    const low = currentData.low || currentData.currentPrice;
    const close = currentData.currentPrice;
    
    return ((high - low) / close) * 100;
  }

  getVolatilityTrend(returns) {
    if (returns.length < 10) return 'STABLE';
    
    const recent = returns.slice(-5);
    const previous = returns.slice(-10, -5);
    
    const recentVol = Math.sqrt(recent.reduce((sum, ret) => sum + ret * ret, 0) / recent.length);
    const previousVol = Math.sqrt(previous.reduce((sum, ret) => sum + ret * ret, 0) / previous.length);
    
    if (recentVol > previousVol * 1.2) return 'INCREASING';
    else if (recentVol < previousVol * 0.8) return 'DECREASING';
    else return 'STABLE';
  }

  assessLiquidityRisk(niftyData) {
    const volume = niftyData.volume || 0;
    const avgVolume = 50000000; // Assumed average volume
    const volumeRatio = volume / avgVolume;
    
    let level = 'LOW';
    let score = 0.2;
    
    if (volumeRatio < 0.3) {
      level = 'HIGH';
      score = 0.8;
    } else if (volumeRatio < 0.6) {
      level = 'MEDIUM';
      score = 0.5;
    } else if (volumeRatio < 0.8) {
      level = 'LOW_MEDIUM';
      score = 0.3;
    }
    
    return {
      level,
      score,
      volumeRatio,
      currentVolume: volume,
      impact: level === 'HIGH' ? 'Difficult to execute large orders' : 'Normal execution expected'
    };
  }

  assessMarketRisk(currentData, historicalData) {
    const changePercent = Math.abs(currentData.changePercent || 0);
    const avgChange = this.calculateAverageChange(historicalData);
    
    let level = 'LOW';
    let score = 0.2;
    
    if (changePercent > avgChange * 2) {
      level = 'HIGH';
      score = 0.8;
    } else if (changePercent > avgChange * 1.5) {
      level = 'MEDIUM';
      score = 0.5;
    } else if (changePercent > avgChange) {
      level = 'LOW_MEDIUM';
      score = 0.3;
    }
    
    return {
      level,
      score,
      currentChange: changePercent,
      avgChange,
      marketCondition: this.getMarketCondition(currentData, historicalData)
    };
  }

  calculateAverageChange(historicalData) {
    if (!historicalData || historicalData.length < 2) return 1;
    
    const changes = [];
    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i].close && historicalData[i-1].close) {
        const change = Math.abs((historicalData[i].close - historicalData[i-1].close) / historicalData[i-1].close * 100);
        changes.push(change);
      }
    }
    
    return changes.length > 0 ? changes.reduce((sum, change) => sum + change, 0) / changes.length : 1;
  }

  getMarketCondition(currentData, historicalData) {
    if (!historicalData || historicalData.length < 5) return 'UNKNOWN';
    
    const recent = historicalData.slice(-5);
    const trend = recent.every((data, i) => i === 0 || data.close >= recent[i-1].close);
    
    if (trend && currentData.changePercent > 0) return 'BULL_TREND';
    else if (!trend && currentData.changePercent < 0) return 'BEAR_TREND';
    else return 'SIDEWAYS';
  }

  assessConcentrationRisk() {
    // For Nifty 50 index, concentration risk is generally low due to diversification
    return {
      level: 'LOW',
      score: 0.2,
      topHoldings: 'Top 10 stocks make up ~60% of index',
      diversification: 'Well diversified across sectors',
      impact: 'Limited single stock impact risk'
    };
  }

  calculateDrawdownRisk(historicalData) {
    if (!historicalData || historicalData.length < 10) {
      return { level: 'UNKNOWN', score: 0.5, maxDrawdown: 0 };
    }

    let peak = historicalData[0].close;
    let maxDrawdown = 0;
    
    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i].close > peak) {
        peak = historicalData[i].close;
      }
      
      const drawdown = (peak - historicalData[i].close) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    maxDrawdown *= 100; // Convert to percentage
    
    let level = 'LOW';
    let score = 0.2;
    
    if (maxDrawdown > 10) {
      level = 'HIGH';
      score = 0.8;
    } else if (maxDrawdown > 5) {
      level = 'MEDIUM';
      score = 0.5;
    } else if (maxDrawdown > 2) {
      level = 'LOW_MEDIUM';
      score = 0.3;
    }
    
    return {
      level,
      score,
      maxDrawdown,
      currentDrawdown: this.getCurrentDrawdown(historicalData),
      recovery: 'Historical recovery time: 15-45 days average'
    };
  }

  getCurrentDrawdown(historicalData) {
    if (historicalData.length < 2) return 0;
    
    const currentPrice = historicalData[historicalData.length - 1].close;
    let recentPeak = currentPrice;
    
    // Look back 20 periods for recent peak
    const lookback = Math.min(20, historicalData.length);
    for (let i = historicalData.length - lookback; i < historicalData.length; i++) {
      if (historicalData[i].close > recentPeak) {
        recentPeak = historicalData[i].close;
      }
    }
    
    return ((recentPeak - currentPrice) / recentPeak) * 100;
  }

  async assessCorrelationRisk() {
    // Mock correlation analysis with global markets
    return {
      level: 'MEDIUM',
      score: 0.4,
      globalCorrelation: 0.65,
      sectorCorrelation: 0.75,
      impact: 'Moderate correlation with global markets may amplify volatility',
      diversificationBenefit: 'Limited during global crisis events'
    };
  }

  assessTimeDecayRisk() {
    // For 15-minute trading decisions, time decay is minimal
    return {
      level: 'LOW',
      score: 0.1,
      timeframe: '15 minutes',
      impact: 'Minimal time decay risk for short-term positions',
      recommendation: 'Suitable for intraday strategies'
    };
  }

  calculatePositionSizing(currentData, historicalData) {
    const volatilityRisk = this.calculateVolatilityRisk(historicalData, currentData);
    const basePosition = 100; // Base position size percentage
    
    // Adjust position based on volatility
    let adjustedPosition = basePosition;
    if (volatilityRisk.level === 'HIGH') adjustedPosition *= 0.5;
    else if (volatilityRisk.level === 'MEDIUM') adjustedPosition *= 0.75;
    else if (volatilityRisk.level === 'LOW_MEDIUM') adjustedPosition *= 0.9;
    
    return {
      recommendedSize: Math.round(adjustedPosition),
      riskAdjustment: ((adjustedPosition - basePosition) / basePosition) * 100,
      stopLoss: this.calculateStopLoss(currentData, volatilityRisk),
      targetPrice: this.calculateTarget(currentData, volatilityRisk)
    };
  }

  calculateStopLoss(currentData, volatilityRisk) {
    const currentPrice = currentData.currentPrice;
    let stopLossPercent = 2; // Default 2%
    
    // Adjust based on volatility
    if (volatilityRisk.level === 'HIGH') stopLossPercent = 3;
    else if (volatilityRisk.level === 'LOW') stopLossPercent = 1.5;
    
    return {
      buyStopLoss: currentPrice * (1 - stopLossPercent / 100),
      sellStopLoss: currentPrice * (1 + stopLossPercent / 100),
      percentage: stopLossPercent
    };
  }

  calculateTarget(currentData, volatilityRisk) {
    const currentPrice = currentData.currentPrice;
    let targetPercent = 1.5; // Default 1.5% target
    
    // Adjust based on volatility
    if (volatilityRisk.level === 'HIGH') targetPercent = 2.5;
    else if (volatilityRisk.level === 'LOW') targetPercent = 1;
    
    return {
      buyTarget: currentPrice * (1 + targetPercent / 100),
      sellTarget: currentPrice * (1 - targetPercent / 100),
      percentage: targetPercent
    };
  }

  async performAIAnalysis(analysis, currentData) {
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI not available for risk analysis');
      return { insights: 'AI risk analysis unavailable', riskLevel: 'MEDIUM' };
    }

    try {
      const prompt = `As an expert risk management analyst, assess these Nifty 50 trading risks:

Current Market Data:
- Price: ₹${currentData.currentPrice}
- Change: ${currentData.changePercent}%
- Volume: ${currentData.volume}

Risk Assessment:
- Volatility Risk: ${analysis.volatilityRisk?.level} (${(analysis.volatilityRisk?.score * 100).toFixed(1)}%)
- Liquidity Risk: ${analysis.liquidityRisk?.level}
- Market Risk: ${analysis.marketRisk?.level}
- Position Sizing: Recommended ${analysis.positionSizing?.recommendation}%

Please provide:
1. RISK_SIGNAL: [AVOID_TRADE/CAUTIOUS_TRADE/APPROVE_TRADE]
2. OVERALL_RISK: [LOW/MEDIUM/HIGH]
3. CONFIDENCE: [0-100]%
4. KEY_RISKS: [Top 2-3 risks to monitor]
5. POSITION_ADVICE: [Position sizing recommendation]
6. STOP_LOSS: [Recommended stop-loss level]
7. TIME_HORIZON: [Risk assessment for 15-minute timeframe]

Focus on actionable risk management for short-term Nifty 50 trading.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: 0.2
      });

      const aiResponse = response.choices[0].message.content;
      console.log('🤖 Risk AI Analysis:', aiResponse.substring(0, 150) + '...');

      // Parse AI response
      const signalMatch = aiResponse.match(/RISK_SIGNAL:\s*(AVOID_TRADE|CAUTIOUS_TRADE|APPROVE_TRADE)/i);
      const riskMatch = aiResponse.match(/OVERALL_RISK:\s*(LOW|MEDIUM|HIGH)/i);
      const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*(\d+)/);
      const risksMatch = aiResponse.match(/KEY_RISKS:\s*([^\n]+)/);
      const positionMatch = aiResponse.match(/POSITION_ADVICE:\s*([^\n]+)/);
      
      return {
        signal: signalMatch ? signalMatch[1] : 'CAUTIOUS_TRADE',
        riskLevel: riskMatch ? riskMatch[1] : 'MEDIUM',
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 60,
        keyRisks: risksMatch ? risksMatch[1] : 'Monitor market volatility',
        positionAdvice: positionMatch ? positionMatch[1] : 'Use conservative position sizing',
        insights: aiResponse
      };

    } catch (error) {
      console.error('❌ Risk AI Analysis failed:', error.message);
      return {
        signal: 'CAUTIOUS_TRADE',
        riskLevel: 'MEDIUM',
        confidence: 50,
        insights: 'AI risk analysis failed, using conservative approach',
        error: error.message
      };
    }
  }

  generateRiskSignal(analysis, aiInsights) {
    // Calculate overall risk score
    const weights = {
      volatility: 0.3,
      liquidity: 0.2,
      market: 0.25,
      drawdown: 0.15,
      correlation: 0.1
    };

    const overallRiskScore = 
      analysis.volatilityRisk.score * weights.volatility +
      analysis.liquidityRisk.score * weights.liquidity +
      analysis.marketRisk.score * weights.market +
      analysis.drawdownRisk.score * weights.drawdown +
      analysis.correlationRisk.score * weights.correlation;

    let action = 'HOLD';
    let confidence = 50;
    let recommendations = [];

    if (overallRiskScore < 0.3) {
      action = 'APPROVE_TRADE';
      confidence = 80;
      recommendations.push('Low risk environment suitable for trading');
    } else if (overallRiskScore < 0.6) {
      action = 'CAUTIOUS_TRADE';
      confidence = 60;
      recommendations.push('Moderate risk - reduce position size');
      recommendations.push('Use tighter stop-losses');
    } else {
      action = 'AVOID_TRADE';
      confidence = 75;
      recommendations.push('High risk environment - consider avoiding new positions');
      recommendations.push('Focus on capital preservation');
    }

    // Additional recommendations based on specific risks
    if (analysis.volatilityRisk.level === 'HIGH') {
      recommendations.push('High volatility detected - use smaller position sizes');
    }
    if (analysis.liquidityRisk.level === 'HIGH') {
      recommendations.push('Low liquidity - expect wider spreads and slippage');
    }
    if (analysis.drawdownRisk.currentDrawdown > 3) {
      recommendations.push(`Current drawdown: ${analysis.drawdownRisk.currentDrawdown.toFixed(1)}% - monitor closely`);
    }

    return {
      action,
      confidence,
      riskScore: overallRiskScore,
      reasoning: `Overall risk score: ${(overallRiskScore * 100).toFixed(1)}%. Key risks: ${this.identifyKeyRisks(analysis).join(', ')}`,
      recommendations
    };
  }

  identifyKeyRisks(analysis) {
    const risks = [];
    
    if (analysis.volatilityRisk.score > 0.6) risks.push('High volatility');
    if (analysis.liquidityRisk.score > 0.6) risks.push('Liquidity concerns');
    if (analysis.marketRisk.score > 0.6) risks.push('Market stress');
    if (analysis.drawdownRisk.score > 0.6) risks.push('Drawdown risk');
    
    return risks.length > 0 ? risks : ['Normal market conditions'];
  }
}

module.exports = RiskManagementAgent;