# Backend Module - CLAUDE.md

## Module Purpose

This module provides the API server, request routing, and orchestration layer for the romantic chatbot system.

## Responsibilities

### API Management
- **RESTful Endpoints** - Character CRUD, session management, user authentication
- **WebSocket Server** - Real-time message delivery and presence tracking
- **Request Routing** - Route requests to appropriate service modules
- **Response Orchestration** - Coordinate multi-module responses

### System Integration
- **LLM Integration** - Interface with Ollama/local AI models via OpenAI-compatible API
- **Database Coordination** - Manage connections to PostgreSQL and vector databases
- **Character Engine Communication** - Route character state updates and personality validation
- **Session Management** - Handle session persistence and restoration

### Resource Management
- **Response Queue Management** - Sequential character response generation
- **GPU/CPU Allocation** - Resource management layer with graceful degradation
- **Rate Limiting** - Prevent system overload and manage concurrent users
- **Caching Strategy** - Cache frequent character states and conversation contexts

### Real-Time Coordination
- **Message Broadcasting** - WebSocket message distribution to clients
- **Typing Indicators** - Coordinate "character is typing" states
- **Presence Tracking** - Monitor user activity for ambient character actions
- **Interruption Logic** - Handle user interruptions of AI responses

## Technical Stack
- **Framework**: Node.js/Express with TypeScript
- **WebSocket**: Socket.io for real-time communication
- **Database**: PostgreSQL with Prisma ORM and pgvector extension
- **Vector DB**: PostgreSQL with pgvector for embeddings and similarity search
- **AI Integration**: Ollama v0.9.0 with local models + OpenAI embeddings

## Database Development Workflow

### For Schema Changes During Development:
```bash
# Use db:dev for development changes (faster, non-destructive when possible)
npm run db:dev

# Only use migrations for production-ready changes
npm run db:migrate

# Fresh start if database gets corrupted
npm run db:fresh
```

### Database Development Best Practices:
- PostgreSQL supports full DDL operations and migrations
- `db push` is still recommended for rapid development iteration
- Migrations provide version control and deployment consistency
- Use `db:dev` for development, migrations for production deployments

## ✅ LLM Integration Complete (June 2025)

### Implemented Features
- **Ollama Client** - Local LLM server integration with GPU support (NVIDIA RTX 4060)
- **Character Response Generation** - Dynamic prompt building from character personalities
- **WebSocket Chat Processing** - Real-time message handling with streaming responses
- **Character Context System** - Personality-aware conversation management
- **Health Monitoring** - LLM connectivity and model availability checks

### Available Models
- **TinyLlama** (637 MB) - Fast testing model, currently active
- **Nous-Hermes-2** (6.1 GB) - Target production model for uncensored responses
- **Phi3:mini** (2.2 GB) - Alternative quality option

### Service Architecture
- `services/llm.ts` - Ollama API client with error handling
- `services/character-engine.ts` - Character-specific response coordination
- `utils/prompt-builder.ts` - Dynamic prompt construction from character data
- `middleware/chat.ts` - WebSocket message processing with streaming support

### Configuration
```env
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="tinyllama"  # Currently active for testing
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=2048
```

## Key Features to Implement
- ✅ Character state synchronization across modules
- ✅ Sequential response generation queue
- ✅ WebSocket presence and typing indicators
- ✅ Vector memory integration (PostgreSQL with pgvector)
- Session state persistence coordination
- Personality guardrails validation routing

## Integration Points
- **Frontend**: WebSocket and REST API endpoints
- **Database**: Character and session data persistence
- **Vector Memory**: Memory retrieval and storage coordination
- **Character Engine**: Personality validation and state management
- **Content Management**: Character and scene definition access

This module serves as the central nervous system coordinating all chatbot functionality.

## 🚀 System Refinement Roadmap (June 2025)

### 🚨 Critical Issues - Week 1

#### Template Variable Processing Bug (High Priority)
**Issue**: `{{user}}` variables appearing in final responses, breaking immersion
**Impact**: Poor user experience, breaks roleplay immersion
**Solution**: Enhanced template processing pipeline in `character-engine.ts`
```typescript
private processMessageTemplates(message: string, sessionContext: any): string {
  return message
    .replace(/\{\{user\}\}/gi, sessionContext.userName || 'user')
    .replace(/\{\{character_name\}\}/gi, sessionContext.character.name)
    .replace(/\{\{location\}\}/gi, sessionContext.currentLocation || 'here')
    .replace(/\{\{time_of_day\}\}/gi, sessionContext.timeOfDay || 'now');
}
```

#### Romantic Roleplay Prompt Strategy
**Issue**: Generic prompts lack emotional depth for romantic scenarios
**Solution**: New `buildRomanticRoleplayPrompt()` strategy in `prompt-builder.ts`
- Emotional depth and atmospheric integration
- Relationship dynamics tracking
- Creative storytelling support
- Character-specific romantic context

### 📊 Data Management Optimization - Week 2-3

#### Session-Based Character Caching
**Current**: 3+ database queries per message (inefficient)
**Target**: 1 query per session with intelligent caching
**Implementation**: CharacterSessionManager class
```typescript
class CharacterSessionManager {
  private characterCache: Map<string, CharacterContext>;
  private conversationState: Map<string, ConversationMemory>;
}
```
**Expected Impact**: 50-70% reduction in response latency, 80% fewer database calls

#### Enhanced Data Flow Pipeline
**New Architecture**:
```
Frontend → Session Manager → Character Cache → Smart Prompt Builder → LLM → Response Quality Pipeline → Frontend
```

### 🎭 Response Quality Enhancement - Week 3-4

#### Post-Processing Pipeline
**Implementation**: ResponseQualityPipeline class
- Remove AI artifacts and meta-commentary
- Enforce character voice consistency 
- Validate emotional continuity
- Character personality trait enforcement

#### Dynamic Prompt Selection
**Intelligence**: Choose prompt strategy based on:
- Message sentiment analysis (romantic, casual, emotional, playful)
- Conversation phase (introduction, building rapport, intimate)
- Character personality compatibility
- User interaction history patterns

### 🧠 Advanced RAG Integration - Week 4+

#### Intelligent Memory Context
**Enhanced Features**:
- Relationship progression tracking in vector memory
- Emotional event weighting and prioritization
- Character-specific memory isolation improvements
- Conversation pattern learning and adaptation

#### Performance Optimizations
- Pre-compute character embeddings for faster similarity search
- Cache frequent conversation patterns and character responses
- Batch memory retrieval for related conversation contexts

### 🔮 Long-Term Vision (1-3 months)

#### Advanced Character Interaction System
- **Predictive Character Behavior**: AI learns individual character patterns
- **Dynamic Relationship Evolution**: Characters grow based on meaningful interactions
- **Multi-Character Orchestration**: Intelligent group conversation management
- **Environmental Storytelling**: Weather, time, location effects on behavior

#### Romantic Relationship Progression
- **Milestone Detection**: Automatic relationship progression tracking
- **Emotional Intimacy Levels**: Appropriate response adjustment based on closeness
- **Character Development**: Growth and change based on user interactions
- **Personalized Patterns**: Evolving conversation styles unique to each relationship

### 📈 Success Metrics

#### Immediate Impact (Week 1-2)
- **Template Fix**: 100% elimination of variable processing errors
- **Romantic Prompts**: 40-60% improvement in emotional depth and response quality

#### Medium-Term Impact (Week 2-4)
- **Caching System**: 50-70% faster responses, 80% fewer database calls
- **Quality Pipeline**: 90%+ character consistency, eliminate AI artifacts

#### Long-Term Impact (1-3 months)
- **User Engagement**: Measurable increase in session duration and return visits
- **Emotional Attachment**: User reports of genuine connection with characters
- **Relationship Depth**: Complex, evolving relationships that feel authentic

### 🎯 Implementation Priority

1. **Week 1**: Fix template variables + implement romantic prompt strategy
2. **Week 2**: Deploy session caching system
3. **Week 3**: Implement response quality pipeline
4. **Week 4+**: Advanced RAG integration and relationship progression

**Status**: Ready for implementation - Nous-Hermes2 provides the foundation for sophisticated romantic companion AI.