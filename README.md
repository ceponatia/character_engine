# RPG Chatbot

A sophisticated romantic chatbot framework with dynamic multi-character management, persistent memory, and intelligent character interactions.

## Quick Start

### Option 1: Using npm (Recommended)
```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev
```

### Option 2: Using the shell script
```bash
# Make script executable (first time only)
chmod +x start-dev.sh

# Start both servers
./start-dev.sh
```

### Option 3: Manual startup
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Character API**: http://localhost:3001/api/characters
- **Database Studio**: `npm run db:studio`

## Features

### Character Creation
- Comprehensive character builder with 7 sections:
  - Identity (name, archetype, role)
  - Appearance (description, attire, colors)
  - Voice & Style (tone, pacing, vocabulary)
  - Personality (traits, quirks, interruption tolerance)
  - Goals & Motivation
  - Interaction Style
  - Boundaries & Guidelines

### Database
- SQLite database with Prisma ORM
- Character definitions and state tracking
- Session management
- Message history with emotional context
- Memory system for character learning

### Test Data
- Sample character "Emma" (Nurturing Caregiver)
- Sample setting "Cozy Downtown Apartment"
- Ready for character communication testing

## Project Structure

```
chatbot/
├── frontend/          # Next.js React application
├── backend/           # Express.js API server
├── character-engine/  # Character behavior system
├── vector-memory/     # Memory management
├── session-manager/   # Session persistence
├── content-management/# User-created content
├── database/          # Database schemas
├── start-dev.sh       # Development startup script
└── package.json       # Root package management
```

## Database Commands

```bash
# View database in browser
npm run db:studio

# Seed with test data
npm run db:seed

# Reset database
cd backend && npm run db:reset
```

## Development Status

✅ **Completed**:
- Basic project structure
- Character builder interface
- Database schema and seeding
- Character creation API
- Frontend-backend integration

🔄 **Next Steps**:
- Mock character communication tests
- Personality guardrails system
- LLM integration (Ollama)
- Character state tracking
- Vector memory system