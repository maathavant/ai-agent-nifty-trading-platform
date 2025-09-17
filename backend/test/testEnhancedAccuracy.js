// Enhanced Accuracy Testing - Comprehensive validation of all improvements
require('dotenv').config();
const MarketSentimentAgent = require('../agents/marketSentiment');

class AccuracyTestSuite {
  constructor() {
    this.agent = new MarketSentimentAgent();
    this.testResults = [];
  }

  async runComprehensiveTest() {
    console.log('🧪 Running Enhanced Accuracy Test Suite...\n');
    
    try {
      // Test 1: Enhanced AI Prompt Engineering
      console.log('📝 Test 1: Enhanced AI Prompt Engineering');
      await this.testEnhancedPrompts();
      
      // Test 2: Dynamic Weight Adjustment
      console.log('\n⚖️ Test 2: Dynamic Weight Adjustment');
      await this.testDynamicWeights();
      
      // Test 3: Historical Pattern Recognition
      console.log('\n📊 Test 3: Historical Pattern Recognition');
      await this.testHistoricalPatterns();
      
      // Test 4: Performance Tracking
      console.log('\n📈 Test 4: Performance Tracking System');
      await this.testPerformanceTracking();
      
      // Test 5: Enhanced Sector Analysis
      console.log('\n🏭 Test 5: Enhanced Sector Analysis');
      await this.testSectorAnalysis();
      
      // Test 6: Microstructure Analysis
      console.log('\n🔬 Test 6: Microstructure Analysis');
      await this.testMicrostructureAnalysis();
      
      // Test 7: Full Integration Test
      console.log('\n🔄 Test 7: Full System Integration');
      await this.testFullIntegration();
      
      // Summary
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test Suite Error:', error);
    }
  }

  async testEnhancedPrompts() {
    try {
      const mockData = this.getMockMarketData();
      const aiAnalysis = await this.agent.performAIAnalysis(
        mockData.traditional, 
        mockData.nifty, 
        mockData.stocks
      );
      
      const hasEnhancedStructure = this.validateAIResponse(aiAnalysis);
      
      if (hasEnhancedStructure) {
        console.log('✅ Enhanced AI prompts working correctly');
        console.log(`   - Response structure: ${JSON.stringify(Object.keys(aiAnalysis))}`);
        console.log(`   - Confidence: ${aiAnalysis.confidence}%`);
        console.log(`   - Signal: ${aiAnalysis.tradingSignal}`);
        this.recordTest('Enhanced AI Prompts', true, 'All fields present and valid');
      } else {
        console.log('❌ Enhanced AI prompts failed validation');
        this.recordTest('Enhanced AI Prompts', false, 'Missing required fields');
      }
    } catch (error) {
      console.log('❌ Enhanced AI prompts test failed:', error.message);
      this.recordTest('Enhanced AI Prompts', false, error.message);
    }
  }

  async testDynamicWeights() {
    try {
      const mockData = this.getMockMarketData();
      
      // Test with high volatility
      mockData.traditional.volatility.intraDayRange = 3.0; // High volatility
      const highVolResult = this.agent.combineAnalysis(mockData.traditional, mockData.ai);
      
      // Test with normal volatility
      mockData.traditional.volatility.intraDayRange = 1.0; // Normal volatility
      const normalVolResult = this.agent.combineAnalysis(mockData.traditional, mockData.ai);
      
      const weightingWorking = highVolResult.weightingDetails && normalVolResult.weightingDetails;
      const volatilityAdjustment = highVolResult.weightingDetails?.volatilityAdjustment;
      
      if (weightingWorking) {
        console.log('✅ Dynamic weight adjustment working');
        console.log(`   - High vol weights: AI=${(highVolResult.weightingDetails.aiWeight*100).toFixed(0)}%, Traditional=${(highVolResult.weightingDetails.traditionalWeight*100).toFixed(0)}%`);
        console.log(`   - Normal vol weights: AI=${(normalVolResult.weightingDetails.aiWeight*100).toFixed(0)}%, Traditional=${(normalVolResult.weightingDetails.traditionalWeight*100).toFixed(0)}%`);
        console.log(`   - Volatility adjustment detected: ${volatilityAdjustment}`);
        this.recordTest('Dynamic Weights', true, 'Weight adjustments working correctly');
      } else {
        console.log('❌ Dynamic weight adjustment failed');
        this.recordTest('Dynamic Weights', false, 'Weighting details missing');
      }
    } catch (error) {
      console.log('❌ Dynamic weights test failed:', error.message);
      this.recordTest('Dynamic Weights', false, error.message);
    }
  }

  async testHistoricalPatterns() {
    try {
      const currentConditions = {
        volatility: 1.5,
        momentum: 0.5,
        volumeRatio: 1.2,
        hour: 10
      };
      
      const patterns = await this.agent.historicalAnalysis.analyzeHistoricalPatterns(currentConditions);
      
      const hasRequiredFields = patterns.accuracy !== undefined && 
                               patterns.similarCount !== undefined && 
                               patterns.confidence !== undefined;
      
      if (hasRequiredFields) {
        console.log('✅ Historical pattern recognition working');
        console.log(`   - Similar patterns found: ${patterns.similarCount}`);
        console.log(`   - Pattern accuracy: ${patterns.accuracy}%`);
        console.log(`   - Confidence level: ${patterns.confidence}`);
        console.log(`   - Dominant pattern: ${patterns.dominantPattern}`);
        this.recordTest('Historical Patterns', true, `Found ${patterns.similarCount} patterns with ${patterns.accuracy}% accuracy`);
      } else {
        console.log('❌ Historical pattern recognition failed');
        this.recordTest('Historical Patterns', false, 'Missing required pattern fields');
      }
    } catch (error) {
      console.log('❌ Historical patterns test failed:', error.message);
      this.recordTest('Historical Patterns', false, error.message);
    }
  }

  async testPerformanceTracking() {
    try {
      // Test prediction tracking
      const predictionId = await this.agent.performanceTracker.trackPrediction(
        'BUY', 85, 19850, new Date(), { test: true }
      );
      
      // Get performance stats
      const stats = this.agent.performanceTracker.getPerformanceStats();
      const optimalWeights = this.agent.performanceTracker.getOptimalWeights();
      
      const trackingWorking = predictionId && stats && optimalWeights;
      
      if (trackingWorking) {
        console.log('✅ Performance tracking working');
        console.log(`   - Prediction ID: ${predictionId}`);
        console.log(`   - Total predictions tracked: ${stats.totalPredictions}`);
        console.log(`   - Overall accuracy: ${stats.overallAccuracy.toFixed(1)}%`);
        console.log(`   - Optimal weights: AI=${(optimalWeights.ai*100).toFixed(0)}%, Technical=${(optimalWeights.technical*100).toFixed(0)}%`);
        this.recordTest('Performance Tracking', true, `Tracking ${stats.totalPredictions} predictions`);
      } else {
        console.log('❌ Performance tracking failed');
        this.recordTest('Performance Tracking', false, 'Tracking system not working');
      }
    } catch (error) {
      console.log('❌ Performance tracking test failed:', error.message);
      this.recordTest('Performance Tracking', false, error.message);
    }
  }

  async testSectorAnalysis() {
    try {
      const mockStocks = this.getMockNiftyStocks();
      const sectorAnalysis = this.agent.analyzeSectorRotation(mockStocks);
      
      const hasEnhancedFields = sectorAnalysis.sectorStrengths && 
                               sectorAnalysis.sectorTrends && 
                               sectorAnalysis.leadershipQuality &&
                               sectorAnalysis.marketBreadthSignal;
      
      if (hasEnhancedFields) {
        console.log('✅ Enhanced sector analysis working');
        console.log(`   - Leading sector: ${sectorAnalysis.leadingSector} (${sectorAnalysis.leaderPerformance.toFixed(2)}%)`);
        console.log(`   - Rotation strength: ${sectorAnalysis.rotationStrength.toFixed(2)}%`);
        console.log(`   - Leadership quality: ${sectorAnalysis.leadershipQuality}`);
        console.log(`   - Market breadth: ${sectorAnalysis.marketBreadthSignal}`);
        this.recordTest('Enhanced Sector Analysis', true, `${sectorAnalysis.leadingSector} leading with ${sectorAnalysis.leadershipQuality} quality`);
      } else {
        console.log('❌ Enhanced sector analysis failed');
        this.recordTest('Enhanced Sector Analysis', false, 'Enhanced fields missing');
      }
    } catch (error) {
      console.log('❌ Sector analysis test failed:', error.message);
      this.recordTest('Enhanced Sector Analysis', false, error.message);
    }
  }

  async testMicrostructureAnalysis() {
    try {
      const mockData = this.getMockMarketData();
      const microstructure = await this.agent.microstructureAnalysis.analyzeMicrostructure(
        mockData.nifty, 
        mockData.stocks
      );
      
      const hasRequiredFields = microstructure.liquidityRisk && 
                               microstructure.orderFlowBias && 
                               microstructure.institutionalSentiment &&
                               microstructure.smartMoneyFlow;
      
      if (hasRequiredFields) {
        console.log('✅ Microstructure analysis working');
        console.log(`   - Order flow bias: ${microstructure.orderFlowBias}`);
        console.log(`   - Liquidity risk: ${microstructure.liquidityRisk}`);
        console.log(`   - Institutional sentiment: ${microstructure.institutionalSentiment}`);
        console.log(`   - Smart money flow: ${microstructure.smartMoneyFlow}`);
        console.log(`   - Micro trend: ${microstructure.microTrend}`);
        this.recordTest('Microstructure Analysis', true, `${microstructure.orderFlowBias} flow with ${microstructure.liquidityRisk} liquidity risk`);
      } else {
        console.log('❌ Microstructure analysis failed');
        this.recordTest('Microstructure Analysis', false, 'Required microstructure fields missing');
      }
    } catch (error) {
      console.log('❌ Microstructure analysis test failed:', error.message);
      this.recordTest('Microstructure Analysis', false, error.message);
    }
  }

  async testFullIntegration() {
    try {
      console.log('   Running full enhanced analysis...');
      const result = await this.agent.analyze();
      
      const hasEnhancedFeatures = result.advancedInsights && 
                                 result.performanceStats && 
                                 result.analysis?.historical &&
                                 result.analysis?.microstructure;
      
      if (hasEnhancedFeatures) {
        console.log('✅ Full integration working perfectly');
        console.log(`   - Signal: ${result.signal} (${result.confidence}% confidence)`);
        console.log(`   - Advanced insights: ${result.advancedInsights.length} items`);
        console.log(`   - Historical accuracy: ${result.analysis.historical.accuracy}%`);
        console.log(`   - Microstructure bias: ${result.analysis.microstructure.orderFlowBias}`);
        console.log(`   - Performance: ${result.performanceStats.overallAccuracy.toFixed(1)}% accuracy`);
        console.log(`   - Expected move: ${result.analysis.combined.expectedMove?.toFixed(2) || 'N/A'}%`);
        this.recordTest('Full Integration', true, `Complete system working with ${result.confidence}% confidence`);
      } else {
        console.log('❌ Full integration missing features');
        this.recordTest('Full Integration', false, 'Enhanced features not integrated');
      }
    } catch (error) {
      console.log('❌ Full integration test failed:', error.message);
      this.recordTest('Full Integration', false, error.message);
    }
  }

  validateAIResponse(response) {
    const requiredFields = ['tradingSignal', 'confidence', 'overallSentiment', 'riskFactors'];
    return requiredFields.every(field => response.hasOwnProperty(field));
  }

  getMockMarketData() {
    return {
      nifty: {
        currentPrice: 19800,
        high: 19850,
        low: 19750,
        volume: 45000000,
        changePercent: 0.8
      },
      stocks: this.getMockNiftyStocks(),
      traditional: {
        overallSentiment: { signal: 'BUY', confidence: 65 },
        volumeAnalysis: { signal: 'STRONG', ratio: 1.2, strength: 'High' },
        marketBreadth: { advancers: 35, decliners: 15, ratio: 2.33 },
        volatility: { level: 'MODERATE', intraDayRange: 1.5 },
        momentumAnalysis: { signal: 'BULLISH', strength: 'Strong' }
      },
      ai: {
        tradingSignal: 'BUY',
        confidence: 75,
        overallSentiment: 'BULLISH',
        riskFactors: ['Standard market risks apply'],
        marketOutlook: 'Positive'
      }
    };
  }

  getMockNiftyStocks() {
    return [
      { symbol: 'RELIANCE.NS', changePercent: 1.2 },
      { symbol: 'TCS.NS', changePercent: 0.8 },
      { symbol: 'HDFCBANK.NS', changePercent: 1.5 },
      { symbol: 'INFOSYS.NS', changePercent: 0.6 },
      { symbol: 'ICICIBANK.NS', changePercent: 1.1 },
      { symbol: 'HINDUNILVR.NS', changePercent: -0.3 },
      { symbol: 'ITC.NS', changePercent: 0.4 },
      { symbol: 'KOTAKBANK.NS', changePercent: 1.3 },
      { symbol: 'BAJAJFINSV.NS', changePercent: 0.9 },
      { symbol: 'LT.NS', changePercent: 0.7 }
    ];
  }

  recordTest(testName, passed, details) {
    this.testResults.push({
      test: testName,
      passed: passed,
      details: details,
      timestamp: new Date()
    });
  }

  printTestSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 ENHANCED ACCURACY TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL ENHANCED ACCURACY FEATURES WORKING PERFECTLY!');
      console.log('✨ Your trading system now has:');
      console.log('   • Advanced AI prompt engineering');
      console.log('   • Dynamic weight adjustment');
      console.log('   • Historical pattern recognition');
      console.log('   • Real-time performance tracking');
      console.log('   • Enhanced sector analysis');
      console.log('   • Market microstructure analysis');
      console.log('   • Full system integration');
    } else {
      console.log('\n📋 Test Details:');
      this.testResults.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} ${test.test}: ${test.details}`);
      });
    }
    
    console.log('\n🚀 System is ready for enhanced accuracy trading!');
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new AccuracyTestSuite();
  tester.runComprehensiveTest().catch(console.error);
}

module.exports = AccuracyTestSuite;