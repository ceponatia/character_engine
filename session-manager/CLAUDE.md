# Session Manager Module - CLAUDE.md

## Module Purpose

This module handles session lifecycle management, state persistence, save/load functionality, and temporal progression within conversations.

## Responsibilities

### Session Lifecycle
- **Session Creation** - Initialize new conversation sessions with character and scene selection
- **State Persistence** - Continuous saving of session state after every user prompt
- **Session Restoration** - Load and restore complete session state including character states and conversation history
- **Session Cleanup** - Archive old sessions and manage storage efficiency

### Temporal Management
- **Time Progression** - Story-driven time advancement through user triggers and events
- **Day/Time Tracking** - Sequential day numbering and time period management (morning, afternoon, evening, night)
- **Character Turn Completion** - Allow characters to complete actions when user triggers time progression
- **Environmental State** - Coordinate time-based environmental changes across scenes

### Save/Load System
- **Session Snapshots** - Complete world state preservation including character states, conversation history, and environmental conditions
- **Save File Management** - User-friendly save file naming, organization, and deletion
- **Quick Save/Load** - Rapid session state preservation and restoration
- **Session History** - Track session progression and allow rollback to previous states

### State Coordination
- **Cross-Module Synchronization** - Coordinate state updates across character engine, database, and vector memory
- **Consistency Management** - Ensure all modules have synchronized view of session state
- **Conflict Resolution** - Handle state conflicts during restoration
- **Memory Persistence** - Coordinate character memories across session boundaries

## Technical Stack
- **State Management**: Comprehensive session state objects with JSON serialization
- **Database Integration**: Session table management with efficient storage
- **File System**: Optional file-based save system for user exports
- **Coordination Layer**: Module communication for state synchronization

## Session State Schema
```json
{
  "session_id": "uuid",
  "session_name": "Evening with Emma and Luna",
  "created_at": "2024-01-15T20:00:00Z",
  "last_saved": "2024-01-15T22:30:00Z",
  "temporal_state": {
    "current_day": 3,
    "time_period": "evening",
    "weather": "raining",
    "season": "autumn"
  },
  "active_scene": {
    "scene_id": "cozy_apartment_living_room",
    "environment_state": {
      "lighting": "dim",
      "ambiance": "romantic",
      "privacy_level": "high"
    }
  },
  "active_characters": [
    {
      "character_id": "emma",
      "current_state": { /* character state object */ },
      "last_action": "sitting_on_couch_reading"
    }
  ],
  "conversation_context": {
    "recent_messages": [ /* last 15 messages */ ],
    "conversation_summary": "Intimate evening conversation about relationships",
    "emotional_tone": "romantic_tension"
  },
  "user_state": {
    "location": "living_room_couch",
    "last_action": "listening_to_emma",
    "mood": "relaxed"
  }
}
```

## Key Features to Implement
- Continuous session state auto-saving after user prompts
- Complete session restoration with all character states
- Time progression triggers and character turn completion
- Session history and rollback capabilities
- Save file export/import for user session management
- Cross-module state synchronization

## Integration Points
- **Backend**: Session state coordination and save/load API endpoints
- **Database**: Session data persistence and retrieval
- **Character Engine**: Character state synchronization across sessions
- **Vector Memory**: Memory persistence and restoration
- **Frontend**: Save/load UI and session management interface

This module ensures seamless continuity of the romantic chatbot experience across multiple sessions while managing complex temporal and state progression.