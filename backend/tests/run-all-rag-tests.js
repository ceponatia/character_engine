/**
 * RAG System Test Suite Runner
 * 
 * Runs all RAG-related tests in sequence and provides comprehensive reporting
 */

const { EmbeddingServiceTests } = require('./embedding-service.test');
const { CharacterIngestionTests } = require('./character-ingestion.test');
const { RAGRetrievalTests } = require('./rag-retrieval.test');
const { OllamaRAGIntegrationTests } = require('./ollama-rag-integration.test');
const { EndToEndRAGTests } = require('./end-to-end-rag.test');

class RAGTestSuite {
  constructor() {
    this.suiteResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🔬 RAG System Complete Test Suite');
    console.log('==================================\n');
    
    console.log('🎯 Test Coverage:');
    console.log('   • Embedding Service (OpenAI integration)');
    console.log('   • Character Bio Ingestion (chunking & core persona)');
    console.log('   • RAG Retrieval (vector similarity search)');
    console.log('   • Ollama Integration (LLM response generation)');
    console.log('   • End-to-End Workflow (complete user experience)');
    console.log();

    const testSuites = [
      {
        name: 'Embedding Service',
        tester: new EmbeddingServiceTests(),
        critical: true
      },
      {
        name: 'Character Ingestion',
        tester: new CharacterIngestionTests(),
        critical: true
      },
      {
        name: 'RAG Retrieval',
        tester: new RAGRetrievalTests(),
        critical: true
      },
      {
        name: 'Ollama Integration',
        tester: new OllamaRAGIntegrationTests(),
        critical: false // Optional if Ollama not running
      },
      {
        name: 'End-to-End Workflow',
        tester: new EndToEndRAGTests(),
        critical: false // Depends on previous tests
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Running ${suite.name} Tests`);
      console.log(`${'='.repeat(60)}`);
      
      const suiteStartTime = Date.now();
      
      try {
        const results = await suite.tester.runAllTests();
        const suiteTime = Date.now() - suiteStartTime;
        
        const passed = results.filter(r => r.success).length;
        const total = results.length;
        const passRate = (passed / total) * 100;
        
        const suiteResult = {
          name: suite.name,
          passed,
          total,
          passRate,
          duration: suiteTime,
          critical: suite.critical,
          success: passRate >= (suite.critical ? 80 : 60), // Higher threshold for critical tests
          results
        };
        
        this.suiteResults.push(suiteResult);
        
        console.log(`\n📊 ${suite.name} Summary: ${passed}/${total} tests passed (${passRate.toFixed(1)}%) in ${suiteTime}ms`);
        
      } catch (error) {
        console.error(`❌ ${suite.name} test suite failed:`, error);
        this.suiteResults.push({
          name: suite.name,
          passed: 0,
          total: 0,
          passRate: 0,
          duration: Date.now() - suiteStartTime,
          critical: suite.critical,
          success: false,
          error: error.message
        });
      }
    }

    this.generateFinalReport();
  }

  generateFinalReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 RAG SYSTEM COMPLETE TEST REPORT');
    console.log('='.repeat(80));
    
    // Overall Statistics
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.suiteResults.reduce((sum, suite) => sum + suite.passed, 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    console.log('\n📊 OVERALL STATISTICS:');
    console.log(`   Total Tests Run: ${totalTests}`);
    console.log(`   Tests Passed: ${totalPassed}`);
    console.log(`   Overall Pass Rate: ${overallPassRate.toFixed(1)}%`);
    console.log(`   Total Execution Time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
    
    // Suite-by-Suite Results
    console.log('\n📈 SUITE BREAKDOWN:');
    this.suiteResults.forEach(suite => {
      const status = suite.success ? '✅' : '❌';
      const criticalTag = suite.critical ? ' (CRITICAL)' : '';
      console.log(`   ${status} ${suite.name}${criticalTag}: ${suite.passed}/${suite.total} (${suite.passRate.toFixed(1)}%) - ${suite.duration}ms`);
      
      if (suite.error) {
        console.log(`       Error: ${suite.error}`);
      }
    });

    // Critical Systems Status
    console.log('\n🔍 CRITICAL SYSTEMS STATUS:');
    const criticalSuites = this.suiteResults.filter(s => s.critical);
    const criticalPassing = criticalSuites.filter(s => s.success).length;
    
    criticalSuites.forEach(suite => {
      const status = suite.success ? '✅ OPERATIONAL' : '❌ FAILING';
      console.log(`   ${suite.name}: ${status}`);
    });

    // System Readiness Assessment
    console.log('\n🚀 SYSTEM READINESS ASSESSMENT:');
    
    const allCriticalPassing = criticalSuites.every(s => s.success);
    const hasOllamaIntegration = this.suiteResults.find(s => s.name === 'Ollama Integration')?.success;
    const hasEndToEnd = this.suiteResults.find(s => s.name === 'End-to-End Workflow')?.success;
    
    if (allCriticalPassing && hasOllamaIntegration && hasEndToEnd) {
      console.log('   🎉 PRODUCTION READY');
      console.log('   All critical systems operational with full LLM integration');
    } else if (allCriticalPassing && hasOllamaIntegration) {
      console.log('   ✅ CORE READY');
      console.log('   Critical systems operational with LLM integration');
    } else if (allCriticalPassing) {
      console.log('   🔶 PARTIAL READY');
      console.log('   Critical RAG components operational, LLM integration needed');
    } else {
      console.log('   ❌ NOT READY');
      console.log('   Critical system failures detected - troubleshooting required');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    const failedCritical = criticalSuites.filter(s => !s.success);
    if (failedCritical.length > 0) {
      console.log('   🚨 URGENT: Fix critical system failures:');
      failedCritical.forEach(suite => {
        console.log(`     - ${suite.name}: Review logs and fix underlying issues`);
      });
    }
    
    const embeddingService = this.suiteResults.find(s => s.name === 'Embedding Service');
    if (embeddingService && !embeddingService.success) {
      console.log('   🔑 Set OPENAI_API_KEY environment variable for embedding generation');
    }
    
    const ollamaIntegration = this.suiteResults.find(s => s.name === 'Ollama Integration');
    if (ollamaIntegration && !ollamaIntegration.success) {
      console.log('   🤖 Start Ollama service for LLM response generation');
      console.log('     Run: ollama serve');
      console.log('     Ensure TinyLlama model is available: ollama run tinyllama');
    }

    // Environment Setup Guide
    console.log('\n🔧 ENVIRONMENT SETUP (if needed):');
    console.log('   1. PostgreSQL with pgvector:');
    console.log('      CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('   2. Environment variables:');
    console.log('      DATABASE_URL="postgresql://user:pass@localhost:5432/chatbot"');
    console.log('      OPENAI_API_KEY="sk-your-openai-api-key"');
    console.log('      OLLAMA_HOST="http://localhost:11434"');
    console.log('   3. Install dependencies:');
    console.log('      npm install');
    console.log('   4. Apply database schema:');
    console.log('      npm run db:dev');

    // Next Steps
    console.log('\n🎯 NEXT STEPS:');
    if (allCriticalPassing && hasOllamaIntegration && hasEndToEnd) {
      console.log('   ✨ Your RAG system is ready for production use!');
      console.log('   • Create characters and ingest their bios');
      console.log('   • Enable RAG in character engine: characterEngine.updateConfig({ useRAG: true })');
      console.log('   • Start building conversations with enhanced context');
    } else {
      console.log('   🔨 Complete the setup steps above, then re-run tests');
      console.log('   • Fix any failing critical systems first');
      console.log('   • Ensure all dependencies are properly configured');
      console.log('   • Re-run: node tests/run-all-rag-tests.js');
    }

    console.log('\n' + '='.repeat(80));
    
    // Exit with appropriate code
    const exitCode = allCriticalPassing ? 0 : 1;
    return exitCode;
  }

  // Method to run specific test suites
  static async runSpecific(suiteNames) {
    const runner = new RAGTestSuite();
    console.log(`🎯 Running specific test suites: ${suiteNames.join(', ')}\n`);
    
    const availableSuites = {
      'embedding': EmbeddingServiceTests,
      'ingestion': CharacterIngestionTests,
      'retrieval': RAGRetrievalTests,
      'ollama': OllamaRAGIntegrationTests,
      'e2e': EndToEndRAGTests
    };

    for (const suiteName of suiteNames) {
      if (availableSuites[suiteName]) {
        const tester = new availableSuites[suiteName]();
        console.log(`\n🧪 Running ${suiteName} tests...`);
        await tester.runAllTests();
      } else {
        console.log(`❌ Unknown test suite: ${suiteName}`);
      }
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific test suites
    RAGTestSuite.runSpecific(args).then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('Specific test run failed:', error);
      process.exit(1);
    });
  } else {
    // Run full test suite
    const testSuite = new RAGTestSuite();
    testSuite.runAllTests().then((exitCode) => {
      process.exit(exitCode || 0);
    }).catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { RAGTestSuite };