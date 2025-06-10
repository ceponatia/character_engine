import { createClient } from '@supabase/supabase-js';
import type { Database, Character, CharacterInsert, CharacterMemory } from '../types/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Database utility functions (replacing Prisma)
export class SupabaseDB {
  
  // Character operations
  static async getAllCharacters(userId?: string, options?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<Character[]> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = options || {};
    
    let query = supabase
      .from('characters')
      .select('*');
    
    // If userId provided, filter by owner
    if (userId) {
      query = query.eq('owner_id', userId);
    }
    
    // Add sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to fetch characters: ${error.message}`);
    return data || [];
  }

  static async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch character: ${error.message}`);
    }
    return data;
  }

  static async createCharacter(character: CharacterInsert): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create character: ${error.message}`);
    return data;
  }

  static async updateCharacter(id: string, updates: Partial<CharacterInsert>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update character: ${error.message}`);
    return data;
  }

  static async deleteCharacter(id: string): Promise<void> {
    // First delete character memories
    const { error: memoriesError } = await supabase
      .from('character_memories')
      .delete()
      .eq('character_id', id);
    
    if (memoriesError) throw new Error(`Failed to delete character memories: ${memoriesError.message}`);
    
    // Then delete the character
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete character: ${error.message}`);
  }

  // Character memory operations with pgvector
  static async getCharacterMemories(characterId: string, limit = 50): Promise<CharacterMemory[]> {
    const { data, error } = await supabase
      .from('character_memories')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to fetch memories: ${error.message}`);
    return data || [];
  }

  static async addCharacterMemory(memory: {
    characterId: string;
    content: string;
    memoryType: string;
    embedding?: number[];
    emotionalWeight?: number;
    importance?: string;
    topics?: string[];
  }): Promise<CharacterMemory> {
    const { data, error } = await supabase
      .from('character_memories')
      .insert({
        character_id: memory.characterId,
        content: memory.content,
        memory_type: memory.memoryType,
        embedding: memory.embedding,
        emotional_weight: memory.emotionalWeight || 0.5,
        importance: memory.importance || 'medium',
        topics: memory.topics || []
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to add memory: ${error.message}`);
    return data;
  }

  // Vector similarity search for RAG
  static async searchSimilarMemories(
    characterId: string, 
    queryEmbedding: number[], 
    threshold = 0.7, 
    limit = 10
  ): Promise<CharacterMemory[]> {
    // Custom SQL for vector similarity search
    const { data, error } = await supabase.rpc('search_character_memories', {
      character_id: characterId,
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      match_count: limit
    });
    
    if (error) {
      console.log('Vector search not available, falling back to text search');
      // Fallback to regular content search
      return this.getCharacterMemories(characterId, limit);
    }
    
    return data || [];
  }

  // Health check
  static async healthCheck(): Promise<{ status: string; tablesCount: number }> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      
      return {
        status: 'healthy',
        tablesCount: data ? 1 : 0
      };
    } catch (error) {
      return {
        status: 'error',
        tablesCount: 0
      };
    }
  }
}

// Legacy compatibility functions (to replace old Prisma calls)
export const connectDatabase = async () => {
  console.log('✅ Supabase client initialized (no connection needed)');
  return true;
};

export const disconnectDatabase = async () => {
  console.log('✅ Supabase client closed (no disconnection needed)');
  return true;
};

export const healthCheck = async () => {
  return SupabaseDB.healthCheck();
};

// Export the main utility class as default
export default SupabaseDB;