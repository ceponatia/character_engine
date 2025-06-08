# Vector Memory Module - CLAUDE.md

## Module Purpose

This module manages vector-based semantic memory storage and retrieval using PostgreSQL with pgvector extension for contextual conversation enhancement beyond LLM context limits.

## Responsibilities

### Memory Storage & Retrieval
- **Semantic Embeddings** - Convert conversation content to vector embeddings using OpenAI text-embedding-ada-002
- **Memory Categorization** - Store different types of memories (bio_chunk, conversation, emotional_event, factual_knowledge)
- **Character Isolation** - Maintain separate memory spaces per character for knowledge boundaries
- **Relevance Scoring** - Rank memories by vector similarity, emotional significance, and recency

### Memory Management
- **Hierarchical Storage** - Recent (full detail), summarized (compressed), archived (semantic clusters) tiers
- **Automatic Compression** - Gradual memory compression as interactions age beyond recent window
- **Memory Cleanup** - Archive or remove very old memories to maintain performance
- **Duplicate Prevention** - Avoid storing redundant or near-duplicate memories

### Contextual Retrieval
- **Dynamic Memory Injection** - Pull 3-5 most relevant memories per character per response using RAG
- **Context-Aware Search** - Vector similarity search based on current conversation context
- **Emotional Weighting** - Prioritize emotionally significant memories over mundane ones
- **Character Perspective** - Filter memories based on character knowledge and experience

### Performance Optimization
- **Vector Indexing** - Leverage PostgreSQL pgvector's HNSW indexing for efficient similarity search
- **Batch Processing** - Efficient batch embedding generation and storage
- **Connection Pooling** - Optimize PostgreSQL connections for vector operations
- **Scalability Management** - Handle up to ~10K interactions per character efficiently

## Technical Stack
- **Vector Database**: PostgreSQL with pgvector extension for vector similarity search
- **Embedding Model**: OpenAI text-embedding-ada-002 (1536 dimensions) with mock mode fallback
- **Vector Operations**: Cosine distance (`<->` operator) for memory retrieval
- **Data Format**: PostgreSQL records with vector embeddings in pgvector format
- **ORM**: Prisma with raw SQL for vector operations

## Memory Structure
```sql
CREATE TABLE character_memories (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'bio_chunk', 'conversation', 'emotional_event', 'factual_knowledge'
  embedding vector(1536), -- pgvector column for OpenAI embeddings
  emotional_weight REAL DEFAULT 0.5, -- 0-1 scale for significance
  importance TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  day_number INTEGER,
  time_of_day TEXT,
  location TEXT,
  related_characters JSONB DEFAULT '[]',
  topics JSONB DEFAULT '[]',
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Vector similarity index for efficient search
CREATE INDEX ON character_memories USING hnsw (embedding vector_cosine_ops);
```

## Key Features Implemented
- ✅ Character-specific memory collection in PostgreSQL
- ✅ Vector similarity search with relevance scoring using pgvector
- ✅ RAG-based context retrieval for LLM prompts
- ✅ Emotional weighting and importance scoring
- ✅ Mock mode support for development without OpenAI API
- ✅ Memory statistics and health monitoring
- ✅ Memory pruning and cleanup functionality

## Integration Points
- **Backend**: RAG retrieval service provides memory context for character responses
- **Database**: PostgreSQL with pgvector stores embeddings and metadata
- **Character Engine**: Memory-based context injection for personality consistency
- **LLM Integration**: Context injection for conversation generation via prompt building
- **Embedding Service**: OpenAI API integration with fallback mock mode

## RAG Implementation
The module implements a complete RAG (Retrieval-Augmented Generation) system:
- **Ingestion**: Character bios chunked and embedded for knowledge base
- **Retrieval**: Vector similarity search finds relevant memories for current context
- **Generation**: Retrieved context injected into LLM prompts for enhanced responses

This module enables rich, contextual responses based on accumulated relationship history and character knowledge, leveraging PostgreSQL's vector capabilities for production-ready performance.