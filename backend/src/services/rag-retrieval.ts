import { prisma } from '../utils/database';
import { embeddingService } from './embedding';

export interface RetrievedMemory {
  id: string;
  content: string;
  memoryType: string;
  similarity: number;
  emotionalWeight: number;
  importance: string;
  dayNumber?: number;
  timeOfDay?: string;
  location?: string;
  relatedCharacters: string[];
  topics: string[];
  createdAt: Date;
}

export interface RAGRetrievalConfig {
  maxResults: number;
  minSimilarity: number;
  memoryTypes: string[];
  weightEmotional: boolean;
  boostRecent: boolean;
}

export interface RAGContext {
  corePersona: string;
  relevantMemories: RetrievedMemory[];
  totalMemories: number;
  searchQuery: string;
  retrievalTime: number;
}

export class RAGRetrievalService {
  private config: RAGRetrievalConfig;

  constructor(config?: Partial<RAGRetrievalConfig>) {
    this.config = {
      maxResults: 3,
      minSimilarity: 0.7,
      memoryTypes: ['bio_chunk', 'conversation', 'emotional_event', 'factual_knowledge'],
      weightEmotional: true,
      boostRecent: true,
      ...config,
    };
  }

  /**
   * Retrieve character context for LLM using RAG
   */
  async getCharacterContextForLLM(
    characterId: string,
    userMessage: string,
    options?: Partial<RAGRetrievalConfig>
  ): Promise<RAGContext> {
    const startTime = Date.now();
    const retrievalConfig = { ...this.config, ...options };

    try {
      // Get core persona summary (static context)
      const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: { 
          corePersonaSummary: true,
          name: true,
        },
      });

      if (!character) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      const corePersona = character.corePersonaSummary || `You are ${character.name}. Stay in character.`;

      // Generate embedding for user message
      const userEmbedding = await embeddingService.generateEmbedding(userMessage);
      const queryVector = `[${userEmbedding.embedding.join(',')}]`;

      // Retrieve relevant memories using vector similarity
      const memories = await this.retrieveRelevantMemories(
        characterId,
        queryVector,
        retrievalConfig
      );

      const retrievalTime = Date.now() - startTime;

      return {
        corePersona,
        relevantMemories: memories,
        totalMemories: memories.length,
        searchQuery: userMessage,
        retrievalTime,
      };
    } catch (error) {
      console.error('Error retrieving RAG context:', error);
      
      // Fallback to core persona only
      const character = await prisma.character.findUnique({
        where: { id: characterId },
        select: { corePersonaSummary: true, name: true },
      });

      return {
        corePersona: character?.corePersonaSummary || `You are ${character?.name || 'Assistant'}. Stay in character.`,
        relevantMemories: [],
        totalMemories: 0,
        searchQuery: userMessage,
        retrievalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Retrieve memories using vector similarity search
   */
  private async retrieveRelevantMemories(
    characterId: string,
    queryVector: string,
    config: RAGRetrievalConfig
  ): Promise<RetrievedMemory[]> {
    try {
      // Build memory type filter
      const memoryTypeFilter = config.memoryTypes.map(type => `'${type}'`).join(', ');

      // Query with vector similarity, importance weighting, and recency boost
      const query = `
        SELECT 
          id,
          content,
          "memoryType",
          "emotionalWeight",
          importance,
          "dayNumber",
          "timeOfDay",
          location,
          "relatedCharacters",
          topics,
          "createdAt",
          -- Calculate similarity distance (0 = identical, higher = less similar)
          (embedding <-> $2::vector) as distance,
          -- Calculate final score with weighting
          (
            -- Base similarity score (1 - distance, so higher = more similar)
            (1 - (embedding <-> $2::vector)) * 
            -- Emotional weight boost (if enabled)
            ${config.weightEmotional ? '(1 + "emotionalWeight")' : '1'} *
            -- Importance multiplier
            CASE importance 
              WHEN 'high' THEN 1.3
              WHEN 'medium' THEN 1.0 
              WHEN 'low' THEN 0.7
              ELSE 1.0
            END ${config.boostRecent ? `*
            -- Recency boost (newer memories get slight boost)
            (1 + (EXTRACT(EPOCH FROM NOW() - "createdAt") / -2592000)) -- 30 days decay` : ''}
          ) as final_score
        FROM "character_memories"
        WHERE 
          "characterId" = $1 
          AND "memoryType" IN (${memoryTypeFilter})
          AND embedding IS NOT NULL
          AND (1 - (embedding <-> $2::vector)) >= $3  -- Minimum similarity threshold
        ORDER BY final_score DESC
        LIMIT $4
      `;

      const result = await prisma.$queryRawUnsafe<any[]>(
        query,
        characterId,
        queryVector,
        config.minSimilarity,
        config.maxResults
      );

      return result.map(row => ({
        id: row.id,
        content: row.content,
        memoryType: row.memoryType,
        similarity: 1 - parseFloat(row.distance), // Convert distance back to similarity
        emotionalWeight: parseFloat(row.emotionalWeight),
        importance: row.importance,
        dayNumber: row.dayNumber,
        timeOfDay: row.timeOfDay,
        location: row.location,
        relatedCharacters: row.relatedCharacters || [],
        topics: row.topics || [],
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error retrieving memories with vector search:', error);
      return [];
    }
  }

  /**
   * Store a new memory with embedding
   */
  async storeMemory(
    characterId: string,
    content: string,
    memoryType: string,
    metadata: {
      emotionalWeight?: number;
      importance?: string;
      dayNumber?: number;
      timeOfDay?: string;
      location?: string;
      relatedCharacters?: string[];
      topics?: string[];
      sessionId?: string;
    } = {}
  ): Promise<string> {
    try {
      // Generate embedding for the memory content
      const embedding = await embeddingService.generateEmbedding(content);
      const vectorString = `[${embedding.embedding.join(',')}]`;

      // Store memory in database using raw SQL for vector insertion
      const insertResult = await prisma.$queryRaw<{id: string}[]>`
        INSERT INTO "character_memories" (
          id, "characterId", content, "memoryType", embedding, 
          "emotionalWeight", importance, "dayNumber", "timeOfDay", 
          location, "relatedCharacters", topics, "sessionId", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${characterId},
          ${content},
          ${memoryType},
          ${vectorString}::vector,
          ${metadata.emotionalWeight || 0.5},
          ${metadata.importance || 'medium'},
          ${metadata.dayNumber || null},
          ${metadata.timeOfDay || null},
          ${metadata.location || null},
          ${metadata.relatedCharacters || []},
          ${metadata.topics || []},
          ${metadata.sessionId || null},
          NOW()
        )
        RETURNING id
      `;

      const memoryId = insertResult[0]?.id;

      console.log(`📝 Stored new memory for character ${characterId}: ${content.substring(0, 100)}...`);
      return memoryId as string;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search memories by text query (without specific character context)
   */
  async searchMemories(
    characterId: string,
    query: string,
    options?: {
      memoryTypes?: string[];
      maxResults?: number;
      minSimilarity?: number;
    }
  ): Promise<RetrievedMemory[]> {
    try {
      const searchConfig = {
        ...this.config,
        ...options,
      };

      const embedding = await embeddingService.generateEmbedding(query);
      const queryVector = `[${embedding.embedding.join(',')}]`;

      return await this.retrieveRelevantMemories(characterId, queryVector, searchConfig);
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  /**
   * Get memory statistics for a character
   */
  async getMemoryStats(characterId: string): Promise<{
    totalMemories: number;
    memoryTypeBreakdown: Record<string, number>;
    hasEmbeddings: number;
    averageEmotionalWeight: number;
    oldestMemory?: Date;
    newestMemory?: Date;
  }> {
    try {
      const stats = await prisma.characterMemory.findMany({
        where: { characterId },
        select: {
          memoryType: true,
          emotionalWeight: true,
          createdAt: true,
        },
      });

      const memoryTypeBreakdown: Record<string, number> = {};
      let hasEmbeddings = 0;
      let totalEmotionalWeight = 0;
      const dates = stats.map(s => s.createdAt);

      stats.forEach(memory => {
        memoryTypeBreakdown[memory.memoryType] = (memoryTypeBreakdown[memory.memoryType] || 0) + 1;
        // Note: embedding check removed for compatibility
        hasEmbeddings++; // Count all memories for now
        totalEmotionalWeight += memory.emotionalWeight;
      });

      return {
        totalMemories: stats.length,
        memoryTypeBreakdown,
        hasEmbeddings,
        averageEmotionalWeight: stats.length > 0 ? totalEmotionalWeight / stats.length : 0,
        oldestMemory: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
        newestMemory: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined,
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      throw new Error(`Failed to get memory stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete old or low-importance memories to manage storage
   */
  async pruneMemories(
    characterId: string,
    options: {
      maxMemories?: number;
      minImportance?: string;
      olderThanDays?: number;
    } = {}
  ): Promise<number> {
    try {
      const { maxMemories = 1000, minImportance = 'low', olderThanDays = 90 } = options;

      let deletedCount = 0;

      // Delete very old, low-importance memories
      if (olderThanDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const oldDeleted = await prisma.characterMemory.deleteMany({
          where: {
            characterId,
            importance: 'low',
            emotionalWeight: { lt: 0.3 },
            createdAt: { lt: cutoffDate },
          },
        });
        deletedCount += oldDeleted.count;
      }

      // If still over limit, delete oldest low-importance memories
      const currentCount = await prisma.characterMemory.count({
        where: { characterId },
      });

      if (currentCount > maxMemories) {
        const excessCount = currentCount - maxMemories;
        
        const oldestLowImportance = await prisma.characterMemory.findMany({
          where: {
            characterId,
            importance: 'low',
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: excessCount,
        });

        if (oldestLowImportance.length > 0) {
          const idsToDelete = oldestLowImportance.map(m => m.id);
          const pruneDeleted = await prisma.characterMemory.deleteMany({
            where: {
              id: { in: idsToDelete },
            },
          });
          deletedCount += pruneDeleted.count;
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Pruned ${deletedCount} memories for character ${characterId}`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Error pruning memories:', error);
      return 0;
    }
  }

  // No longer needed - using native arrays
  private parseJSONField(field: string[] | null): string[] {
    return field || [];
  }


  /**
   * Health check for the RAG retrieval service
   */
  async healthCheck(): Promise<{
    status: string;
    config: RAGRetrievalConfig;
    embeddingServiceHealthy: boolean;
    databaseConnected: boolean;
    vectorExtensionEnabled?: boolean;
  }> {
    try {
      const embeddingHealth = await embeddingService.healthCheck();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check if vector extension is available
      let vectorExtensionEnabled = false;
      try {
        await prisma.$queryRaw`SELECT '[]'::vector`;
        vectorExtensionEnabled = true;
      } catch {
        vectorExtensionEnabled = false;
      }

      return {
        status: embeddingHealth.status.includes('healthy') && vectorExtensionEnabled ? 'healthy' : 'degraded',
        config: this.config,
        embeddingServiceHealthy: embeddingHealth.status.includes('healthy'),
        databaseConnected: true,
        vectorExtensionEnabled,
      };
    } catch (error) {
      return {
        status: 'error',
        config: this.config,
        embeddingServiceHealthy: false,
        databaseConnected: false,
      };
    }
  }

  /**
   * Update RAG retrieval configuration
   */
  updateConfig(newConfig: Partial<RAGRetrievalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 RAG retrieval config updated:', newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): RAGRetrievalConfig {
    return { ...this.config };
  }
}

// Singleton instance for the application
export const ragRetrievalService = new RAGRetrievalService();