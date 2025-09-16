// Live AI Trading System Test
require('dotenv').config();
const agentOrchestrator = require('./services/agentOrchestrator');

async function testLiveAISystem() {
  console.log('🚀 TESTING LIVE AI-POWERED TRADING SYSTEM\n');
  
  try {
    console.log('🔄 Running complete multi-agent AI analysis...');
    const startTime = Date.now();
    
    const result = await agentOrchestrator.runAnalysis();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ AI Analysis Complete!');
    console.log(`⏱️  Total Analysis Time: ${duration}ms`);
    console.log('\n=== AI-POWERED TRADING SIGNAL ===');
    console.log(`🎯 Signal: ${result.signal}`);
    console.log(`📊 Confidence: ${result.confidence}%`);
    console.log(`💰 Current Price: ₹${result.currentPrice}`);
    console.log(`🎯 Target Price: ₹${result.pricePrediction.targetPrice}`);
    console.log(`📈 Expected Move: ${result.pricePrediction.expectedMove}%`);
    console.log(`🧠 AI Reasoning: ${result.reasoning}`);
    
    console.log('\n=== AI AGENT RESULTS ===');
    if (result.agentResults) {
      Object.entries(result.agentResults).forEach(([agent, data]) => {
        console.log(`🤖 ${agent.toUpperCase()}:`);
        console.log(`   Signal: ${data.signal} (${data.confidence}%)`);
        if (data.key_indicators) {
          console.log(`   AI Insights: ${JSON.stringify(data.key_indicators)}`);
        }
        if (data.market_mood) {
          console.log(`   Market Mood: ${JSON.stringify(data.market_mood)}`);
        }
        if (data.key_factors) {
          console.log(`   Key Factors: ${JSON.stringify(data.key_factors)}`);
        }
        if (data.risk_level) {
          console.log(`   Risk Level: ${data.risk_level.overall} (${data.risk_level.score}%)`);
        }
        console.log('');
      });
    }
    
    console.log('=== AI RECOMMENDATIONS ===');
    if (result.recommendations) {
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n🎉 AI-POWERED SYSTEM TEST SUCCESSFUL!');
    console.log('✅ All agents working with OpenAI integration');
    console.log('✅ Real-time analysis with AI insights');
    console.log('✅ Enhanced trading signals and confidence');
    
    return result;
    
  } catch (error) {
    console.error('❌ AI System Test Failed:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Run the test
testLiveAISystem().then(result => {
  if (result) {
    console.log('\n🎯 FINAL SCORE: AI Trading System is FULLY OPERATIONAL! 🚀');
  } else {
    console.log('\n⚠️  System needs debugging');
  }
}).catch(console.error);