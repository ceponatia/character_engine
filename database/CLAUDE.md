# Database Module - CLAUDE.md

## Module Purpose

This module handles all persistent data storage including character definitions, session states, conversation history, and vector-based semantic memory using PostgreSQL with pgvector extension.

## Responsibilities

### Schema Design & Management
- **Character Storage** - Character definitions, personality traits, relationship mappings
- **Vector Memory Storage** - Character memories with semantic embeddings using pgvector
- **User Management** - User profiles, preferences, authentication data
- **Session Management** - Session states, conversation history, temporal data

### Data Isolation & Security
- **Character Memory Isolation** - Character-specific memory filtering with proper foreign keys
- **Vector Embeddings** - Secure embedding storage with character isolation
- **Session Boundaries** - Secure session data separation and cleanup
- **User Data Protection** - Proper authentication and data access controls

### Performance Optimization
- **Vector Indexing** - HNSW indexes for efficient similarity search on embeddings
- **Connection Pooling** - PostgreSQL connection management for concurrent access
- **Query Optimization** - Efficient indexing for character state and memory retrieval
- **Memory Compression** - Automatic cleanup and pruning of old conversation data

### Data Integrity
- **Transaction Management** - ACID compliance for character state updates
- **Referential Integrity** - Foreign key constraints for character relationships
- **Vector Data Validation** - Schema validation for embeddings and character data
- **Backup Strategy** - PostgreSQL backup and disaster recovery planning

## Technical Stack
- **Database**: PostgreSQL 13+ with pgvector extension for vector operations
- **ORM**: Prisma Client with raw SQL for vector operations
- **Vector Operations**: pgvector with cosine distance for similarity search
- **Connection Management**: Prisma connection pooling
- **Migration System**: Prisma migrations for schema versioning

## Schema Structure

### Core Tables (Current Implementation)
```sql
-- User management
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Character definitions with complete personality data
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  chatbot_role TEXT NOT NULL,
  description TEXT,
  primary_traits JSONB DEFAULT '[]',
  tone JSONB DEFAULT '[]',
  vocabulary TEXT,
  approach TEXT,
  greeting TEXT,
  interruption_tolerance TEXT,
  full_bio TEXT, -- Complete character biography
  core_persona_summary TEXT, -- Condensed personality for prompts
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Vector-based character memories with pgvector
CREATE TABLE character_memories (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'bio_chunk', 'conversation', 'emotional_event'
  embedding vector(1536), -- OpenAI text-embedding-ada-002 vectors
  emotional_weight REAL DEFAULT 0.5,
  importance TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  day_number INTEGER,
  time_of_day TEXT,
  location TEXT,
  related_characters JSONB DEFAULT '[]',
  topics JSONB DEFAULT '[]',
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Vector similarity index for efficient search
CREATE INDEX character_memories_embedding_idx 
ON character_memories USING hnsw (embedding vector_cosine_ops);

-- Additional indexes for query optimization
CREATE INDEX character_memories_character_id_idx ON character_memories(character_id);
CREATE INDEX character_memories_memory_type_idx ON character_memories(memory_type);
CREATE INDEX character_memories_created_at_idx ON character_memories(created_at);

-- Session management (planned)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_scene TEXT,
  character_states JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings and locations (implemented)
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  environment_state JSONB DEFAULT '{}',
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

## Key Features Implemented
- ✅ Character definition storage with comprehensive personality data
- ✅ Vector-based memory storage using pgvector extension
- ✅ User management with proper foreign key relationships
- ✅ RAG-optimized schema for efficient similarity search
- ✅ Memory metadata with emotional weighting and importance
- ✅ Proper indexing for vector operations and relational queries
- ✅ Database migrations with Prisma for version control

## Database Commands
```bash
# Development workflow
npm run db:dev          # Apply schema changes and regenerate client
npm run db:migrate      # Create production migrations
npm run db:studio       # Open Prisma Studio GUI

# PostgreSQL-specific operations
psql chatbot -c "CREATE EXTENSION IF NOT EXISTS vector;"  # Enable pgvector
psql chatbot -c "SELECT version();"                       # Check PostgreSQL version
```

## Integration Points
- **Backend**: Prisma Client provides type-safe database access
- **Vector Memory**: pgvector enables efficient semantic search
- **Character Engine**: Character data and memory context retrieval
- **RAG System**: Vector similarity search for relevant memory retrieval
- **Session Manager**: Session state persistence and restoration (planned)

## Performance Considerations
- **Vector Indexes**: HNSW indexes provide O(log n) similarity search
- **Connection Pooling**: Prisma manages PostgreSQL connections efficiently
- **Query Optimization**: Proper indexes on foreign keys and search columns
- **Memory Pruning**: Automatic cleanup of old/low-importance memories

This module provides a robust, scalable foundation for the chatbot's data persistence with production-ready vector search capabilities using PostgreSQL and pgvector.