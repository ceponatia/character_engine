# Content Management Module - CLAUDE.md

## Module Purpose

This module handles user-generated content creation, storage, and management including character definitions, scene creation, and scenario templates.

## Responsibilities

### Character Content Management
- **Character Creation** - User interface and validation for comprehensive character definitions
- **Character Templates** - Pre-built character archetypes and personality templates
- **Character Editing** - Modification of existing character profiles and personality traits
- **Character Sharing** - Import/export functionality for character definitions (future feature)

### Scene & Environment Management
- **Scene Creation** - User tools for creating custom locations and environments
- **Hierarchical Locations** - Tree-structure scene management with parent/child relationships
- **Environmental Presets** - Pre-built scene templates (apartment, café, park, etc.)
- **Scene State Templates** - Time-based and weather-based environmental configurations

### Scenario Management
- **Scenario Templates** - Pre-written story scenarios and conversation starters
- **Mix & Match System** - Allow users to combine different characters, scenes, and scenarios
- **Scenario Import** - Load community-created or pre-built scenarios
- **Custom Scenarios** - User tools for creating personalized story setups

### Content Validation & Organization
- **Schema Validation** - Ensure character and scene definitions meet system requirements
- **Content Organization** - Categorization and tagging system for user content
- **Search & Discovery** - Find characters, scenes, and scenarios by tags and attributes
- **Version Management** - Track changes to character definitions and scenes over time

## Technical Stack
- **Forms & Validation**: React Hook Form with JSON schema validation
- **File Management**: JSON-based content storage with schema validation
- **UI Components**: Rich form builders for character and scene creation
- **Content Storage**: Database integration for persistent content management

## Character Definition Schema
```json
{
  "characterBio": {
    "name": "Character Name",
    "identity": {
      "sourceMaterial": "Original or inspired source",
      "archetype": "Core personality archetype",
      "chatbotRole": "Primary function in conversations"
    },
    "personality": {
      "primaryTraits": ["trait1", "trait2"],
      "interruptionTolerance": "high|medium|low",
      "goals": ["romantic_interest", "emotional_support"]
    },
    "boundaries": {
      "forbiddenTopics": ["topic1", "topic2"],
      "interactionPolicy": "SFW|NSFW",
      "conflictResolution": "approach_to_disagreements"
    }
  }
}
```

## Scene Definition Schema
```json
{
  "scene": {
    "name": "Scene Name",
    "description": "Detailed scene description",
    "type": "indoor|outdoor|vehicle|abstract",
    "privacy_level": "public|semi_private|private|intimate",
    "connected_scenes": ["scene_id1", "scene_id2"],
    "environmental_states": {
      "default": {
        "lighting": "bright|dim|dark",
        "weather": "sunny|cloudy|raining|snowing",
        "time_associations": ["morning", "evening"]
      }
    },
    "character_access": {
      "default_allowed": true,
      "restricted_characters": [],
      "access_requirements": "relationship_level|invitation|key"
    }
  }
}
```

## Key Features to Implement
- Comprehensive character creation wizard with trait dropdowns
- Scene builder with environmental state management
- Scenario template system with mix-and-match functionality
- Content validation and schema enforcement
- Search and organization tools for user content
- Import/export functionality for sharing content

## Integration Points
- **Frontend**: Character and scene creation UI components
- **Database**: Content storage and retrieval for characters, scenes, scenarios
- **Character Engine**: Character definition validation and loading
- **Session Manager**: Scene and character selection for session initialization
- **Backend**: Content management API endpoints and validation

This module empowers users to create rich, personalized content that drives engaging and customized romantic chatbot experiences.