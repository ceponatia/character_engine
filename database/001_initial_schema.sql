-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension for ID generation (using newer gen_random_uuid)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Old extension, using gen_random_uuid() instead

-- Users table for multi-user support
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table - main character definitions
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identity
  source_material TEXT,
  archetype TEXT NOT NULL,
  chatbot_role TEXT NOT NULL,
  conceptual_age TEXT,
  
  -- RAG System - Character Bio Management
  full_bio TEXT, -- Complete biography for chunking and embedding
  core_persona_summary TEXT, -- Condensed personality summary
  
  -- Visual Avatar
  description TEXT,
  attire TEXT,
  colors TEXT[] DEFAULT '{}', -- PostgreSQL array
  features TEXT,
  image_url TEXT,
  avatar_image TEXT,
  
  -- Vocal Style
  tone TEXT[] DEFAULT '{}', -- PostgreSQL array
  pacing TEXT,
  inflection TEXT,
  vocabulary TEXT,
  
  -- Personality
  primary_traits TEXT[] DEFAULT '{}', -- PostgreSQL array
  secondary_traits TEXT[] DEFAULT '{}', -- PostgreSQL array
  quirks TEXT[] DEFAULT '{}', -- PostgreSQL array
  interruption_tolerance TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  
  -- Operational Directives
  primary_motivation TEXT,
  core_goal TEXT,
  secondary_goals TEXT[] DEFAULT '{}', -- PostgreSQL array
  
  -- Interaction Model
  core_abilities TEXT[] DEFAULT '{}', -- PostgreSQL array
  approach TEXT,
  patience TEXT,
  demeanor TEXT,
  adaptability TEXT,
  
  -- Signature Phrases
  greeting TEXT,
  affirmation TEXT,
  comfort TEXT,
  default_intro_message TEXT,
  
  -- Boundaries
  forbidden_topics TEXT[] DEFAULT '{}', -- PostgreSQL array
  interaction_policy TEXT,
  conflict_resolution TEXT,
  
  -- Relationships
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Character memories table with pgvector for RAG system
CREATE TABLE character_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Memory content
  content TEXT NOT NULL, -- The actual memory text chunk
  summary TEXT, -- Compressed summary for older memories
  memory_type TEXT NOT NULL, -- 'bio_chunk', 'conversation', 'observation', 'emotional_event', 'factual_knowledge'
  
  -- Vector embedding for semantic search (1536 dimensions for OpenAI text-embedding-ada-002)
  embedding vector(1536),
  
  -- Emotional significance
  emotional_weight FLOAT DEFAULT 0.5, -- 0.0 to 1.0
  importance TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  
  -- Context when memory was formed
  day_number INTEGER,
  time_of_day TEXT,
  location TEXT,
  
  -- Memory relationships
  related_characters TEXT[] DEFAULT '{}', -- PostgreSQL array
  topics TEXT[] DEFAULT '{}', -- PostgreSQL array
  
  -- Character this memory belongs to
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  
  -- Session this memory was created in (for story isolation)
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL
);

-- Settings table for reusable scenarios
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  plot TEXT, -- Overall scenario plot/story
  
  -- Setting metadata
  setting_type TEXT DEFAULT 'general', -- 'fantasy', 'modern', 'sci-fi', 'historical', 'general'
  time_of_day TEXT, -- Preferred time for this setting
  mood TEXT, -- Overall atmosphere/mood of the setting (TEXT, not array yet)
  theme TEXT, -- Genre or theme (TEXT, not array yet)
  image_url TEXT, -- Setting image URL
  
  -- Relationships
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table for reusable environments
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT, -- Main description
  setting_id UUID REFERENCES settings(id), -- Foreign key to settings
  atmosphere TEXT, -- Mood/atmosphere (single text field, not array)
  details JSONB DEFAULT '{}', -- Additional details as JSONB
  
  -- Relationships
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Setting-Location relationship table
CREATE TABLE setting_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID NOT NULL REFERENCES settings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setting_id, location_id)
);

-- Chat sessions for story-based conversations
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Auto-generated or user-defined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session configuration
  setting_id UUID REFERENCES settings(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  
  -- Relationships
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Simplified: Characters are directly linked to sessions via character_id

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' or 'character'
  character_id UUID, -- If sender is character, which character
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session relationship
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_characters_owner ON characters(owner_id);
CREATE INDEX idx_character_memories_character ON character_memories(character_id);
CREATE INDEX idx_character_memories_type ON character_memories(memory_type);
CREATE INDEX idx_character_memories_session_character ON character_memories(session_id, character_id);
CREATE INDEX idx_character_memories_embedding ON character_memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chat_sessions_character ON chat_sessions(character_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security (RLS) for multi-user support
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow users to access only their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own characters" ON characters FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own character memories" ON character_memories FOR ALL USING (
  EXISTS (SELECT 1 FROM characters WHERE characters.id = character_memories.character_id AND characters.owner_id = auth.uid())
);

CREATE POLICY "Users can manage own settings" ON settings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own locations" ON locations FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.chat_session_id AND chat_sessions.owner_id = auth.uid())
);