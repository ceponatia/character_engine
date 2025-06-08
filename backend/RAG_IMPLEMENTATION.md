# RAG System Implementation

## Overview

This document describes the Retrieval-Augmented Generation (RAG) system implemented for the chatbot project. The RAG system solves the critical problem of providing character-specific context to the LLM without overwhelming the context window with entire character sheets.

## Problem Statement

**Before RAG**: Sending entire character history with every API call was:
- ❌ Slow and expensive
- ❌ Hits token limits quickly
- ❌ Often counterproductive (too much irrelevant information)
- ❌ No intelligent context selection

**After RAG**: Smart context retrieval that:
- ✅ Provides only relevant character information
- ✅ Maintains character consistency
- ✅ Optimizes token usage
- ✅ Scales to large character backstories

## Architecture

### Hybrid Context Strategy

The RAG system uses a **Static Core + Dynamic Memories** approach:

1. **Core Persona (Static & Low-Token)**: 
   - Condensed 200-word personality summary
   - Sent with every prompt
   - Ensures consistent character voice

2. **Relevant Memories (Dynamic & Contextual)**:
   - 1-3 most relevant memory chunks
   - Retrieved via vector similarity search
   - Provides detailed, contextual information

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG System Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  Character Bio ──► Ingestion Service ──► Core Persona      │
│       │                   │                    │           │
│       │                   ▼                    │           │
│       │            Memory Chunks ──────────────┼──► Database│
│       │                   │                    │      │    │
│       │                   ▼                    │      │    │
│       │            Embeddings ─────────────────┘      │    │
│       │                                               │    │
│  User Message ──► Embedding Service ──► Query Vector  │    │
│                           │                           │    │
│                           ▼                           │    │
│                  Retrieval Service ◄──────────────────┘    │
│                           │                                │
│                           ▼                                │
│                  Relevant Memories                         │
│                           │                                │
│                           ▼                                │
│            Character Engine ──► RAG-Enhanced Prompt       │
│                           │                                │
│                           ▼                                │
│                     LLM Response                           │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Database Schema Updates

```sql
-- Character table additions
ALTER TABLE characters ADD COLUMN fullBio TEXT;
ALTER TABLE characters ADD COLUMN corePersonaSummary TEXT;

-- Character memories with vector embeddings
CREATE TABLE character_memories (
  id TEXT PRIMARY KEY,
  characterId TEXT NOT NULL,
  content TEXT NOT NULL,
  memoryType TEXT NOT NULL, -- 'bio_chunk', 'conversation', etc.
  embedding vector(1536),   -- OpenAI embedding dimensions
  emotionalWeight FLOAT DEFAULT 0.5,
  importance TEXT DEFAULT 'medium',
  -- ... other fields
);

-- Vector similarity index
CREATE INDEX ON character_memories USING ivfflat (embedding vector_cosine_ops);
```

### 2. Core Services

#### Embedding Service (`services/embedding.ts`)
- **Purpose**: Generate vector embeddings for text using OpenAI's text-embedding-ada-002
- **Features**: 
  - Single and batch embedding generation
  - Text chunking utilities
  - Cosine similarity calculations
  - Health checks and error handling

#### Character Ingestion Service (`services/character-ingestion.ts`)
- **Purpose**: Process character bios into RAG-optimized format
- **Process**:
  1. Build full bio from character database fields
  2. Generate condensed core persona summary (200 words)
  3. Chunk biography into semantic pieces (800 chars + 100 overlap)
  4. Generate embeddings for each chunk
  5. Store chunks and embeddings in database

#### RAG Retrieval Service (`services/rag-retrieval.ts`)
- **Purpose**: Intelligent memory retrieval using vector search
- **Features**:
  - Vector similarity search with pgvector
  - Emotional weighting and recency boost
  - Memory importance scoring
  - Memory pruning and management
  - Conversation memory storage

### 3. Character Engine Integration

The existing character engine was enhanced to support RAG:

```typescript
// RAG-enabled context retrieval
private async getConversationContext(
  characterId: string,
  userId: string,
  conversationId?: string,
  userMessage?: string
): Promise<ConversationContext> {
  if (this.config.useRAG && userMessage) {
    // Use RAG for intelligent context retrieval
    const ragContext = await ragRetrievalService.getCharacterContextForLLM(
      characterId,
      userMessage,
      { maxResults: 2, minSimilarity: 0.6 }
    );
    // Return RAG-enhanced context
  }
  // Fallback to traditional conversation history
}
```

### 4. RAG-Enhanced Prompt Building

```typescript
public static buildRAGEnhancedPrompt(
  character: CharacterPersonality,
  userMessage: string,
  context: ConversationContext
): string {
  const ragContext = context.ragContext;
  
  let prompt = `--- CORE PERSONA ---\n${ragContext.corePersona}\n\n`;
  
  if (ragContext.relevantMemories.length > 0) {
    prompt += `--- RELEVANT MEMORIES ---\n`;
    ragContext.relevantMemories.forEach(memory => {
      const label = memory.memoryType === 'bio_chunk' ? 'BACKGROUND' : memory.memoryType.toUpperCase();
      prompt += `${label}: ${memory.content}\n`;
    });
  }
  
  prompt += `INSTRUCTIONS: You are ${character.name}. Use the above context naturally. Stay in character.

User: ${userMessage}
${character.name}:`;

  return prompt;
}
```

## Usage Examples

### 1. Ingest Character Bio

```typescript
import { characterIngestionService } from './services/character-ingestion';

// Process a character's bio for RAG
const result = await characterIngestionService.ingestCharacterBio(characterId);
console.log(`Generated ${result.chunksCreated} memory chunks`);
console.log(`Core persona: ${result.corePersonaGenerated ? 'Yes' : 'No'}`);
```

### 2. Retrieve Character Context

```typescript
import { ragRetrievalService } from './services/rag-retrieval';

// Get intelligent context for a user message
const context = await ragRetrievalService.getCharacterContextForLLM(
  characterId,
  "Tell me about your appearance",
  { maxResults: 3, minSimilarity: 0.7 }
);

console.log(`Core persona: ${context.corePersona}`);
console.log(`Relevant memories: ${context.relevantMemories.length}`);
```

### 3. Generate RAG-Enhanced Response

```typescript
import { characterEngine } from './services/character-engine';

// Enable RAG and generate response
characterEngine.updateConfig({ useRAG: true });
const response = await characterEngine.generateCharacterResponse(
  characterId,
  userMessage,
  userId
);
```

## Configuration

### Environment Variables

```env
# Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://user:password@localhost:5432/chatbot?schema=public"

# OpenAI for embeddings
OPENAI_API_KEY="sk-your-openai-api-key"

# Ollama for LLM responses (unchanged)
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="tinyllama"
```

### RAG Configuration Options

```typescript
// Character Engine
characterEngine.updateConfig({
  useRAG: true,              // Enable RAG system
  promptStrategy: 'optimized', // Prompt strategy
  tokenBudget: 300           // Max context tokens
});

// RAG Retrieval
ragRetrievalService.updateConfig({
  maxResults: 3,             // Max memories per query
  minSimilarity: 0.7,        // Similarity threshold
  weightEmotional: true,     // Boost emotional memories
  boostRecent: true          // Boost recent memories
});
```

## Performance Characteristics

### Token Efficiency
- **Before**: 1000-3000 tokens per request (entire character sheet)
- **After**: 200-500 tokens per request (core persona + relevant chunks)
- **Savings**: 60-80% token reduction

### Response Quality
- **Consistency**: Core persona ensures stable character voice
- **Relevance**: Only contextually relevant information included
- **Scalability**: Works with massive character backstories

### Speed Impact
- **Embedding Generation**: ~50-200ms per query
- **Vector Search**: ~10-50ms with proper indexing
- **Total Overhead**: ~100-300ms additional per response
- **Benefit**: Much faster than processing large context windows

## Testing

Run the comprehensive RAG system test:

```bash
# Build the TypeScript code
npm run build

# Run the RAG system test
node test-rag-system.js
```

The test verifies:
- ✅ Service health checks
- ✅ Character bio ingestion
- ✅ Vector similarity search
- ✅ RAG-enhanced responses
- ✅ Memory storage and retrieval

## Migration Guide

### From SQLite to PostgreSQL

1. **Install PostgreSQL with pgvector**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Update database configuration**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/chatbot"
   ```

3. **Run schema migration**:
   ```bash
   npm run db:dev  # Apply new schema
   ```

4. **Install OpenAI dependency**:
   ```bash
   npm install openai
   ```

5. **Ingest existing characters**:
   ```typescript
   await characterIngestionService.ingestAllCharacters();
   ```

## Troubleshooting

### Common Issues

1. **"vector extension not found"**
   - Ensure pgvector is installed in PostgreSQL
   - Run `CREATE EXTENSION IF NOT EXISTS vector;`

2. **OpenAI API errors**
   - Verify OPENAI_API_KEY is set correctly
   - Check API quota and billing

3. **Slow vector queries**
   - Ensure proper indexing: `CREATE INDEX ON character_memories USING ivfflat (embedding vector_cosine_ops);`

4. **Empty RAG context**
   - Run character ingestion: `characterIngestionService.ingestCharacterBio(characterId)`
   - Check embedding generation logs

### Health Checks

```typescript
// Check all RAG services
const embeddingHealth = await embeddingService.healthCheck();
const ragHealth = await ragRetrievalService.healthCheck();
const ingestionHealth = await characterIngestionService.healthCheck();
```

## Future Enhancements

### Planned Features
- **Cross-character memory sharing** for relationship tracking
- **Conversation memory consolidation** for long-term storage
- **Advanced memory scoring** with user preference learning
- **Memory categorization** for better retrieval
- **Performance optimization** with caching and precomputed similarities

### Advanced Configurations
- **Multi-model embeddings** for different content types
- **Hybrid search** combining vector and keyword search
- **Dynamic chunk sizing** based on content type
- **Memory importance learning** from user interactions

---

**Status**: ✅ Production Ready
**Last Updated**: June 2025
**Next Review**: When implementing multi-character conversations