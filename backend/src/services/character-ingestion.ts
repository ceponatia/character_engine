import { Character } from '@prisma/client';
import { prisma } from '../utils/database';
import { embeddingService, EmbeddingService } from './embedding';
import { OpenAI } from 'openai';

export interface CharacterBioIngestionConfig {
  chunkSize: number;
  chunkOverlap: number;
  corePersonaMaxTokens: number;
  generateCorePersona: boolean;
}

export interface IngestionResult {
  characterId: string;
  corePersonaGenerated: boolean;
  chunksCreated: number;
  embeddingsGenerated: number;
  totalTokensUsed: number;
  success: boolean;
  errors: string[];
}

export class CharacterIngestionService {
  private openai: OpenAI | null;
  private config: CharacterBioIngestionConfig;
  private mockMode: boolean;

  constructor(apiKey?: string, config?: Partial<CharacterBioIngestionConfig>) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.mockMode = !key;
    
    if (key) {
      this.openai = new OpenAI({ apiKey: key });
    } else {
      this.openai = null;
      console.log('🔄 Character ingestion service running in mock mode (no OPENAI_API_KEY)');
    }

    this.config = {
      chunkSize: 800,
      chunkOverlap: 100,
      corePersonaMaxTokens: 200,
      generateCorePersona: true,
      ...config,
    };
  }

  /**
   * Process a character's full biography - generate core persona and chunk/embed memories
   */
  async ingestCharacterBio(characterId: string): Promise<IngestionResult> {
    const result: IngestionResult = {
      characterId,
      corePersonaGenerated: false,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      totalTokensUsed: 0,
      success: false,
      errors: [],
    };

    try {
      // Get character from database
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        result.errors.push(`Character with ID ${characterId} not found`);
        return result;
      }

      // Build full bio from character data
      const fullBio = this.buildFullBioFromCharacter(character);
      
      if (!fullBio || fullBio.trim().length === 0) {
        result.errors.push('Character has no bio content to process');
        return result;
      }

      // Update character with full bio
      await prisma.character.update({
        where: { id: characterId },
        data: { fullBio },
      });

      // Generate core persona summary
      if (this.config.generateCorePersona) {
        try {
          const corePersona = await this.generateCorePersona(character, fullBio);
          await prisma.character.update({
            where: { id: characterId },
            data: { corePersonaSummary: corePersona },
          });
          result.corePersonaGenerated = true;
          result.totalTokensUsed += 150; // Estimate for core persona generation
        } catch (error) {
          result.errors.push(`Core persona generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Chunk the biography
      const chunks = EmbeddingService.chunkText(fullBio, {
        maxChunkSize: this.config.chunkSize,
        overlap: this.config.chunkOverlap,
      });

      if (chunks.length === 0) {
        result.errors.push('No chunks created from bio');
        return result;
      }

      result.chunksCreated = chunks.length;

      // Clear existing memory chunks for this character
      await prisma.characterMemory.deleteMany({
        where: {
          characterId,
          memoryType: 'bio_chunk',
        },
      });

      // Generate embeddings for chunks
      try {
        const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
        result.embeddingsGenerated = embeddings.length;

        // Store chunks and embeddings in database
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];

          if (!embedding || !embedding.embedding) {
            result.errors.push(`Failed to generate embedding for chunk ${i}`);
            continue;
          }

          // Convert embedding array to PostgreSQL vector format
          const vectorString = `[${embedding.embedding.join(',')}]`;

          await prisma.$queryRaw`
            INSERT INTO "character_memories" (
              id, "characterId", content, "memoryType", embedding, "createdAt"
            ) VALUES (
              gen_random_uuid()::text,
              ${characterId},
              ${chunk},
              'bio_chunk',
              ${vectorString}::vector,
              NOW()
            )
          `;

          result.totalTokensUsed += embedding.tokens;
        }

        result.success = true;
      } catch (error) {
        result.errors.push(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      result.errors.push(`Character ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generate a condensed core persona summary from character data and full bio
   */
  private async generateCorePersona(character: Character, fullBio: string): Promise<string> {
    const personalityData = {
      name: character.name,
      archetype: character.archetype,
      role: character.chatbotRole,
      primaryTraits: character.primaryTraits || [],
      tone: character.tone || [],
      approach: character.approach,
      demeanor: character.demeanor,
      vocabulary: character.vocabulary,
    };

    const prompt = `You are an expert character designer. Create a condensed, ${this.config.corePersonaMaxTokens}-word personality summary for an AI character that will be used as a system prompt.

Character Data:
- Name: ${personalityData.name}
- Archetype: ${personalityData.archetype}
- Role: ${personalityData.role}
- Primary Traits: ${personalityData.primaryTraits.join(', ')}
- Speaking Tone: ${personalityData.tone.join(', ')}
- Approach: ${personalityData.approach || 'Not specified'}
- Demeanor: ${personalityData.demeanor || 'Not specified'}
- Vocabulary: ${personalityData.vocabulary || 'Not specified'}

Full Biography:
${fullBio.substring(0, 2000)}...

Requirements:
1. Focus ONLY on core personality, speaking style, and primary motivations
2. Use clear, direct language optimized for AI understanding
3. Keep it concise but comprehensive enough to maintain character consistency
4. Do NOT include physical appearance details (those are handled separately)
5. Maximum ${this.config.corePersonaMaxTokens} words

Core Persona Summary:`;

    if (this.mockMode) {
      // Generate mock core persona from character data
      const traits = personalityData.primaryTraits.slice(0, 3).join(', ');
      const tone = personalityData.tone.slice(0, 2).join(', ');
      return `${personalityData.name} is a ${personalityData.archetype} and ${personalityData.role}. They are ${traits}, speaking in a ${tone} manner. ${personalityData.approach ? `Their approach is to ${personalityData.approach.toLowerCase()}.` : ''} ${personalityData.vocabulary ? `They use ${personalityData.vocabulary.toLowerCase()} language.` : ''} (mock generated)`;
    }

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.ceil(this.config.corePersonaMaxTokens * 1.3), // Allow some buffer
        temperature: 0.3, // Lower temperature for consistency
      });

      const corePersona = response.choices[0]?.message?.content?.trim();
      if (!corePersona) {
        throw new Error('No core persona generated');
      }

      return corePersona;
    } catch (error) {
      console.error('Error generating core persona:', error);
      throw new Error(`Core persona generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build full bio text from character database fields
   */
  private buildFullBioFromCharacter(character: Character): string {
    const sections: string[] = [];

    // Identity Section
    sections.push(`IDENTITY:
Name: ${character.name}
Archetype: ${character.archetype}
Role: ${character.chatbotRole}
${character.conceptualAge ? `Age: ${character.conceptualAge}` : ''}
${character.sourceMaterial ? `Source: ${character.sourceMaterial}` : ''}`);

    // Appearance Section
    if (character.description || character.attire || character.features) {
      const appearanceParts = [];
      if (character.description) appearanceParts.push(`Description: ${character.description}`);
      if (character.features) appearanceParts.push(`Features: ${character.features}`);
      if (character.attire) appearanceParts.push(`Attire: ${character.attire}`);
      
      const colors = character.colors || [];
      if (colors.length > 0) {
        appearanceParts.push(`Color preferences: ${colors.join(', ')}`);
      }

      sections.push(`APPEARANCE:\n${appearanceParts.join('\n')}`);
    }

    // Personality Section
    const primaryTraits = character.primaryTraits || [];
    const secondaryTraits = character.secondaryTraits || [];
    const quirks = character.quirks || [];
    
    if (primaryTraits.length > 0 || secondaryTraits.length > 0 || quirks.length > 0) {
      const personalityParts = [];
      if (primaryTraits.length > 0) personalityParts.push(`Primary traits: ${primaryTraits.join(', ')}`);
      if (secondaryTraits.length > 0) personalityParts.push(`Secondary traits: ${secondaryTraits.join(', ')}`);
      if (quirks.length > 0) personalityParts.push(`Quirks: ${quirks.join(', ')}`);
      
      sections.push(`PERSONALITY:\n${personalityParts.join('\n')}`);
    }

    // Communication Style Section
    const tone = character.tone || [];
    if (tone.length > 0 || character.vocabulary || character.pacing || character.inflection) {
      const commParts = [];
      if (tone.length > 0) commParts.push(`Tone: ${tone.join(', ')}`);
      if (character.vocabulary) commParts.push(`Vocabulary: ${character.vocabulary}`);
      if (character.pacing) commParts.push(`Pacing: ${character.pacing}`);
      if (character.inflection) commParts.push(`Inflection: ${character.inflection}`);
      
      sections.push(`COMMUNICATION:\n${commParts.join('\n')}`);
    }

    // Goals & Motivation Section
    const secondaryGoals = character.secondaryGoals || [];
    if (character.primaryMotivation || character.coreGoal || secondaryGoals.length > 0) {
      const goalParts = [];
      if (character.primaryMotivation) goalParts.push(`Primary motivation: ${character.primaryMotivation}`);
      if (character.coreGoal) goalParts.push(`Core goal: ${character.coreGoal}`);
      if (secondaryGoals.length > 0) goalParts.push(`Secondary goals: ${secondaryGoals.join(', ')}`);
      
      sections.push(`GOALS & MOTIVATION:\n${goalParts.join('\n')}`);
    }

    // Interaction Style Section
    const coreAbilities = character.coreAbilities || [];
    if (character.approach || character.patience || character.demeanor || character.adaptability || coreAbilities.length > 0) {
      const interactionParts = [];
      if (character.approach) interactionParts.push(`Approach: ${character.approach}`);
      if (character.patience) interactionParts.push(`Patience: ${character.patience}`);
      if (character.demeanor) interactionParts.push(`Demeanor: ${character.demeanor}`);
      if (character.adaptability) interactionParts.push(`Adaptability: ${character.adaptability}`);
      if (coreAbilities.length > 0) interactionParts.push(`Core abilities: ${coreAbilities.join(', ')}`);
      
      sections.push(`INTERACTION STYLE:\n${interactionParts.join('\n')}`);
    }

    // Signature Phrases Section
    if (character.greeting || character.affirmation || character.comfort) {
      const phrasesParts = [];
      if (character.greeting) phrasesParts.push(`Greeting: "${character.greeting}"`);
      if (character.affirmation) phrasesParts.push(`Affirmation: "${character.affirmation}"`);
      if (character.comfort) phrasesParts.push(`Comfort: "${character.comfort}"`);
      
      sections.push(`SIGNATURE PHRASES:\n${phrasesParts.join('\n')}`);
    }

    // Boundaries Section
    const forbiddenTopics = character.forbiddenTopics || [];
    if (forbiddenTopics.length > 0 || character.interactionPolicy || character.conflictResolution) {
      const boundaryParts = [];
      if (forbiddenTopics.length > 0) boundaryParts.push(`Forbidden topics: ${forbiddenTopics.join(', ')}`);
      if (character.interactionPolicy) boundaryParts.push(`Interaction policy: ${character.interactionPolicy}`);
      if (character.conflictResolution) boundaryParts.push(`Conflict resolution: ${character.conflictResolution}`);
      
      sections.push(`BOUNDARIES:\n${boundaryParts.join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Process all characters in the database
   */
  async ingestAllCharacters(): Promise<IngestionResult[]> {
    try {
      const characters = await prisma.character.findMany({
        select: { id: true },
      });

      const results: IngestionResult[] = [];

      for (const character of characters) {
        const result = await this.ingestCharacterBio(character.id);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error ingesting all characters:', error);
      throw new Error(`Failed to ingest all characters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ingestion status for a character
   */
  async getIngestionStatus(characterId: string): Promise<{
    hasFullBio: boolean;
    hasCorePersona: boolean;
    memoryChunkCount: number;
    lastIngested?: Date;
  }> {
    try {
      const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: {
          fullBio: true,
          corePersonaSummary: true,
          updatedAt: true,
        },
      });

      if (!character) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      const memoryChunkCount = await prisma.characterMemory.count({
        where: {
          characterId,
          memoryType: 'bio_chunk',
        },
      });

      return {
        hasFullBio: !!character.fullBio,
        hasCorePersona: !!character.corePersonaSummary,
        memoryChunkCount,
        lastIngested: character.updatedAt,
      };
    } catch (error) {
      console.error('Error getting ingestion status:', error);
      throw new Error(`Failed to get ingestion status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // No longer needed - using native arrays
  private parseJSONField(field: string[] | null): string[] {
    return field || [];
  }

  /**
   * Health check for the ingestion service
   */
  async healthCheck(): Promise<{
    status: string;
    config: CharacterBioIngestionConfig;
    embeddingServiceHealthy: boolean;
    openaiConfigured: boolean;
  }> {
    const embeddingHealth = await embeddingService.healthCheck();

    return {
      status: embeddingHealth.status === 'healthy' ? 'healthy' : 'degraded',
      config: this.config,
      embeddingServiceHealthy: embeddingHealth.status === 'healthy',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    };
  }
}

// Singleton instance for the application
export const characterIngestionService = new CharacterIngestionService();