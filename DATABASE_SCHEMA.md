# Database Schema

## Overview
This document details the Prisma database schema for character entries.

## Character Model

### Database Schema (Prisma)
```prisma
model Character {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Identity
  sourceMaterial String?
  archetype     String
  chatbotRole   String
  conceptualAge String?

  // Visual Avatar
  description String?
  attire      String?
  colors      String @default("[]") // JSON array
  features    String?
  imageUrl    String? // For character images

  // Vocal Style
  tone        String @default("[]") // JSON array
  pacing      String?
  inflection  String?
  vocabulary  String?

  // Personality
  primaryTraits          String @default("[]") // JSON array
  secondaryTraits        String @default("[]") // JSON array
  quirks                 String @default("[]") // JSON array
  interruptionTolerance  String   // "high", "medium", "low"

  // Operational Directives
  primaryMotivation String?
  coreGoal         String?
  secondaryGoals   String @default("[]") // JSON array

  // Interaction Model
  coreAbilities String @default("[]") // JSON array
  approach     String?
  patience     String?
  demeanor     String?
  adaptability String?

  // Signature Phrases
  greeting    String?
  affirmation String?
  comfort     String?

  // Boundaries
  forbiddenTopics     String @default("[]") // JSON array
  interactionPolicy   String?
  conflictResolution  String?

  // Relationships
  owner   User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId String
}
```

## Critical Rules for Expansion

1. **Database Arrays**: Always stored as JSON strings in SQLite
2. **API Parsing**: Backend MUST parse JSON strings to arrays before sending to frontend
3. **Frontend Submission**: Frontend MUST stringify arrays before sending to backend
4. **Type Safety**: Keep TypeScript interfaces in sync with database schema
5. **New Fields**: 
   - Add to Prisma schema first
   - Run `npm run db:push` to update database
   - Update TypeScript interfaces
   - Update API parsing logic
   - Update frontend forms

## Field Addition Checklist

When adding new fields:

- [ ] Add to Prisma schema with appropriate type
- [ ] Update database with `npm run db:push`
- [ ] Add to TypeScript interface
- [ ] Update API parsing (if array type)
- [ ] Update frontend forms
- [ ] Update character profile display
- [ ] Test API endpoints
- [ ] Update seed data if applicable