# Character Engine Module - CLAUDE.md

## Module Purpose

This module manages character behavior, personality consistency, state tracking, and AI response generation with personality guardrails.

## Responsibilities

### Personality Management
- **Personality Guardrails** - Real-time personality consistency validation during response generation
- **Behavioral Boundaries** - Prevent characters from acting outside defined personality parameters
- **Personality Drift Prevention** - Monitor long-term conversation patterns for consistency
- **Violation Recovery** - Regenerate responses that break character personality constraints

### Character State Tracking
- **Dynamic State Management** - Track mood, clothing, location, cleanliness, energy, arousal
- **Environmental Awareness** - Update character states based on environmental changes and events
- **Relationship Dynamics** - Manage character-to-character relationships and interactions
- **Goal-Driven Behavior** - Implement character motivations and goal-oriented actions

### AI Response Generation
- **LLM Integration** - Interface with Ollama/local AI models for character responses
- **Context Assembly** - Combine character definition, current state, memories, and conversation context
- **Response Validation** - Ensure responses match character personality and current state
- **Sequential Generation** - Manage one-at-a-time character response generation queue

### Character Interactions
- **Multi-Character Coordination** - Handle up to 3 simultaneous characters in scenes
- **Relationship Management** - Track and evolve character relationships over time
- **Conflict Resolution** - Manage romantic competition, jealousy, and character conflicts
- **Dynamic Appearances** - Determine when characters should enter/exit conversations

## Technical Stack
- **AI Integration**: Ollama client with OpenAI-compatible API
- **State Management**: In-memory state with database persistence
- **Validation Engine**: Custom personality constraint validation
- **Response Queue**: Sequential processing with priority management

## Character State Schema
```json
{
  "character_id": "emma",
  "personality_profile": {
    "primaryTraits": ["nurturing", "playful", "intelligent"],
    "interruptionTolerance": "medium",
    "goals": ["romantic_interest", "emotional_support"]
  },
  "current_state": {
    "mood": "curious",
    "energy": 75,
    "clothing": ["casual_dress", "sneakers"],
    "location": "living_room",
    "last_action": "reading_book"
  },
  "relationships": {
    "user": {"type": "romantic_interest", "strength": 0.7},
    "luna": {"type": "friend", "strength": 0.6}
  },
  "knowledge_base": {
    "user_facts": ["likes_coffee", "works_late"],
    "learned_events": ["user_stressed_about_work"]
  }
}
```

## Key Features to Implement
- Personality guardrails with constraint validation
- Real-time character state updates
- Multi-character conversation orchestration
- Relationship dynamics and goal-driven behavior
- Character appearance logic based on context and relationships
- Interruption handling based on character tolerance levels

## Integration Points
- **Backend**: Character state synchronization and response coordination
- **Database**: Character definition storage and state persistence
- **Vector Memory**: Memory retrieval for context injection
- **LLM**: Response generation with personality-aware prompts
- **Session Manager**: Character state restoration across sessions

This module serves as the core intelligence system that brings characters to life with consistent personalities, realistic behaviors, and engaging interactions.