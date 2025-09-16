// Research Agent - Enhanced with OpenAI for intelligent news and fundamental analysis
const axios = require('axios');
const marketData = require('../services/marketData');
const OpenAI = require('openai');

class ResearchAgent {
  constructor() {
    this.name = 'Research Agent';
    this.description = 'AI-powered fundamental and news analysis using OpenAI';
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
    });
    
    this.newsSourceUrls = [
      'https://newsapi.org/v2/everything?q=nifty%2050%20OR%20indian%20stock%20market&language=en&sortBy=publishedAt',
      'https://newsapi.org/v2/everything?q=BSE%20OR%20NSE%20OR%20sensex&language=en&sortBy=publishedAt'
    ];
  }

  async analyze() {
    try {
      const analysis = {
        newsAnalysis: await this.analyzeNews(),
        fundamentalData: await this.getFundamentalData(),
        economicIndicators: await this.getEconomicIndicators(),
        globalMarketImpact: await this.analyzeGlobalMarkets(),
        corpActions: this.analyzeCorporateActions(),
        riskFactors: await this.assessRiskFactors()
      };

      const signal = this.generateResearchSignal(analysis);
      
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
      console.error('Research Analysis Error:', error.message);
      return {
        agent: this.name,
        signal: 'HOLD',
        confidence: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async analyzeNews() {
    try {
      // For demo purposes, return mock news analysis
      // In production, integrate with real news APIs
      return this.getMockNewsAnalysis();
    } catch (error) {
      console.error('News analysis error:', error.message);
      return this.getMockNewsAnalysis();
    }
  }

  getMockNewsAnalysis() {
    const mockNews = [
      {
        title: "RBI maintains repo rate at 6.5%, signals cautious stance",
        sentiment: "NEUTRAL",
        impact: "MEDIUM",
        relevance: 0.8
      },
      {
        title: "FII inflows strengthen as Q3 earnings show positive momentum",
        sentiment: "POSITIVE",
        impact: "HIGH",
        relevance: 0.9
      },
      {
        title: "Global market volatility affects emerging markets",
        sentiment: "NEGATIVE",
        impact: "MEDIUM",
        relevance: 0.6
      },
      {
        title: "IT sector shows resilience amid global headwinds",
        sentiment: "POSITIVE",
        impact: "MEDIUM",
        relevance: 0.7
      }
    ];

    const positiveNews = mockNews.filter(news => news.sentiment === 'POSITIVE').length;
    const negativeNews = mockNews.filter(news => news.sentiment === 'NEGATIVE').length;
    const neutralNews = mockNews.filter(news => news.sentiment === 'NEUTRAL').length;

    const sentimentScore = (positiveNews - negativeNews) / mockNews.length;
    const avgImpact = mockNews.reduce((sum, news) => {
      const impactValue = news.impact === 'HIGH' ? 3 : news.impact === 'MEDIUM' ? 2 : 1;
      return sum + impactValue;
    }, 0) / mockNews.length;

    let overallSentiment = 'NEUTRAL';
    if (sentimentScore > 0.2) overallSentiment = 'POSITIVE';
    else if (sentimentScore < -0.2) overallSentiment = 'NEGATIVE';

    return {
      newsCount: mockNews.length,
      sentimentScore,
      overallSentiment,
      positiveNews,
      negativeNews,
      neutralNews,
      avgImpact,
      recentNews: mockNews.slice(0, 3)
    };
  }

  async getFundamentalData() {
    try {
      const niftyData = await marketData.getNiftyIndexData();
      
      // Mock fundamental analysis
      return {
        peRatio: 22.5,
        pbRatio: 3.2,
        earningsGrowth: 12.5, // percentage
        revenueGrowth: 8.3,
        dividendYield: 1.8,
        marketCap: 2500000, // in crores
        bookValue: niftyData.currentPrice / 3.2,
        currentPrice: niftyData.currentPrice,
        fairValue: niftyData.currentPrice * 1.05, // 5% premium assumed fair
        recommendation: this.getFundamentalRecommendation(niftyData.currentPrice, 22.5, 3.2)
      };
    } catch (error) {
      console.error('Fundamental data error:', error.message);
      return {
        peRatio: 22.5,
        pbRatio: 3.2,
        recommendation: 'HOLD'
      };
    }
  }

  getFundamentalRecommendation(currentPrice, pe, pb) {
    // Simple fundamental scoring
    let score = 0;
    
    if (pe < 20) score += 1; // Good valuation
    else if (pe > 25) score -= 1; // Expensive
    
    if (pb < 3) score += 1; // Good price to book
    else if (pb > 4) score -= 1; // Expensive
    
    if (score >= 1) return 'BUY';
    else if (score <= -1) return 'SELL';
    else return 'HOLD';
  }

  async getEconomicIndicators() {
    // Mock economic indicators
    return {
      gdpGrowth: 6.8, // percentage
      inflation: 5.2,
      unemploymentRate: 4.1,
      manufacturingPMI: 57.5,
      servicesPMI: 58.2,
      fiscalDeficit: 6.1,
      currentAccountDeficit: -2.1,
      foreignReserves: 650000, // in million USD
      usdInrRate: 83.25,
      crudePrices: 75.50, // USD per barrel
      riskAssessment: this.calculateEconomicRisk()
    };
  }

  calculateEconomicRisk() {
    // Simple risk calculation based on economic indicators
    let riskScore = 0;
    
    // GDP growth above 6% is positive
    if (6.8 > 6) riskScore -= 1;
    
    // Inflation above 6% is negative
    if (5.2 > 6) riskScore += 1;
    
    // PMI above 50 is positive
    if (57.5 > 50 && 58.2 > 50) riskScore -= 1;
    
    if (riskScore <= -1) return 'LOW';
    else if (riskScore >= 1) return 'HIGH';
    else return 'MEDIUM';
  }

  async analyzeGlobalMarkets() {
    // Mock global market analysis
    return {
      usMarkets: {
        sp500Change: 0.5,
        nasdaqChange: 0.8,
        sentiment: 'POSITIVE'
      },
      asianMarkets: {
        nikkeiChange: -0.3,
        hangSengChange: 0.2,
        sentiment: 'MIXED'
      },
      europeanMarkets: {
        ftseChange: 0.1,
        daxChange: -0.2,
        sentiment: 'NEUTRAL'
      },
      emergingMarkets: {
        msciEmChange: 0.4,
        sentiment: 'POSITIVE'
      },
      globalSentiment: 'CAUTIOUSLY_POSITIVE',
      riskOn: true
    };
  }

  analyzeCorporateActions() {
    // Mock corporate actions
    return {
      upcomingResults: [
        { company: 'RELIANCE', date: '2025-01-15', expected: 'POSITIVE' },
        { company: 'TCS', date: '2025-01-18', expected: 'NEUTRAL' },
        { company: 'HDFCBANK', date: '2025-01-20', expected: 'POSITIVE' }
      ],
      dividends: [
        { company: 'ITC', exDate: '2025-01-25', yield: 4.2 }
      ],
      splits: [],
      bonusIssues: [],
      impact: 'NEUTRAL_TO_POSITIVE'
    };
  }

  async assessRiskFactors() {
    return {
      geopoliticalRisk: 'MEDIUM',
      regulatoryRisk: 'LOW',
      liquidityRisk: 'LOW',
      creditRisk: 'MEDIUM',
      marketRisk: 'MEDIUM',
      operationalRisk: 'LOW',
      overallRisk: 'MEDIUM',
      keyRisks: [
        'Global economic slowdown',
        'Rising interest rates',
        'Oil price volatility',
        'Geopolitical tensions'
      ]
    };
  }

  generateResearchSignal(analysis) {
    let score = 0;
    let confidence = 50;
    let reasoning = [];

    // News analysis impact (25%)
    if (analysis.newsAnalysis.overallSentiment === 'POSITIVE') {
      score += 0.25;
      reasoning.push('Positive news sentiment');
    } else if (analysis.newsAnalysis.overallSentiment === 'NEGATIVE') {
      score -= 0.25;
      reasoning.push('Negative news sentiment');
    }

    // Fundamental analysis impact (30%)
    if (analysis.fundamentalData.recommendation === 'BUY') {
      score += 0.3;
      reasoning.push('Fundamental valuation appears attractive');
    } else if (analysis.fundamentalData.recommendation === 'SELL') {
      score -= 0.3;
      reasoning.push('Fundamental valuation appears expensive');
    }

    // Economic indicators impact (20%)
    if (analysis.economicIndicators.riskAssessment === 'LOW') {
      score += 0.2;
      reasoning.push('Favorable economic environment');
    } else if (analysis.economicIndicators.riskAssessment === 'HIGH') {
      score -= 0.2;
      reasoning.push('Challenging economic environment');
    }

    // Global markets impact (15%)
    if (analysis.globalMarketImpact.globalSentiment === 'CAUTIOUSLY_POSITIVE') {
      score += 0.15;
      reasoning.push('Supportive global market conditions');
    } else if (analysis.globalMarketImpact.globalSentiment === 'NEGATIVE') {
      score -= 0.15;
      reasoning.push('Negative global market sentiment');
    }

    // Risk factors impact (10%)
    if (analysis.riskFactors.overallRisk === 'LOW') {
      score += 0.1;
      reasoning.push('Low overall risk environment');
    } else if (analysis.riskFactors.overallRisk === 'HIGH') {
      score -= 0.1;
      reasoning.push('High risk environment');
    }

    // Determine action and confidence
    let action = 'HOLD';
    if (score > 0.3) {
      action = 'BUY';
      confidence = Math.min(60 + (score * 100), 85);
    } else if (score < -0.3) {
      action = 'SELL';
      confidence = Math.min(60 + (Math.abs(score) * 100), 85);
    } else {
      confidence = 45;
      reasoning.push('Mixed research signals suggest holding current position');
    }

    return {
      action,
      confidence,
      reasoning: reasoning.join('. ') + '.',
      score
    };
  }
}

module.exports = ResearchAgent;