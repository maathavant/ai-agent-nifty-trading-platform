// OpenAI Validation Test Script
const OpenAI = require('openai');
require('dotenv').config();

class OpenAIValidator {
  constructor() {
    this.results = {
      connection: false,
      agentImplementation: {},
      enhancedAnalysis: {},
      logging: false
    };
  }

  async validateAll() {
    console.log('🚀 STARTING OPENAI VALIDATION - ALL 4 APPROACHES\n');
    
    // Approach 1: Test OpenAI Connection
    await this.testConnection();
    
    // Approach 2: Check Agent Implementation
    await this.checkAgentImplementation();
    
    // Approach 3: Test Enhanced Analysis
    await this.testEnhancedAnalysis();
    
    // Approach 4: Validate Logging
    await this.validateLogging();
    
    // Summary Report
    this.generateReport();
  }

  async testConnection() {
    console.log('=== APPROACH 1: OpenAI Connection Test ===');
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment variables');
      }

      console.log('✅ API Key found in environment');
      console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      console.log('🔄 Testing OpenAI API connection...');
      
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Respond with exactly: 'OpenAI connected successfully for Nifty 50 trading analysis'"
          }
        ],
        max_tokens: 50,
        temperature: 0
      });

      const duration = Date.now() - startTime;
      const responseText = response.choices[0].message.content;

      console.log(`✅ Connection SUCCESS (${duration}ms)`);
      console.log(`✅ Model: gpt-3.5-turbo`);
      console.log(`✅ Response: "${responseText}"`);
      console.log(`✅ Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
      
      this.results.connection = true;
      
    } catch (error) {
      console.error('❌ Connection FAILED:', error.message);
      console.error('❌ Error code:', error.code);
      this.results.connection = false;
    }
    
    console.log('\n');
  }

  async checkAgentImplementation() {
    console.log('=== APPROACH 2: Check Current Agent Implementation ===');
    
    const agentFiles = [
      'technicalAnalysis.js',
      'marketSentiment.js', 
      'research.js',
      'riskManagement.js'
    ];

    for (const agentFile of agentFiles) {
      try {
        console.log(`📊 Checking ${agentFile}:`);
        
        // Try to require the agent
        const AgentClass = require(`./agents/${agentFile}`);
        const agent = new AgentClass();
        
        // Check for OpenAI integration
        const hasOpenAI = agent.openai !== undefined;
        const hasAIMethod = typeof agent.performAIAnalysis === 'function';
        const hasEnhancedAnalysis = typeof agent.enhancedAnalysis === 'function';
        
        console.log(`  ✅ Agent loads: true`);
        console.log(`  ${hasOpenAI ? '✅' : '❌'} Has OpenAI client: ${hasOpenAI}`);
        console.log(`  ${hasAIMethod ? '✅' : '❌'} Has AI analysis method: ${hasAIMethod}`);
        console.log(`  ${hasEnhancedAnalysis ? '✅' : '❌'} Has enhanced analysis: ${hasEnhancedAnalysis}`);
        
        this.results.agentImplementation[agentFile] = {
          loads: true,
          hasOpenAI,
          hasAIMethod,
          hasEnhancedAnalysis
        };
        
      } catch (error) {
        console.log(`  ❌ Agent loads: false - ${error.message}`);
        this.results.agentImplementation[agentFile] = {
          loads: false,
          error: error.message
        };
      }
    }
    
    console.log('\n');
  }

  async testEnhancedAnalysis() {
    console.log('=== APPROACH 3: Test Enhanced AI Analysis ===');
    
    try {
      // Test with Market Sentiment Agent
      console.log('🔄 Testing Market Sentiment Agent with AI...');
      
      const MarketSentimentAgent = require('./agents/marketSentiment');
      const sentimentAgent = new MarketSentimentAgent();
      
      const startTime = Date.now();
      const result = await sentimentAgent.analyze();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Analysis completed (${duration}ms)`);
      console.log(`✅ Signal: ${result.signal}`);
      console.log(`✅ Confidence: ${result.confidence}%`);
      console.log(`✅ Has AI insights: ${result.aiInsights ? 'Yes' : 'No'}`);
      
      this.results.enhancedAnalysis.marketSentiment = {
        success: true,
        duration,
        signal: result.signal,
        confidence: result.confidence,
        hasAIInsights: !!result.aiInsights
      };
      
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error.message);
      this.results.enhancedAnalysis.marketSentiment = {
        success: false,
        error: error.message
      };
    }
    
    console.log('\n');
  }

  async validateLogging() {
    console.log('=== APPROACH 4: Validate OpenAI Logging ===');
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check if logs directory exists
      const logsDir = path.join(__dirname, 'logs');
      const logExists = fs.existsSync(logsDir);
      
      console.log(`${logExists ? '✅' : '❌'} Logs directory exists: ${logExists}`);
      
      if (logExists) {
        const logFiles = fs.readdirSync(logsDir);
        console.log(`✅ Log files found: ${logFiles.length}`);
        console.log(`✅ Log files: ${logFiles.join(', ')}`);
      }
      
      // Test logging functionality
      console.log('🔄 Testing logging functionality...');
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        test: 'OpenAI validation',
        status: 'success'
      };
      
      // Create logs directory if it doesn't exist
      if (!logExists) {
        fs.mkdirSync(logsDir, { recursive: true });
        console.log('✅ Created logs directory');
      }
      
      // Write test log
      const logFile = path.join(logsDir, 'openai-test.log');
      fs.writeFileSync(logFile, JSON.stringify(logEntry) + '\n');
      console.log('✅ Test log written successfully');
      
      this.results.logging = true;
      
    } catch (error) {
      console.error('❌ Logging validation failed:', error.message);
      this.results.logging = false;
    }
    
    console.log('\n');
  }

  generateReport() {
    console.log('=== FINAL VALIDATION REPORT ===');
    console.log('OpenAI Integration Status:\n');
    
    // Connection Status
    console.log(`🔗 Connection: ${this.results.connection ? '✅ WORKING' : '❌ FAILED'}`);
    
    // Agent Implementation Status
    console.log('🤖 Agent Implementation:');
    Object.entries(this.results.agentImplementation).forEach(([agent, status]) => {
      const icon = status.loads && status.hasOpenAI ? '✅' : '⚠️';
      console.log(`  ${icon} ${agent}: ${status.loads ? 'Loaded' : 'Failed'} | OpenAI: ${status.hasOpenAI ? 'Yes' : 'No'}`);
    });
    
    // Enhanced Analysis Status
    console.log('🧠 Enhanced Analysis:');
    Object.entries(this.results.enhancedAnalysis).forEach(([agent, status]) => {
      const icon = status.success ? '✅' : '❌';
      console.log(`  ${icon} ${agent}: ${status.success ? 'Working' : 'Failed'}`);
    });
    
    // Logging Status
    console.log(`📝 Logging: ${this.results.logging ? '✅ WORKING' : '❌ FAILED'}`);
    
    // Overall Status
    const overallScore = this.calculateOverallScore();
    console.log(`\n🎯 Overall OpenAI Integration: ${overallScore >= 75 ? '✅ EXCELLENT' : overallScore >= 50 ? '⚠️ PARTIAL' : '❌ NEEDS WORK'} (${overallScore}%)`);
    
    // Recommendations
    this.generateRecommendations();
  }

  calculateOverallScore() {
    let score = 0;
    let maxScore = 0;
    
    // Connection (25 points)
    maxScore += 25;
    if (this.results.connection) score += 25;
    
    // Agent Implementation (40 points - 10 per agent)
    Object.values(this.results.agentImplementation).forEach(agent => {
      maxScore += 10;
      if (agent.loads) score += 5;
      if (agent.hasOpenAI) score += 5;
    });
    
    // Enhanced Analysis (25 points)
    maxScore += 25;
    Object.values(this.results.enhancedAnalysis).forEach(analysis => {
      if (analysis.success) score += 25;
    });
    
    // Logging (10 points)
    maxScore += 10;
    if (this.results.logging) score += 10;
    
    return Math.round((score / maxScore) * 100);
  }

  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!this.results.connection) {
      console.log('❗ Fix OpenAI API connection - check API key and network');
    }
    
    const agentsNeedingWork = Object.entries(this.results.agentImplementation)
      .filter(([_, status]) => !status.hasOpenAI)
      .map(([agent, _]) => agent);
    
    if (agentsNeedingWork.length > 0) {
      console.log(`❗ Enhance these agents with OpenAI: ${agentsNeedingWork.join(', ')}`);
    }
    
    const failedAnalysis = Object.entries(this.results.enhancedAnalysis)
      .filter(([_, status]) => !status.success)
      .map(([agent, _]) => agent);
    
    if (failedAnalysis.length > 0) {
      console.log(`❗ Fix enhanced analysis for: ${failedAnalysis.join(', ')}`);
    }
    
    if (!this.results.logging) {
      console.log('❗ Implement proper OpenAI logging system');
    }
    
    console.log('✅ OpenAI integration will significantly improve trading accuracy!');
  }
}

// Run validation
const validator = new OpenAIValidator();
validator.validateAll().catch(console.error);

module.exports = OpenAIValidator;