# Character Engine Module - CLAUDE.md

## Module Purpose

This module manages character behavior, personality consistency, state tracking, and AI response generation with personality guardrails. **Status: Updated for Supabase + pgvector Integration ✅**

## Responsibilities

### AI-Enhanced Personality Management
- **Vector Memory Retrieval** - Use pgvector similarity search for personality-consistent responses
- **Personality Guardrails** - Real-time personality consistency validation during response generation
- **Memory-Driven Behavior** - Character responses informed by AI embeddings and past interactions
- **Personality Drift Prevention** - Monitor long-term conversation patterns using vector analysis
- **Violation Recovery** - Regenerate responses that break character personality constraints

### Character State Tracking
- **Supabase Real-time State** - Live character state updates via Supabase subscriptions
- **Dynamic State Management** - Track mood, clothing, location, cleanliness, energy, arousal
- **Environmental Awareness** - Update character states based on environmental changes and events
- **Relationship Dynamics** - Manage character-to-character relationships with vector similarity
- **Goal-Driven Behavior** - Implement character motivations using AI memory retrieval

### AI Response Generation with Vector Memory
- **LLM Integration** - Ollama with 30-second timeouts and emergency kill mechanisms
- **RAG-Enhanced Context** - Combine character definition, vector memories, and conversation context
- **Memory Similarity Search** - Find relevant past experiences using pgvector cosine similarity
- **Response Validation** - Ensure responses match character personality and current state
- **Sequential Generation** - Manage one-at-a-time character response generation queue

### Character Interactions
- **Multi-Character Coordination** - Handle up to 3 simultaneous characters in scenes
- **Relationship Management** - Track and evolve character relationships over time
- **Conflict Resolution** - Manage romantic competition, jealousy, and character conflicts
- **Dynamic Appearances** - Determine when characters should enter/exit conversations

## Technical Stack (Updated December 2025)
- **Database**: Pure Supabase + pgvector for AI-native storage
- **AI Integration**: Ollama client with safety mechanisms (timeouts, kill switches)
- **Memory System**: Vector embeddings for personality-aware RAG
- **State Management**: Supabase real-time subscriptions for live updates
- **Validation Engine**: Custom personality constraint validation
- **Response Queue**: Sequential processing with priority management

## Character State Schema (Supabase + pgvector)
```typescript
// Supabase character with vector memory integration
interface CharacterWithMemories {
  // Core character data (from characters table)
  id: string;
  name: string;
  archetype: string;
  chatbot_role: string;
  primary_traits: string[];           // Native PostgreSQL array
  tone: string[];                     // Native PostgreSQL array
  colors: string[];                   // Native PostgreSQL array
  greeting: string;
  approach: string;
  patience: string;
  
  // AI-enhanced memories (from character_memories table)
  memories: {
    id: string;
    content: string;
    memory_type: string;              // 'personality', 'conversation', 'emotional_event'
    embedding: number[];              // pgvector(1536) for similarity search
    emotional_weight: number;         // 0.0-1.0 for memory importance
    importance: string;               // 'low', 'medium', 'high'
    topics: string[];                 // Native PostgreSQL array
    created_at: string;
  }[];
  
  // Current conversation context
  current_context: {
    mood: string;
    energy: number;
    recent_memories: string[];        // Retrieved via vector similarity
    relationship_strength: number;   // Calculated from interactions
    conversation_phase: string;      // 'introduction', 'building_rapport', 'intimate'
  };
}
```

## AI-Enhanced Features (Implemented)
- ✅ **Vector Memory Storage** - pgvector embeddings for character memories
- ✅ **Supabase Real-time** - Live database subscriptions ready
- ✅ **LLM Safety Mechanisms** - 30-second timeouts and emergency kill endpoints
- ✅ **Type-safe Operations** - Generated TypeScript types for all operations
- 🔄 **Personality Guardrails** - Enhanced with vector similarity validation
- 🔄 **Memory-driven Responses** - RAG integration with similarity search
- 🔄 **Real-time State Updates** - Supabase subscriptions for live character state

## Integration Points (Updated for Supabase)
- **Backend**: Supabase client for real-time character state synchronization
- **Database**: Pure Supabase with pgvector for AI-native character storage
- **Vector Memory**: pgvector similarity search for personality-consistent memory retrieval  
- **LLM**: Ollama with safety mechanisms and timeout protection
- **Session Manager**: Character state restoration using Supabase queries
- **Real-time**: Supabase subscriptions for live character state updates

## Next Implementation Steps
1. **Vector Similarity Functions** - Create custom SQL functions for memory search
2. **Real-time Subscriptions** - Connect character state to live updates
3. **Memory Ingestion Pipeline** - Import existing character data with embeddings
4. **Advanced RAG Integration** - Context-aware response generation
5. **Multi-character Orchestration** - Shared memory context for group conversations

This module now serves as an **AI-first character intelligence system** that leverages vector embeddings, real-time updates, and advanced memory retrieval for truly intelligent character interactions.