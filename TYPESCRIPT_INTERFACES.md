# Database Schema

## Overview
This document details the Typescript interfaces used with the DATABASE_SCHEMA.md character entries.

### TypeScript Interface (Frontend)
```typescript
interface Character {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Identity
  sourceMaterial?: string;
  archetype: string;
  chatbotRole: string;
  conceptualAge?: string;
  
  // Visual Avatar
  description?: string;
  attire?: string;
  colors: string[];        // Parsed from JSON
  features?: string;
  imageUrl?: string;       // NEW: Character image
  
  // Vocal Style
  tone: string[];          // Parsed from JSON
  pacing?: string;
  inflection?: string;
  vocabulary?: string;
  
  // Personality
  primaryTraits: string[];     // Parsed from JSON
  secondaryTraits: string[];   // Parsed from JSON
  quirks: string[];            // Parsed from JSON
  interruptionTolerance: string;
  
  // Operational Directives
  primaryMotivation?: string;
  coreGoal?: string;
  secondaryGoals: string[];    // Parsed from JSON
  
  // Interaction Model
  coreAbilities: string[];     // Parsed from JSON
  approach?: string;
  patience?: string;
  demeanor?: string;
  adaptability?: string;
  
  // Signature Phrases
  greeting?: string;
  affirmation?: string;
  comfort?: string;
  
  // Boundaries
  forbiddenTopics: string[];   // Parsed from JSON
  interactionPolicy?: string;
  conflictResolution?: string;
}
```