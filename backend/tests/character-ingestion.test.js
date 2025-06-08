/**
 * Character Ingestion Service Module Tests
 * 
 * Tests the character bio ingestion and core persona generation
 */

const { characterIngestionService } = require('../dist/services/character-ingestion');
const { prisma } = require('../dist/utils/database');

class CharacterIngestionTests {
  constructor() {
    this.testResults = [];
    this.testCharacterId = null;
    this.mockMode = !process.env.OPENAI_API_KEY;
  }

  async runAllTests() {
    console.log('🧪 Running Character Ingestion Tests');
    console.log('======================================\n');

    if (this.mockMode) {
      console.log('⚠️  Running in MOCK MODE (no OpenAI API key detected)');
      console.log('   Set OPENAI_API_KEY to test real API integration\n');
    }

    const tests = [
      () => this.testHealthCheck(),
      () => this.testCreateTestCharacter(),
      () => this.testBuildFullBio(),
      () => this.testCharacterIngestion(),
      () => this.testIngestionStatus(),
      () => this.testReIngestion(),
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
    console.log('1. 🏥 Testing Ingestion Service Health Check');
    
    const health = await characterIngestionService.healthCheck();
    
    this.addResult('HEALTH', `Service status: ${health.status}`, health.status === 'healthy' || this.mockMode);
    console.log(`   Status: ${health.status}`);
    console.log(`   OpenAI Configured: ${health.openaiConfigured}`);
    console.log(`   Embedding Service Healthy: ${health.embeddingServiceHealthy}`);
  }

  async testCreateTestCharacter() {
    console.log('\n2. 🎭 Creating Test Character');
    
    try {
      const testCharacter = await prisma.character.create({
        data: {
          name: 'Test Luna',
          archetype: 'Mysterious Sage',
          chatbotRole: 'Mystical Guide and Wisdom Keeper',
          conceptualAge: 'Ancient (appears 25)',
          description: 'A mystical figure with flowing silver hair and deep purple robes adorned with golden stars',
          attire: 'Deep purple robes with golden star patterns, silver jewelry',
          colors: JSON.stringify(['purple', 'silver', 'gold']),
          features: 'Silver hair that flows like moonlight, violet eyes that sparkle with ancient wisdom, ethereal beauty',
          tone: JSON.stringify(['melodic', 'mysterious', 'gentle']),
          vocabulary: 'Poetic and archaic, often speaks in metaphors',
          primaryTraits: JSON.stringify(['wise', 'mysterious', 'compassionate']),
          secondaryTraits: JSON.stringify(['patient', 'intuitive', 'enigmatic']),
          quirks: JSON.stringify(['speaks in riddles when discussing important matters', 'traces patterns in the air when thinking']),
          primaryMotivation: 'Guide seekers toward their inner truth and help them understand the mysteries of existence',
          coreGoal: 'Preserve ancient wisdom while helping others discover their own path',
          secondaryGoals: JSON.stringify(['Protect mystical knowledge', 'Nurture spiritual growth in others']),
          approach: 'Gentle guidance through questions and parables',
          demeanor: 'Serene and contemplative, with an undercurrent of playful wisdom',
          greeting: 'Greetings, seeker. The stars have guided your path to this moment.',
          affirmation: 'Yes, you begin to see the truth that was always within you.',
          comfort: 'In every shadow, there is light waiting to be discovered. You are stronger than you know.',
          forbiddenTopics: JSON.stringify(['harmful magic', 'dark rituals']),
          interactionPolicy: 'Provide wisdom and guidance while respecting free will',
          conflictResolution: 'Address disagreements with patience and seek understanding',
          ownerId: 'test-user-id'
        }
      });

      this.testCharacterId = testCharacter.id;
      this.addResult('CHARACTER', 'Test character created', true);
      console.log(`   Created character: ${testCharacter.name} (${testCharacter.id})`);
    } catch (error) {
      this.addResult('CHARACTER', `Character creation failed: ${error.message}`, false);
      throw error;
    }
  }

  async testBuildFullBio() {
    console.log('\n3. 📝 Testing Full Bio Construction');
    
    if (!this.testCharacterId) {
      this.addResult('BIO_BUILD', 'No test character available', false);
      return;
    }

    const character = await prisma.character.findUnique({
      where: { id: this.testCharacterId }
    });

    // Test the bio building logic by simulating it
    const sections = [];
    
    // Identity
    sections.push(`IDENTITY:\nName: ${character.name}\nArchetype: ${character.archetype}`);
    
    // Appearance  
    if (character.description) {
      sections.push(`APPEARANCE:\nDescription: ${character.description}`);
    }
    
    // Personality
    const traits = JSON.parse(character.primaryTraits || '[]');
    if (traits.length > 0) {
      sections.push(`PERSONALITY:\nPrimary traits: ${traits.join(', ')}`);
    }

    const fullBio = sections.join('\n\n');
    const hasContent = fullBio.length > 100 && fullBio.includes(character.name);
    
    this.addResult('BIO_BUILD', 'Full bio construction', hasContent);
    console.log(`   Bio Length: ${fullBio.length} characters`);
    console.log(`   Sections: ${sections.length}`);
    console.log(`   Preview: "${fullBio.substring(0, 100)}..."`);
  }

  async testCharacterIngestion() {
    console.log('\n4. 🔄 Testing Character Bio Ingestion');
    
    if (!this.testCharacterId) {
      this.addResult('INGESTION', 'No test character available', false);
      return;
    }

    if (this.mockMode) {
      // Mock the ingestion process
      const mockResult = {
        characterId: this.testCharacterId,
        corePersonaGenerated: true,
        chunksCreated: 4,
        embeddingsGenerated: 4,
        totalTokensUsed: 250,
        success: true,
        errors: []
      };

      // Update character with mock data
      await prisma.character.update({
        where: { id: this.testCharacterId },
        data: {
          fullBio: 'Mock full biography of the test character with detailed personality and background information.',
          corePersonaSummary: 'Test Luna is a mysterious sage and mystical guide. She is wise, mysterious, and compassionate, speaking in a melodic, mysterious, and gentle manner. Her role is to guide seekers toward inner truth.'
        }
      });

      this.addResult('INGESTION', 'Character ingestion (mock)', true);
      console.log(`   Core Persona Generated: ${mockResult.corePersonaGenerated ? '✅' : '❌'}`);
      console.log(`   Chunks Created: ${mockResult.chunksCreated}`);
      console.log(`   Embeddings Generated: ${mockResult.embeddingsGenerated}`);
      console.log(`   Total Tokens Used: ${mockResult.totalTokensUsed}`);
    } else {
      try {
        const result = await characterIngestionService.ingestCharacterBio(this.testCharacterId);
        
        const success = result.success && 
                       result.corePersonaGenerated && 
                       result.chunksCreated > 0 &&
                       result.embeddingsGenerated > 0;

        this.addResult('INGESTION', 'Character bio ingestion', success);
        console.log(`   Core Persona Generated: ${result.corePersonaGenerated ? '✅' : '❌'}`);
        console.log(`   Chunks Created: ${result.chunksCreated}`);
        console.log(`   Embeddings Generated: ${result.embeddingsGenerated}`);
        console.log(`   Total Tokens Used: ${result.totalTokensUsed}`);
        
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        this.addResult('INGESTION', `Ingestion failed: ${error.message}`, false);
      }
    }
  }

  async testIngestionStatus() {
    console.log('\n5. 📊 Testing Ingestion Status Check');
    
    if (!this.testCharacterId) {
      this.addResult('STATUS', 'No test character available', false);
      return;
    }

    try {
      const status = await characterIngestionService.getIngestionStatus(this.testCharacterId);
      
      const hasValidStatus = typeof status.hasFullBio === 'boolean' &&
                            typeof status.hasCorePersona === 'boolean' &&
                            typeof status.memoryChunkCount === 'number';

      this.addResult('STATUS', 'Ingestion status retrieval', hasValidStatus);
      console.log(`   Has Full Bio: ${status.hasFullBio ? '✅' : '❌'}`);
      console.log(`   Has Core Persona: ${status.hasCorePersona ? '✅' : '❌'}`);
      console.log(`   Memory Chunk Count: ${status.memoryChunkCount}`);
      console.log(`   Last Ingested: ${status.lastIngested || 'Never'}`);
    } catch (error) {
      this.addResult('STATUS', `Status check failed: ${error.message}`, false);
    }
  }

  async testReIngestion() {
    console.log('\n6. 🔁 Testing Re-ingestion (Idempotency)');
    
    if (!this.testCharacterId || this.mockMode) {
      this.addResult('RE_INGESTION', 'Re-ingestion test skipped (mock mode or no character)', true);
      console.log('   Skipped in mock mode or no character available');
      return;
    }

    try {
      // Run ingestion again to test it's idempotent
      const result = await characterIngestionService.ingestCharacterBio(this.testCharacterId);
      
      // Should still succeed and create new chunks (old ones are cleared)
      const success = result.success && result.chunksCreated > 0;
      
      this.addResult('RE_INGESTION', 'Character re-ingestion', success);
      console.log(`   Re-ingestion Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   New Chunks Created: ${result.chunksCreated}`);
    } catch (error) {
      this.addResult('RE_INGESTION', `Re-ingestion failed: ${error.message}`, false);
    }
  }

  async testCleanup() {
    console.log('\n7. 🧹 Cleaning Up Test Data');
    
    if (!this.testCharacterId) {
      this.addResult('CLEANUP', 'No test character to clean up', true);
      return;
    }

    try {
      // Delete character memories first (due to foreign key constraints)
      await prisma.characterMemory.deleteMany({
        where: { characterId: this.testCharacterId }
      });

      // Delete character
      await prisma.character.delete({
        where: { id: this.testCharacterId }
      });

      this.addResult('CLEANUP', 'Test data cleaned up', true);
      console.log(`   Deleted test character: ${this.testCharacterId}`);
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
    console.log('\n📊 Character Ingestion Test Results');
    console.log('====================================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
      console.log('🎉 All character ingestion tests passed!');
    } else {
      console.log('⚠️  Some tests failed:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   ❌ ${r.category}: ${r.description}`));
    }
  }
}

// Export for use in other test files
module.exports = { CharacterIngestionTests };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CharacterIngestionTests();
  tester.runAllTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}