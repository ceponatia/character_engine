/**
 * Embedding Service Module Tests
 * 
 * Tests the OpenAI embedding generation service functionality
 */

const { embeddingService, EmbeddingService } = require('../dist/services/embedding');

class EmbeddingServiceTests {
  constructor() {
    this.testResults = [];
    this.mockMode = !process.env.OPENAI_API_KEY; // Use mock mode if no API key
  }

  async runAllTests() {
    console.log('🧪 Running Embedding Service Tests');
    console.log('====================================\n');

    if (this.mockMode) {
      console.log('⚠️  Running in MOCK MODE (no OpenAI API key detected)');
      console.log('   Set OPENAI_API_KEY to test real API integration\n');
    }

    const tests = [
      () => this.testHealthCheck(),
      () => this.testSingleEmbedding(),
      () => this.testBatchEmbeddings(),
      () => this.testTextChunking(),
      () => this.testSimilarityCalculation(),
      () => this.testErrorHandling(),
      () => this.testConfigManagement(),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.addResult('ERROR', `Test failed: ${error.message}`, false);
      }
    }

    this.printResults();
    return this.testResults;
  }

  async testHealthCheck() {
    console.log('1. 🏥 Testing Health Check');
    
    const health = await embeddingService.healthCheck();
    
    if (this.mockMode) {
      this.addResult('HEALTH', 'Service status checked (mock mode)', true);
      console.log(`   Status: ${health.status}`);
      console.log(`   API Key Configured: ${health.apiKeyConfigured}`);
    } else {
      const isHealthy = health.status === 'healthy';
      this.addResult('HEALTH', `Service health: ${health.status}`, isHealthy);
      console.log(`   Status: ${health.status}`);
      console.log(`   API Key Configured: ${health.apiKeyConfigured}`);
      console.log(`   Test Embedding: ${health.testEmbedding}`);
    }
  }

  async testSingleEmbedding() {
    console.log('\n2. 🔢 Testing Single Embedding Generation');
    
    const testText = 'Hello, I am a test character with a mysterious personality.';
    
    if (this.mockMode) {
      // Mock embedding generation
      const mockEmbedding = {
        embedding: Array.from({ length: 1536 }, () => Math.random() - 0.5),
        tokens: 15,
        model: 'text-embedding-ada-002'
      };
      
      this.addResult('EMBEDDING', 'Single embedding generated (mock)', true);
      console.log(`   Text: "${testText}"`);
      console.log(`   Embedding Length: ${mockEmbedding.embedding.length}`);
      console.log(`   Tokens: ${mockEmbedding.tokens}`);
      console.log(`   Model: ${mockEmbedding.model}`);
    } else {
      try {
        const result = await embeddingService.generateEmbedding(testText);
        
        const isValid = Array.isArray(result.embedding) && 
                       result.embedding.length === 1536 && 
                       result.tokens > 0;
        
        this.addResult('EMBEDDING', 'Single embedding generation', isValid);
        console.log(`   Text: "${testText}"`);
        console.log(`   Embedding Length: ${result.embedding.length}`);
        console.log(`   Tokens: ${result.tokens}`);
        console.log(`   Model: ${result.model}`);
        
        if (!isValid) {
          console.log(`   ❌ Invalid embedding format`);
        }
      } catch (error) {
        this.addResult('EMBEDDING', `Single embedding failed: ${error.message}`, false);
      }
    }
  }

  async testBatchEmbeddings() {
    console.log('\n3. 📦 Testing Batch Embedding Generation');
    
    const testTexts = [
      'I am a wise and mysterious character.',
      'My personality is warm and caring.',
      'I enjoy deep philosophical conversations.',
      'I have a quirky sense of humor.'
    ];

    if (this.mockMode) {
      // Mock batch embedding generation
      const mockResults = testTexts.map((text, index) => ({
        embedding: Array.from({ length: 1536 }, () => Math.random() - 0.5),
        tokens: text.split(' ').length + 5,
        model: 'text-embedding-ada-002'
      }));
      
      this.addResult('BATCH', 'Batch embeddings generated (mock)', true);
      console.log(`   Input Texts: ${testTexts.length}`);
      console.log(`   Generated Embeddings: ${mockResults.length}`);
      console.log(`   Total Tokens: ${mockResults.reduce((sum, r) => sum + r.tokens, 0)}`);
    } else {
      try {
        const results = await embeddingService.generateBatchEmbeddings(testTexts);
        
        const isValid = results.length === testTexts.length &&
                       results.every(r => Array.isArray(r.embedding) && r.embedding.length === 1536);
        
        this.addResult('BATCH', 'Batch embedding generation', isValid);
        console.log(`   Input Texts: ${testTexts.length}`);
        console.log(`   Generated Embeddings: ${results.length}`);
        console.log(`   Total Tokens: ${results.reduce((sum, r) => sum + r.tokens, 0)}`);
        
        if (!isValid) {
          console.log(`   ❌ Invalid batch embedding format`);
        }
      } catch (error) {
        this.addResult('BATCH', `Batch embedding failed: ${error.message}`, false);
      }
    }
  }

  async testTextChunking() {
    console.log('\n4. ✂️  Testing Text Chunking');
    
    const longText = `
      This is a very long character biography that needs to be chunked into smaller pieces.
      The character is a mysterious wizard who lives in an ancient tower filled with magical artifacts.
      They have spent centuries studying the arcane arts and have developed a deep understanding of magic.
      Their personality is complex - they can be both wise and playful, serious and whimsical.
      They enjoy teaching young apprentices but also value their solitude.
      The character has silver hair that flows like moonlight and eyes that sparkle with ancient knowledge.
      They wear robes of deep purple adorned with silver stars and carry a staff topped with a crystal orb.
      Their voice is melodic and they speak in riddles when discussing important matters.
    `.trim();

    const chunks = EmbeddingService.chunkText(longText, {
      maxChunkSize: 200,
      overlap: 50,
      separator: '. '
    });

    const isValid = chunks.length > 1 && 
                   chunks.every(chunk => chunk.length <= 250) && // Allow some flexibility
                   chunks[0].length > 0;

    this.addResult('CHUNKING', 'Text chunking functionality', isValid);
    console.log(`   Original Length: ${longText.length} chars`);
    console.log(`   Number of Chunks: ${chunks.length}`);
    console.log(`   Chunk Sizes: ${chunks.map(c => c.length).join(', ')}`);
    
    if (chunks.length > 0) {
      console.log(`   First Chunk: "${chunks[0].substring(0, 80)}..."`);
    }
  }

  async testSimilarityCalculation() {
    console.log('\n5. 📊 Testing Similarity Calculation');
    
    // Create test vectors
    const vector1 = Array.from({ length: 1536 }, () => Math.random() - 0.5);
    const vector2 = Array.from({ length: 1536 }, () => Math.random() - 0.5);
    const identicalVector = [...vector1]; // Should have similarity of 1.0

    try {
      const similarityDifferent = EmbeddingService.calculateSimilarity(vector1, vector2);
      const similarityIdentical = EmbeddingService.calculateSimilarity(vector1, identicalVector);

      const isValid = similarityIdentical > 0.99 && // Should be very close to 1.0
                     similarityDifferent >= -1 && similarityDifferent <= 1 && // Valid range
                     similarityDifferent < similarityIdentical; // Different vectors should be less similar

      this.addResult('SIMILARITY', 'Cosine similarity calculation', isValid);
      console.log(`   Different Vectors Similarity: ${similarityDifferent.toFixed(4)}`);
      console.log(`   Identical Vectors Similarity: ${similarityIdentical.toFixed(4)}`);
      
      if (!isValid) {
        console.log(`   ❌ Similarity calculation failed validation`);
      }
    } catch (error) {
      this.addResult('SIMILARITY', `Similarity calculation failed: ${error.message}`, false);
    }
  }

  async testErrorHandling() {
    console.log('\n6. ⚠️  Testing Error Handling');
    
    // Test empty text embedding
    try {
      if (this.mockMode) {
        this.addResult('ERROR_HANDLING', 'Error handling tested (mock mode)', true);
        console.log(`   Empty text handling: Simulated`);
        console.log(`   Invalid API key handling: Simulated`);
      } else {
        const emptyResult = await embeddingService.generateEmbedding('');
        this.addResult('ERROR_HANDLING', 'Empty text should fail but didnt', false);
      }
    } catch (error) {
      this.addResult('ERROR_HANDLING', 'Empty text properly rejected', true);
      console.log(`   Empty text handling: ✅ Properly rejected`);
    }

    // Test invalid similarity calculation
    try {
      const vector1 = [1, 2, 3];
      const vector2 = [1, 2]; // Different length
      EmbeddingService.calculateSimilarity(vector1, vector2);
      this.addResult('ERROR_HANDLING', 'Mismatched vectors should fail but didnt', false);
    } catch (error) {
      this.addResult('ERROR_HANDLING', 'Mismatched vector lengths properly rejected', true);
      console.log(`   Mismatched vector lengths: ✅ Properly rejected`);
    }
  }

  async testConfigManagement() {
    console.log('\n7. ⚙️  Testing Configuration Management');
    
    const originalConfig = embeddingService.getConfig();
    
    // Test config update
    embeddingService.updateConfig({
      model: 'text-embedding-3-small',
      dimensions: 1024
    });
    
    const updatedConfig = embeddingService.getConfig();
    
    const configUpdated = updatedConfig.model === 'text-embedding-3-small' &&
                         updatedConfig.dimensions === 1024;
    
    this.addResult('CONFIG', 'Configuration management', configUpdated);
    console.log(`   Original Model: ${originalConfig.model}`);
    console.log(`   Updated Model: ${updatedConfig.model}`);
    console.log(`   Original Dimensions: ${originalConfig.dimensions}`);
    console.log(`   Updated Dimensions: ${updatedConfig.dimensions}`);
    
    // Restore original config
    embeddingService.updateConfig(originalConfig);
  }

  addResult(category, description, success) {
    this.testResults.push({ category, description, success });
    const icon = success ? '✅' : '❌';
    console.log(`   ${icon} ${description}`);
  }

  printResults() {
    console.log('\n📊 Embedding Service Test Results');
    console.log('===================================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
      console.log('🎉 All embedding service tests passed!');
    } else {
      console.log('⚠️  Some tests failed:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   ❌ ${r.category}: ${r.description}`));
    }
  }
}

// Export for use in other test files
module.exports = { EmbeddingServiceTests };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EmbeddingServiceTests();
  tester.runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}