# API Layer Transformation

## Overview

This document describes how to convert DB JSON strings to arrays for the frontend and strings for the backend.

```javascript
// Backend: Convert DB JSON strings to arrays for frontend
const parsedCharacter = {
  ...character,
  colors: JSON.parse(character.colors),
  tone: JSON.parse(character.tone),
  primaryTraits: JSON.parse(character.primaryTraits),
  secondaryTraits: JSON.parse(character.secondaryTraits),
  quirks: JSON.parse(character.quirks),
  secondaryGoals: JSON.parse(character.secondaryGoals),
  coreAbilities: JSON.parse(character.coreAbilities),
  forbiddenTopics: JSON.parse(character.forbiddenTopics)
};

// Frontend: Convert arrays to JSON strings for backend
const characterData = {
  // ... other fields
  colors: JSON.stringify(selectedColors),
  tone: JSON.stringify(selectedTones),
  primaryTraits: JSON.stringify(selectedTraits.slice(0, 3)),
  // ... etc
};
```