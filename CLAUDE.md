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

**Tech Stack**: Next.js, Node.js/Express + TypeScript, PostgreSQL + Prisma, Ollama v0.9.0 (local LLM)

## NATIVE POSTGRESQL ARRAY IMPLEMENTATION ✅

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

### 🔄 Next Priorities
- Vector database memory integration (PostgreSQL + pgvector)
- Multi-character conversations (up to 3 simultaneous)
- Session save/load functionality
- Character memory isolation system

**Database now uses native arrays - no JSON transformation needed anywhere!**