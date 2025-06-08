# CLAUDE.md - RPG Chatbot Project

**CRITICAL**: This file contains instructions you must follow. You are forgetful, so reference these patterns frequently and ask to re-read this file if you deviate from these standards. Always update the Current Development Status section in this file with what was accomplished during your last action.

## Project Plan & Main Tools
@PROJECT_PLAN.md
@BRANCHING_STRATEGY.md

## Database Schema Reference
@DATABASE_SCHEMA.md
@DEVELOPMENT_WORKFLOWS.md
@TROUBLESHOOTING.md
@TYPESCRIPT_INTERFACES.md
@API_TRANSFORMATION.md

## Project Overview

A sophisticated romantic chatbot framework with dynamic multi-character management, persistent memory, and intelligent character interactions. **Status: Frontend UI + LLM Integration Complete ✅**

**Tech Stack**: Next.js, **[MIGRATING]** Hono + Bun + TypeScript, **[MIGRATING]** Supabase + pgvector + Prisma, Ollama v0.9.0 (local LLM)

## 🚀 2025 TECH STACK UPGRADE PLAN

### PHASE 1: Supabase + pgvector Migration (HIGH PRIORITY)
**Target: AI-native database with vector embeddings for character memory**

### PHASE 2: Hono + Bun Backend Migration (HIGH PRIORITY) 
**Target: 10x performance improvement and edge deployment**

### PHASE 3: Frontend Enhancement (KEEPING Next.js)
**Target: Integrate with new backend APIs and real-time features**

## CURRENT: NATIVE POSTGRESQL ARRAY IMPLEMENTATION ✅

### Database Array Handling (Updated June 2025)
**PostgreSQL now uses native arrays - NO JSON transformation needed!**

```typescript
// ✅ Direct array usage - no transformation required
const character = await prisma.character.create({
  data: {
    name: "Luna",
    colors: ['midnight blue', 'silver', 'purple'],         // Direct array!
    primaryTraits: ['Mysterious', 'Intelligent', 'Caring'], // Direct array!
    tone: ['Enigmatic', 'Thoughtful'],                     // Direct array!
    // All array fields work directly
  }
});

// ✅ Frontend sends arrays directly
const characterData = {
  ...formData,
  colors: selectedColors,        // Direct array - no JSON.stringify!
  tone: selectedTones,          // Direct array - no JSON.stringify!
  primaryTraits: selectedTraits  // Direct array - no JSON.stringify!
};

// ✅ Backend returns arrays directly
res.json({ characters }); // Arrays remain as arrays throughout
```

### Benefits of Native Arrays
- **Zero transformation overhead** - Arrays stay as arrays
- **Type safety** - TypeScript types match database exactly
- **Better performance** - PostgreSQL native array operations
- **Simpler code** - No JSON.parse/stringify needed anywhere
- **Future-ready** - Works seamlessly with pgvector for similarity search

## 📋 DETAILED MIGRATION PLAN

### PHASE 1: Supabase + pgvector Setup

#### Prerequisites Installation
```bash
# Install Supabase CLI
npm install -g supabase
# Or via Bun (for future use)
bun install -g supabase
```

#### Migration Steps
```bash
# 1. Create Supabase project
supabase projects create chatbot-ai

# 2. Initialize local Supabase
supabase init

# 3. Enable pgvector extension
supabase db enable pgvector

# 4. Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres"

# 5. Update Prisma schema for vector support
# Add to schema.prisma:
# vector Unsupported("vector")?

# 6. Test migration
npx prisma db push
npx prisma generate
```

#### Benefits Gained
- **AI-Ready**: Native vector storage for character embeddings
- **Real-time**: Built-in subscriptions for live chat
- **Managed**: No PostgreSQL maintenance required
- **Scalable**: Auto-scaling database with connection pooling

### PHASE 2: Hono + Bun Backend Migration

#### Prerequisites Installation
```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash

# Add to path (if needed)
export PATH="$HOME/.bun/bin:$PATH"

# Install TypeScript definitions
bun add -d @types/bun typescript
```

#### Migration Strategy
```bash
# 1. Create new Hono backend alongside existing Express
mkdir backend-hono
cd backend-hono

# 2. Initialize Hono project
bun create hono .
# Choose 'bun' template

# 3. Install dependencies
bun install hono @hono/zod-validator prisma

# 4. Port Express routes to Hono gradually
# Start with /api/characters endpoint

# 5. Set up parallel development
# Express: port 3001 (existing)
# Hono: port 3002 (new)

# 6. Test performance and compatibility
# 7. Switch frontend to new backend
# 8. Deprecate Express backend
```

#### Performance Gains Expected
- **10x faster**: Hono benchmarks: 402,820 ops/sec vs Express
- **52,000 req/sec**: Bun vs 13,254 req/sec Node.js
- **Edge-ready**: Deploy to Cloudflare Workers/Vercel Edge
- **Type-safe**: End-to-end TypeScript with automatic inference

### PHASE 3: Frontend Integration (Next.js Enhancement)

#### Real-time Integration
```typescript
// Supabase real-time for character chat
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Subscribe to character message updates
supabase
  .channel('character_messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => updateChat(payload.new)
  )
  .subscribe()
```

#### API Integration Updates
```typescript
// Update API calls to use Hono backend
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-hono-backend.com/api'
  : 'http://localhost:3002/api'

// Hono provides automatic type inference
const response = await fetch(`${API_BASE}/characters`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(characterData)
})
```

## 🛠️ INSTALLATION & SETUP GUIDE

### Step 1: Supabase Setup
1. **Create account**: Visit [supabase.com](https://supabase.com)
2. **New project**: Create "chatbot-ai" project
3. **Get credentials**: Copy Project URL and API Key
4. **Enable pgvector**: Database → Extensions → pgvector

### Step 2: Environment Configuration
```bash
# Update .env files
cp .env.example .env

# Add Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_supabase_db_url
```

### Step 3: Bun Installation
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### Step 4: Migration Testing
```bash
# Create migration branch
git checkout -b migration/supabase-hono

# Test Supabase connection
npm run db:test-connection

# Test Bun performance
cd backend-hono && bun run dev
```

## 🚨 MIGRATION SAFETY PROTOCOLS

### Parallel Development Approach
- **Keep existing stack running** during migration
- **Port features incrementally** to reduce risk
- **A/B test performance** before full switch
- **Rollback plan** ready at each phase

### Testing Strategy
1. **Unit tests**: Port existing test suite to new stack
2. **Integration tests**: API compatibility verification  
3. **Performance tests**: Benchmark before/after
4. **User acceptance**: Test with real character interactions

### Risk Mitigation
- **Database backups**: Before any Supabase migration
- **Feature flags**: Toggle between old/new backend
- **Monitoring**: Set up alerts for new infrastructure
- **Documentation**: Update all guides for new stack

## File Structure & Key Locations

```
/frontend/
  /src/types/Character.ts       # TypeScript interfaces
  /src/components/CharacterBuilder/  # Character creation UI
  /app/custom.css              # Complete styling (NO Tailwind)
/backend/
  /src/models/Character.ts     # Prisma model definitions
  /src/services/character.ts   # Character CRUD operations
  /src/utils/character-transform.ts  # Transform utilities
  /prisma/schema.prisma        # Database schema
```

## Development Commands

```bash
# Database changes (ALWAYS use for development)
npm run db:dev              # Apply schema changes (fast, safe)
npx prisma generate         # Regenerate types after schema changes

# Type checking
npm run type-check          # Validate TypeScript

# Only use for production-ready changes
npm run db:migrate          # Create formal migration
```

### Start Development Servers (Background)
```bash
# Start backend in background
cd backend && npm run dev &

# Start frontend in background  
cd frontend && npm run dev &

# Check running processes
ps aux | grep node
```

## Architecture Rules

### Database Schema
- **PostgreSQL** with Prisma ORM (NOT SQLite)
- **JSON Arrays**: All array fields stored as JSON strings in database
- **Character Model**: 25+ fields including identity, visual, personality, boundaries

### Styling System
- **Custom CSS ONLY** - Tailwind completely removed due to config issues
- **File**: `/frontend/app/custom.css` (semantic class naming)
- **Classes**: `.btn-romantic-*`, `.card-romantic`, `.character-*`

### LLM Integration
- **Ollama v0.9.0** with local models (TinyLlama for testing, Nous-Hermes-2 for production)
- **WebSocket**: Real-time streaming responses via Socket.io
- **Character Engine**: Personality-aware AI via dynamic prompting

## Type Safety Enforcement

### Required Patterns
1. **Always transform data at API boundaries** using utility functions
2. **Use type guards** for runtime validation
3. **Define interfaces before implementation**
4. **Test transformations in isolation**

### Forbidden Patterns
1. **Never use `any` type** in character-related code
2. **Avoid direct database object usage** in frontend
3. **Don't skip JSON parsing validation**
4. **Never modify database schema** without running `npm run db:dev`

## Common Debugging Steps

### TypeScript Interface Mismatch
1. Check if character object transformed via `transformCharacterFromDB()`
2. Verify all array fields properly parsed from JSON strings
3. Confirm TypeScript interfaces match Prisma schema

### Database Connection Issues
1. Ensure PostgreSQL running with pgvector extension
2. Run `npx prisma generate` after schema changes
3. Check `.env` database connection string

### WebSocket/LLM Issues
1. Verify Ollama service running (`ollama list` to check models)
2. Check WebSocket connection in browser dev tools
3. Ensure character data properly formatted for prompt builder

## Essential Files to Read First

Before starting any work, **ALWAYS** read these files:
- `DATABASE_SCHEMA.md` - Schema and transformation rules
- `/backend/src/utils/character-transform.ts` - Transform utilities
- `/frontend/src/types/Character.ts` - TypeScript interfaces
- `/backend/prisma/schema.prisma` - Database model definitions

## Quick Reference Commands

```typescript
// Direct character creation - no transformation needed!
const newCharacter = await prisma.character.create({
  data: {
    name: data.name,
    colors: data.colors,              // Direct array
    primaryTraits: data.primaryTraits, // Direct array
    // All fields work directly
  }
});

// Direct character retrieval - arrays come back as arrays
const characters = await prisma.character.findMany();
res.json({ characters }); // Send directly to frontend

// Type validation still important
if (!Array.isArray(data.colors)) {
  throw new Error('Colors must be an array');
}
```

## Memories

- When pushing to github, you will add and commit for me and then instruct me to use git push origin main myself because it doesn't seem to let you do it.

## Current Development Status

### ✅ Complete
- Romantic dark theme UI with custom CSS
- Character builder (7-section wizard)
- PostgreSQL + Prisma setup with native array support
- Local LLM integration (Ollama)
- WebSocket chat infrastructure
- Character CRUD operations with native PostgreSQL arrays
- **NEW**: Migrated from JSON strings to native PostgreSQL arrays (June 2025)

### 🔄 Next Priorities (Updated Dec 2025)
- **PHASE 1**: Supabase + pgvector migration (AI-native database)
- **PHASE 2**: Hono + Bun backend migration (10x performance)
- **PHASE 3**: Real-time chat with vector memory integration
- Multi-character conversations (up to 3 simultaneous)
- Session save/load functionality with vector search

### 📋 Migration Readiness Status
- ✅ **Research complete**: Supabase + pgvector integration strategy
- ✅ **Research complete**: Hono + Bun performance benchmarks  
- ✅ **Planning complete**: Detailed migration roadmap with safety protocols
- 📋 **Next**: Begin Phase 1 - Supabase setup and pgvector enablement
- 🎯 **Goal**: AI-first architecture with 10x performance and native vector memory

**Current: Native arrays + Migration plan ready for 2025 AI-first stack!**