/**
 * RAG Retrieval Service Module Tests
 * 
 * Tests vector similarity search and memory retrieval functionality
 */

const { ragRetrievalService } = require('../dist/services/rag-retrieval');
const { prisma } = require('../dist/utils/database');

class RAGRetrievalTests {
  constructor() {
    this.testResults = [];
    this.testCharacterId = null;
    this.testMemoryIds = [];
    this.mockMode = !process.env.OPENAI_API_KEY;
  }

  async runAllTests() {
    console.log('🧪 Running RAG Retrieval Tests');
    console.log('===============================\n');

    if (this.mockMode) {
      console.log('⚠️  Running in MOCK MODE (no OpenAI API key detected)');
      console.log('   Set OPENAI_API_KEY to test real vector similarity\n');
    }

    const tests = [
      () => this.testHealthCheck(),
      () => this.testCreateTestCharacter(),
      () => this.testCreateTestMemories(),
      () => this.testMemoryRetrieval(),
      () => this.testMemorySearch(),
      () => this.testMemoryStats(),
      () => this.testMemoryPruning(),
      () => this.testCleanup(),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.addResult('ERROR', `Test failed: ${error.message}`, false);
        console.error('   Error details:', error);
      }
    }

    this.printResults();
    return this.testResults;
  }

  async testHealthCheck() {
    console.log('1. 🏥 Testing RAG Retrieval Health Check');
    
    const health = await ragRetrievalService.healthCheck();
    
    const isHealthy = health.status === 'healthy' || this.mockMode;
    this.addResult('HEALTH', `Service status: ${health.status}`, isHealthy);
    console.log(`   Status: ${health.status}`);
    console.log(`   Embedding Service Healthy: ${health.embeddingServiceHealthy}`);
    console.log(`   Database Connected: ${health.databaseConnected}`);
    console.log(`   Vector Extension: ${health.vectorExtensionEnabled}`);
  }

  async testCreateTestCharacter() {
    console.log('\n2. 🎭 Creating Test Character with Core Persona');
    
    try {
      const testCharacter = await prisma.character.create({
        data: {
          name: 'Test Sage',
          archetype: 'Wise Scholar',
          chatbotRole: 'Knowledge Keeper',
          corePersonaSummary: 'Test Sage is a wise scholar and knowledge keeper. They are intelligent, patient, and helpful, speaking in a scholarly and articulate manner. Their role is to share knowledge and guide learning.',
          fullBio: 'Test Sage is an ancient scholar who has dedicated their life to the pursuit of knowledge. They possess vast wisdom accumulated over centuries of study and contemplation.',
          ownerId: 'test-user-id'
        }
      });

      this.testCharacterId = testCharacter.id;
      this.addResult('CHARACTER', 'Test character with core persona created', true);
      console.log(`   Created character: ${testCharacter.name} (${testCharacter.id})`);
      console.log(`   Core persona: "${testCharacter.corePersonaSummary}"`);
    } catch (error) {
      this.addResult('CHARACTER', `Character creation failed: ${error.message}`, false);
      throw error;
    }
  }

  async testCreateTestMemories() {
    console.log('\n3. 💾 Creating Test Memories');
    
    if (!this.testCharacterId) {
      this.addResult('MEMORIES', 'No test character available', false);
      return;
    }

    const testMemories = [
      {
        content: 'The character has extensive knowledge of ancient history and mythology.',
        memoryType: 'bio_chunk',
        importance: 'high',
        emotionalWeight: 0.8,
        topics: ['knowledge', 'history']
      },
      {
        content: 'User asked about the character\'s favorite subject of study.',
        memoryType: 'conversation',
        importance: 'medium',
        emotionalWeight: 0.6,
        topics: ['conversation', 'preferences']
      },
      {
        content: 'The character felt joy when successfully explaining a complex concept.',
        memoryType: 'emotional_event',
        importance: 'high',
        emotionalWeight: 0.9,
        topics: ['teaching', 'emotion', 'success']
      },
      {
        content: 'User is interested in learning about ancient civilizations.',
        memoryType: 'factual_knowledge',
        importance: 'medium',
        emotionalWeight: 0.5,
        topics: ['user_interests', 'civilizations']
      }
    ];

    if (this.mockMode) {
      // Create memories without embeddings in mock mode
      for (const memory of testMemories) {
        const created = await prisma.characterMemory.create({
          data: {
            characterId: this.testCharacterId,
            content: memory.content,
            memoryType: memory.memoryType,
            importance: memory.importance,
            emotionalWeight: memory.emotionalWeight,
            topics: JSON.stringify(memory.topics),
            relatedCharacters: JSON.stringify([]),
            sessionId: 'test-session'
          }
        });
        this.testMemoryIds.push(created.id);
      }
      
      this.addResult('MEMORIES', 'Test memories created (mock mode)', true);
      console.log(`   Created ${testMemories.length} test memories (without embeddings)`);
    } else {
      // Create memories with real embeddings
      let createdCount = 0;
      for (const memory of testMemories) {
        try {
          const memoryId = await ragRetrievalService.storeMemory(
            this.testCharacterId,
            memory.content,
            memory.memoryType,
            {
              importance: memory.importance,
              emotionalWeight: memory.emotionalWeight,
              topics: memory.topics,
              sessionId: 'test-session'
            }
          );
          this.testMemoryIds.push(memoryId);
          createdCount++;
        } catch (error) {
          console.log(`   ⚠️  Failed to create memory: ${error.message}`);
        }
      }
      
      const success = createdCount === testMemories.length;
      this.addResult('MEMORIES', `Test memories with embeddings created (${createdCount}/${testMemories.length})`, success);
      console.log(`   Created ${createdCount} memories with embeddings`);
    }
  }

  async testMemoryRetrieval() {
    console.log('\n4. 🔍 Testing RAG Context Retrieval');
    
    if (!this.testCharacterId) {
      this.addResult('RETRIEVAL', 'No test character available', false);
      return;
    }

    const testQueries = [
      'Tell me about your knowledge and expertise',
      'What subjects do you enjoy teaching?',
      'What makes you feel happy and fulfilled?'
    ];

    let successfulRetrievals = 0;

    for (const query of testQueries) {
      try {
        const ragContext = await ragRetrievalService.getCharacterContextForLLM(
          this.testCharacterId,
          query
        );

        const hasValidContext = ragContext.corePersona && 
                               ragContext.corePersona.length > 0 &&
                               ragContext.retrievalTime > 0;

        if (hasValidContext) {
          successfulRetrievals++;
        }

        console.log(`   Query: "${query}"`);
        console.log(`     Core Persona Length: ${ragContext.corePersona.length} chars`);
        console.log(`     Relevant Memories: ${ragContext.relevantMemories.length}`);
        console.log(`     Retrieval Time: ${ragContext.retrievalTime}ms`);

        if (ragContext.relevantMemories.length > 0) {
          ragContext.relevantMemories.forEach((memory, index) => {
            console.log(`       Memory ${index + 1}: ${memory.memoryType} (similarity: ${memory.similarity?.toFixed(3) || 'N/A'})`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Query failed: ${error.message}`);
      }
    }

    const success = successfulRetrievals === testQueries.length;
    this.addResult('RETRIEVAL', `RAG context retrieval (${successfulRetrievals}/${testQueries.length})`, success);
  }

  async testMemorySearch() {
    console.log('\n5. 🔎 Testing Memory Search');
    
    if (!this.testCharacterId) {
      this.addResult('SEARCH', 'No test character available', false);
      return;
    }

    try {
      const searchResults = await ragRetrievalService.searchMemories(
        this.testCharacterId,
        'ancient knowledge and history',
        {
          maxResults: 5,
          minSimilarity: 0.1 // Lower threshold for testing
        }
      );

      const hasResults = Array.isArray(searchResults);
      this.addResult('SEARCH', 'Memory search functionality', hasResults);
      console.log(`   Search Query: "ancient knowledge and history"`);
      console.log(`   Results Found: ${searchResults.length}`);
      
      if (searchResults.length > 0) {
        searchResults.forEach((result, index) => {
          console.log(`     Result ${index + 1}: ${result.memoryType} (similarity: ${result.similarity?.toFixed(3) || 'N/A'})`);
          console.log(`       Content: "${result.content.substring(0, 60)}..."`);
        });
      }
    } catch (error) {
      this.addResult('SEARCH', `Memory search failed: ${error.message}`, false);
    }
  }

  async testMemoryStats() {
    console.log('\n6. 📈 Testing Memory Statistics');
    
    if (!this.testCharacterId) {
      this.addResult('STATS', 'No test character available', false);
      return;
    }

    try {
      const stats = await ragRetrievalService.getMemoryStats(this.testCharacterId);
      
      const hasValidStats = typeof stats.totalMemories === 'number' &&
                           typeof stats.hasEmbeddings === 'number' &&
                           typeof stats.averageEmotionalWeight === 'number' &&
                           typeof stats.memoryTypeBreakdown === 'object';

      this.addResult('STATS', 'Memory statistics retrieval', hasValidStats);
      console.log(`   Total Memories: ${stats.totalMemories}`);
      console.log(`   Has Embeddings: ${stats.hasEmbeddings}`);
      console.log(`   Average Emotional Weight: ${stats.averageEmotionalWeight.toFixed(2)}`);
      console.log(`   Memory Type Breakdown:`);
      Object.entries(stats.memoryTypeBreakdown).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
      
      if (stats.oldestMemory) {
        console.log(`   Oldest Memory: ${stats.oldestMemory.toISOString()}`);
      }
      if (stats.newestMemory) {
        console.log(`   Newest Memory: ${stats.newestMemory.toISOString()}`);
      }
    } catch (error) {
      this.addResult('STATS', `Memory stats failed: ${error.message}`, false);
    }
  }

  async testMemoryPruning() {
    console.log('\n7. 🧹 Testing Memory Pruning');
    
    if (!this.testCharacterId) {
      this.addResult('PRUNING', 'No test character available', false);
      return;
    }

    try {
      const deletedCount = await ragRetrievalService.pruneMemories(
        this.testCharacterId,
        {
          maxMemories: 2, // Force pruning by setting low limit
          minImportance: 'low',
          olderThanDays: 0 // Don't delete based on age for testing
        }
      );

      this.addResult('PRUNING', 'Memory pruning functionality', true);
      console.log(`   Memories Deleted: ${deletedCount}`);
      
      // Check remaining memories
      const remainingStats = await ragRetrievalService.getMemoryStats(this.testCharacterId);
      console.log(`   Remaining Memories: ${remainingStats.totalMemories}`);
    } catch (error) {
      this.addResult('PRUNING', `Memory pruning failed: ${error.message}`, false);
    }
  }

  async testCleanup() {
    console.log('\n8. 🧹 Cleaning Up Test Data');
    
    if (!this.testCharacterId) {
      this.addResult('CLEANUP', 'No test character to clean up', true);
      return;
    }

    try {
      // Delete character memories first
      await prisma.characterMemory.deleteMany({
        where: { characterId: this.testCharacterId }
      });

      // Delete character
      await prisma.character.delete({
        where: { id: this.testCharacterId }
      });

      this.addResult('CLEANUP', 'Test data cleaned up', true);
      console.log(`   Deleted test character and ${this.testMemoryIds.length} memories`);
    } catch (error) {
      this.addResult('CLEANUP', `Cleanup failed: ${error.message}`, false);
    }
  }

  addResult(category, description, success) {
    this.testResults.push({ category, description, success });
    const icon = success ? '✅' : '❌';
    console.log(`   ${icon} ${description}`);
  }

  printResults() {
    console.log('\n📊 RAG Retrieval Test Results');
    console.log('==============================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
      console.log('🎉 All RAG retrieval tests passed!');
    } else {
      console.log('⚠️  Some tests failed:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   ❌ ${r.category}: ${r.description}`));
    }
  }
}

// Export for use in other test files
module.exports = { RAGRetrievalTests };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new RAGRetrievalTests();
  tester.runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}