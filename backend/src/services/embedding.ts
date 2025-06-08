import { OpenAI } from 'openai';

export interface EmbeddingConfig {
  model: string;
  dimensions?: number;
  maxTokens?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export class EmbeddingService {
  private openai: OpenAI | null;
  private config: EmbeddingConfig;
  private mockMode: boolean;

  constructor(apiKey?: string, config?: Partial<EmbeddingConfig>) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.mockMode = !key;
    
    if (key) {
      this.openai = new OpenAI({ apiKey: key });
    } else {
      this.openai = null;
      console.log('🔄 Embedding service running in mock mode (no OPENAI_API_KEY)');
    }

    this.config = {
      model: 'text-embedding-ada-002',
      dimensions: 1536,
      maxTokens: 8191,
      ...config,
    };
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (this.mockMode) {
      // Return mock embedding for testing without API key
      return {
        embedding: Array.from({ length: this.config.dimensions || 1536 }, () => Math.random() - 0.5),
        tokens: Math.ceil(text.length / 4), // Rough token estimate
        model: this.config.model + ' (mock)',
      };
    }

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: text,
        encoding_format: 'float',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding returned from OpenAI API');
      }

      const embedding = response.data[0].embedding;
      const tokens = response.usage?.total_tokens || 0;

      return {
        embedding,
        tokens,
        model: this.config.model,
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) {
      return [];
    }

    if (this.mockMode) {
      // Return mock embeddings for testing
      return texts.map(text => ({
        embedding: Array.from({ length: this.config.dimensions || 1536 }, () => Math.random() - 0.5),
        tokens: Math.ceil(text.length / 4),
        model: this.config.model + ' (mock)',
      }));
    }

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Process in batches to avoid API limits
      const batchSize = 100;
      const results: EmbeddingResult[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await this.openai.embeddings.create({
          model: this.config.model,
          input: batch,
          encoding_format: 'float',
        });

        if (!response.data || response.data.length !== batch.length) {
          throw new Error(`Batch embedding failed: expected ${batch.length} embeddings, got ${response.data?.length || 0}`);
        }

        const batchResults = response.data.map((embedding, index) => ({
          embedding: embedding.embedding,
          tokens: response.usage?.total_tokens || 0,
          model: this.config.model,
        }));

        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chunk text into smaller pieces for embedding
   */
  static chunkText(
    text: string, 
    options: {
      maxChunkSize?: number;
      overlap?: number;
      separator?: string;
    } = {}
  ): string[] {
    const {
      maxChunkSize = 1000,
      overlap = 100,
      separator = '\n\n',
    } = options;

    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + maxChunkSize;
      
      // If we're not at the end, try to find a good break point
      if (endIndex < text.length) {
        // Look for separator within the last 20% of the chunk
        const searchStart = endIndex - Math.floor(maxChunkSize * 0.2);
        const lastSeparator = text.lastIndexOf(separator, endIndex);
        
        if (lastSeparator > searchStart) {
          endIndex = lastSeparator + separator.length;
        }
      }

      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Move start index, accounting for overlap
      startIndex = endIndex - overlap;
      if (startIndex >= text.length) break;
    }

    return chunks;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Health check for the embedding service
   */
  async healthCheck(): Promise<{
    status: string;
    model: string;
    apiKeyConfigured: boolean;
    testEmbedding?: boolean;
    mockMode?: boolean;
  }> {
    const result = {
      status: 'unknown',
      model: this.config.model,
      apiKeyConfigured: !!this.openai,
      testEmbedding: false,
      mockMode: this.mockMode,
    };

    if (this.mockMode) {
      result.status = 'healthy (mock mode)';
      result.testEmbedding = true;
      return result;
    }

    if (!this.openai) {
      result.status = 'error: no API key';
      return result;
    }

    try {
      // Test with a simple embedding
      await this.generateEmbedding('test');
      result.testEmbedding = true;
      result.status = 'healthy';
    } catch (error) {
      result.status = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return result;
  }

  /**
   * Get embedding service configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Update embedding service configuration
   */
  updateConfig(newConfig: Partial<EmbeddingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance for the application
export const embeddingService = new EmbeddingService();