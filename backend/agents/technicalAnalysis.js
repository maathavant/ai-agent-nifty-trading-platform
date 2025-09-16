// Technical Analysis Agent - Analyzes price patterns and indicators
const marketData = require('../services/marketData');
const OpenAI = require('openai');

class TechnicalAnalysisAgent {
  constructor() {
    this.name = 'Technical Analysis Agent';
    this.confidence = 0;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyze() {
    console.log('🔄 Technical Analysis Agent: Starting AI-enhanced analysis...');
    
    try {
      const historicalData = await marketData.getHistoricalData();
      const currentData = await marketData.getNiftyIndexData();
      
      if (!historicalData || historicalData.length < 20) {
        throw new Error('Insufficient historical data for technical analysis');
      }

      const analysis = {
        rsi: this.calculateRSI(historicalData),
        macd: this.calculateMACD(historicalData),
        sma: this.calculateSMA(historicalData),
        ema: this.calculateEMA(historicalData),
        bollinger: this.calculateBollingerBands(historicalData),
        volumeAnalysis: this.analyzeVolume(historicalData),
        priceAction: this.analyzePriceAction(historicalData, currentData)
      };

      // Enhanced AI Analysis
      const aiInsights = await this.performAIAnalysis(analysis, currentData);
      
      const signal = this.generateSignal(analysis, aiInsights);
      
      return {
        agent: this.name,
        signal: signal.action,
        confidence: signal.confidence,
        analysis: analysis,
        reasoning: signal.reasoning,
        timeframe: '15min',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Technical Analysis Error:', error.message);
      return {
        agent: this.name,
        signal: 'HOLD',
        confidence: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return { value: 50, signal: 'NEUTRAL' };
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return { value: 100, signal: 'STRONG_BUY' };
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    let signal = 'NEUTRAL';
    if (rsi > 70) signal = 'SELL';
    else if (rsi < 30) signal = 'BUY';
    else if (rsi > 60) signal = 'WEAK_SELL';
    else if (rsi < 40) signal = 'WEAK_BUY';
    
    return { value: rsi, signal };
  }

  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (data.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0, action: 'NEUTRAL' };
    
    const fastEMA = this.calculateEMAValues(data, fastPeriod);
    const slowEMA = this.calculateEMAValues(data, slowPeriod);
    
    const macdLine = fastEMA[fastEMA.length - 1] - slowEMA[slowEMA.length - 1];
    const signalLine = this.calculateEMAValues(
      data.slice(-signalPeriod).map((_, i) => ({ close: fastEMA[fastEMA.length - signalPeriod + i] - slowEMA[slowEMA.length - signalPeriod + i] })),
      signalPeriod
    )[0] || 0;
    
    const histogram = macdLine - signalLine;
    
    let action = 'NEUTRAL';
    if (macdLine > signalLine && histogram > 0) action = 'BUY';
    else if (macdLine < signalLine && histogram < 0) action = 'SELL';
    
    return { macd: macdLine, signal: signalLine, histogram, action };
  }

  calculateSMA(data, period = 20) {
    if (data.length < period) return { value: data[data.length - 1]?.close || 0, signal: 'NEUTRAL' };
    
    const sum = data.slice(-period).reduce((acc, item) => acc + item.close, 0);
    const sma = sum / period;
    const currentPrice = data[data.length - 1].close;
    
    let signal = 'NEUTRAL';
    if (currentPrice > sma * 1.01) signal = 'BUY';
    else if (currentPrice < sma * 0.99) signal = 'SELL';
    
    return { value: sma, signal, currentPrice };
  }

  calculateEMA(data, period = 20) {
    if (data.length < period) return { value: data[data.length - 1]?.close || 0, signal: 'NEUTRAL' };
    
    const emaValues = this.calculateEMAValues(data, period);
    const ema = emaValues[emaValues.length - 1];
    const currentPrice = data[data.length - 1].close;
    
    let signal = 'NEUTRAL';
    if (currentPrice > ema * 1.01) signal = 'BUY';
    else if (currentPrice < ema * 0.99) signal = 'SELL';
    
    return { value: ema, signal, currentPrice };
  }

  calculateEMAValues(data, period) {
    const multiplier = 2 / (period + 1);
    const emaValues = [data[0].close];
    
    for (let i = 1; i < data.length; i++) {
      const ema = (data[i].close * multiplier) + (emaValues[i - 1] * (1 - multiplier));
      emaValues.push(ema);
    }
    
    return emaValues;
  }

  calculateBollingerBands(data, period = 20, multiplier = 2) {
    if (data.length < period) return { upper: 0, middle: 0, lower: 0, signal: 'NEUTRAL' };
    
    const sma = this.calculateSMA(data, period);
    const prices = data.slice(-period).map(item => item.close);
    
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - sma.value, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upper = sma.value + (stdDev * multiplier);
    const lower = sma.value - (stdDev * multiplier);
    const currentPrice = data[data.length - 1].close;
    
    let signal = 'NEUTRAL';
    if (currentPrice > upper) signal = 'SELL';
    else if (currentPrice < lower) signal = 'BUY';
    
    return { upper, middle: sma.value, lower, signal, currentPrice };
  }

  analyzeVolume(data) {
    if (data.length < 10) return { signal: 'NEUTRAL', avgVolume: 0 };
    
    const recentVolume = data.slice(-5).reduce((acc, item) => acc + item.volume, 0) / 5;
    const avgVolume = data.slice(-20).reduce((acc, item) => acc + item.volume, 0) / 20;
    
    const volumeRatio = recentVolume / avgVolume;
    
    let signal = 'NEUTRAL';
    if (volumeRatio > 1.5) signal = 'HIGH_ACTIVITY';
    else if (volumeRatio < 0.7) signal = 'LOW_ACTIVITY';
    
    return { signal, avgVolume, recentVolume, ratio: volumeRatio };
  }

  analyzePriceAction(data, currentData) {
    if (data.length < 5) return { signal: 'NEUTRAL' };
    
    const recent = data.slice(-5);
    const highs = recent.map(item => item.high);
    const lows = recent.map(item => item.low);
    
    const isUptrend = highs.every((high, i) => i === 0 || high >= highs[i - 1]);
    const isDowntrend = lows.every((low, i) => i === 0 || low <= lows[i - 1]);
    
    let signal = 'NEUTRAL';
    if (isUptrend) signal = 'BULLISH';
    else if (isDowntrend) signal = 'BEARISH';
    
    return { signal, isUptrend, isDowntrend, momentum: currentData.changePercent };
  }

  async performAIAnalysis(analysis, currentData) {
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI not available, skipping AI analysis');
      return { insights: 'AI analysis unavailable', confidence: 0 };
    }

    try {
      const prompt = `As an expert technical analyst, analyze these Nifty 50 technical indicators and provide trading insights:

Current Market Data:
- Price: ₹${currentData.currentPrice}
- Change: ${currentData.changePercent}%
- Volume: ${currentData.volume}

Technical Indicators:
- RSI: ${analysis.rsi?.value} (${analysis.rsi?.signal})
- MACD: ${analysis.macd?.action}
- SMA Signal: ${analysis.sma?.signal}
- EMA Signal: ${analysis.ema?.signal}
- Bollinger Signal: ${analysis.bollinger?.signal}
- Volume Signal: ${analysis.volumeAnalysis?.signal}

Please provide:
1. SIGNAL: [BUY/SELL/HOLD]
2. CONFIDENCE: [0-100]%
3. KEY_INSIGHTS: [Main technical observations]
4. NEXT_15MIN_TARGET: [Expected price movement]
5. SUPPORT_RESISTANCE: [Key levels]
6. RISK_FACTORS: [Technical risks to watch]

Keep response concise and actionable for 15-minute trading.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3
      });

      const aiResponse = response.choices[0].message.content;
      console.log('🤖 Technical AI Analysis:', aiResponse.substring(0, 200) + '...');

      // Parse AI response
      const signalMatch = aiResponse.match(/SIGNAL:\s*(BUY|SELL|HOLD)/i);
      const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*(\d+)/);
      const insightsMatch = aiResponse.match(/KEY_INSIGHTS:\s*([^\n]+)/);
      const targetMatch = aiResponse.match(/NEXT_15MIN_TARGET:\s*([^\n]+)/);
      
      return {
        signal: signalMatch ? signalMatch[1].toUpperCase() : null,
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
        insights: insightsMatch ? insightsMatch[1] : 'Technical analysis completed',
        target: targetMatch ? targetMatch[1] : 'Neutral movement expected',
        fullAnalysis: aiResponse
      };

    } catch (error) {
      console.error('❌ Technical AI Analysis failed:', error.message);
      return {
        insights: 'AI analysis failed, using traditional methods',
        confidence: 0,
        error: error.message
      };
    }
  }

  generateSignal(analysis, aiInsights) {
    const signals = [];
    const weights = {
      rsi: 0.2,
      macd: 0.25,
      sma: 0.15,
      ema: 0.15,
      bollinger: 0.15,
      priceAction: 0.1
    };

    // Collect weighted signals
    if (analysis.rsi.signal === 'BUY' || analysis.rsi.signal === 'WEAK_BUY') signals.push({ signal: 'BUY', weight: weights.rsi });
    else if (analysis.rsi.signal === 'SELL' || analysis.rsi.signal === 'WEAK_SELL') signals.push({ signal: 'SELL', weight: weights.rsi });

    if (analysis.macd.action === 'BUY') signals.push({ signal: 'BUY', weight: weights.macd });
    else if (analysis.macd.action === 'SELL') signals.push({ signal: 'SELL', weight: weights.macd });

    if (analysis.sma.signal === 'BUY') signals.push({ signal: 'BUY', weight: weights.sma });
    else if (analysis.sma.signal === 'SELL') signals.push({ signal: 'SELL', weight: weights.sma });

    if (analysis.ema.signal === 'BUY') signals.push({ signal: 'BUY', weight: weights.ema });
    else if (analysis.ema.signal === 'SELL') signals.push({ signal: 'SELL', weight: weights.ema });

    if (analysis.bollinger.signal === 'BUY') signals.push({ signal: 'BUY', weight: weights.bollinger });
    else if (analysis.bollinger.signal === 'SELL') signals.push({ signal: 'SELL', weight: weights.bollinger });

    if (analysis.priceAction.signal === 'BULLISH') signals.push({ signal: 'BUY', weight: weights.priceAction });
    else if (analysis.priceAction.signal === 'BEARISH') signals.push({ signal: 'SELL', weight: weights.priceAction });

    // Calculate weighted score
    let buyScore = 0;
    let sellScore = 0;
    
    signals.forEach(s => {
      if (s.signal === 'BUY') buyScore += s.weight;
      else if (s.signal === 'SELL') sellScore += s.weight;
    });

    let action = 'HOLD';
    let confidence = 0;
    let reasoning = '';

    if (buyScore > sellScore && buyScore > 0.4) {
      action = 'BUY';
      confidence = Math.min(buyScore * 100, 90);
      reasoning = `Technical indicators suggest bullish momentum. Buy signals: ${buyScore.toFixed(2)}, Sell signals: ${sellScore.toFixed(2)}`;
    } else if (sellScore > buyScore && sellScore > 0.4) {
      action = 'SELL';
      confidence = Math.min(sellScore * 100, 90);
      reasoning = `Technical indicators suggest bearish momentum. Sell signals: ${sellScore.toFixed(2)}, Buy signals: ${buyScore.toFixed(2)}`;
    } else {
      confidence = 30;
      reasoning = `Mixed signals from technical indicators. Buy: ${buyScore.toFixed(2)}, Sell: ${sellScore.toFixed(2)}`;
    }

    // Enhance with AI insights if available
    if (aiInsights && aiInsights.signal && aiInsights.confidence > 0) {
      console.log('🤖 Incorporating AI insights into technical analysis');
      
      // Adjust confidence based on AI agreement
      if (aiInsights.signal === action) {
        confidence = Math.min(confidence + 15, 95); // Boost confidence if AI agrees
        reasoning += ` | AI confirms: ${aiInsights.insights}`;
      } else if (aiInsights.confidence > 70) {
        // If AI strongly disagrees, consider AI signal
        action = aiInsights.signal;
        confidence = Math.min(aiInsights.confidence, 85);
        reasoning = `AI overrides technical signals: ${aiInsights.insights}`;
      } else {
        reasoning += ` | AI suggests caution: ${aiInsights.insights}`;
      }
    }

    return { action, confidence, reasoning, aiInsights };
  }
}

module.exports = TechnicalAnalysisAgent;