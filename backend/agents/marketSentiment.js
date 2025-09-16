// Market Sentiment Agent - Enhanced with OpenAI for intelligent analysis
const marketData = require('../services/marketData');
const OpenAI = require('openai');

class MarketSentimentAgent {
  constructor() {
    this.name = 'Market Sentiment Agent';
    this.description = 'AI-powered market sentiment analysis using OpenAI';
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
  }

  async analyze() {
    try {
      console.log('🤖 Running AI-Enhanced Market Sentiment Analysis...');
      
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
        momentumAnalysis: this.analyzeMomentum(niftyData)
      };

      // AI-Enhanced Analysis using OpenAI
      const aiAnalysis = await this.performAIAnalysis(traditionalAnalysis, niftyData, topStocks);

      // Combine traditional and AI analysis
      const finalAnalysis = this.combineAnalysis(traditionalAnalysis, aiAnalysis);

      return {
        agent: this.name,
        timestamp: new Date(),
        signal: finalAnalysis.signal,
        confidence: finalAnalysis.confidence,
        analysis: {
          traditional: traditionalAnalysis,
          aiInsights: aiAnalysis,
          combined: finalAnalysis
        },
        recommendations: finalAnalysis.recommendations,
        marketMood: finalAnalysis.marketMood,
        riskFactors: finalAnalysis.riskFactors
      };
      
    } catch (error) {
      console.error('❌ Market Sentiment Agent Error:', error);
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

      const prompt = `
You are an expert Indian stock market analyst specializing in Nifty 50 sentiment analysis. Analyze the following market data:

MARKET DATA:
- Nifty 50 Current Price: ₹${niftyData.currentPrice}
- Change: ${niftyData.change > 0 ? '+' : ''}${niftyData.change} (${niftyData.changePercent}%)
- Volume: ${niftyData.volume}
- High: ₹${niftyData.high}, Low: ₹${niftyData.low}

TECHNICAL INDICATORS:
- Volume Analysis: ${traditionalAnalysis.volumeAnalysis.signal}
- Market Breadth: ${traditionalAnalysis.marketBreadth.signal}
- Volatility: ${traditionalAnalysis.volatility.level}
- Momentum: ${traditionalAnalysis.momentumAnalysis.signal}

Provide analysis with:
1. Overall sentiment (BULLISH/BEARISH/NEUTRAL)
2. Trading signal (BUY/SELL/HOLD)
3. Confidence level (0-100%)
4. Key risk factors
5. 15-minute outlook

Format as structured response.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional Indian stock market analyst with expertise in Nifty 50 trading. Provide precise, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const aiInsights = response.choices[0].message.content;
      return this.parseAIResponse(aiInsights);
      
    } catch (error) {
      console.error('🔴 OpenAI Analysis Error:', error);
      return this.getFallbackAIAnalysis();
    }
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
    const aiWeight = 0.6;
    const traditionalWeight = 0.4;
    
    const signalScores = { 'BUY': 1, 'HOLD': 0, 'SELL': -1 };
    const traditionalScore = signalScores[traditional.overallSentiment?.signal || 'HOLD'] || 0;
    const aiScore = signalScores[ai.tradingSignal] || 0;
    
    const combinedScore = (traditionalScore * traditionalWeight) + (aiScore * aiWeight);
    
    let finalSignal = 'HOLD';
    if (combinedScore > 0.3) finalSignal = 'BUY';
    else if (combinedScore < -0.3) finalSignal = 'SELL';
    
    const traditionalConfidence = traditional.overallSentiment?.confidence || 50;
    const combinedConfidence = Math.round(
      (traditionalConfidence * traditionalWeight) + (ai.confidence * aiWeight)
    );

    return {
      signal: finalSignal,
      confidence: Math.min(95, Math.max(20, combinedConfidence)),
      marketMood: ai.overallSentiment,
      recommendations: this.generateRecommendations(finalSignal, combinedConfidence, ai),
      riskFactors: ai.riskFactors,
      keyInsights: [
        `AI Sentiment: ${ai.overallSentiment}`,
        `Market Outlook: ${ai.marketOutlook}`,
        `Volume Pattern: ${traditional.volumeAnalysis.signal}`
      ]
    };
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
    // Analyze which sectors are leading
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
      )
    };

    const sectorAvgs = {};
    Object.keys(sectorPerformance).forEach(sector => {
      const stocks = sectorPerformance[sector];
      if (stocks.length > 0) {
        sectorAvgs[sector] = stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length;
      } else {
        sectorAvgs[sector] = 0;
      }
    });

    const leadingSector = Object.keys(sectorAvgs).reduce((a, b) => 
      sectorAvgs[a] > sectorAvgs[b] ? a : b
    );

    return {
      sectorPerformance: sectorAvgs,
      leadingSector: leadingSector,
      leaderPerformance: sectorAvgs[leadingSector],
      rotationSignal: Math.abs(sectorAvgs[leadingSector]) > 1 ? 'STRONG_ROTATION' : 'WEAK_ROTATION'
    };
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