/**
 * Centralized Field Transformation Utility
 * Converts snake_case database fields to camelCase for frontend consumption
 */


/**
 * Convert snake_case string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform object keys from snake_case to camelCase
 */
function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(value);
    }
    
    return transformed;
  }
  
  return obj;
}

/**
 * Character-specific field transformations
 */
export function transformCharacter(character: any): any {
  if (!character) return null;
  
  const transformed = {
    // Core identity
    id: character.id,
    name: character.name,
    createdAt: character.created_at,
    updatedAt: character.updated_at,
    ownerId: character.owner_id,
    
    // Identity
    sourceMaterial: character.source_material,
    archetype: character.archetype,
    chatbotRole: character.chatbot_role,
    conceptualAge: character.conceptual_age,
    
    // Visual Avatar
    description: character.description,
    attire: character.attire,
    colors: character.colors || [],
    features: character.features,
    imageUrl: character.image_url,
    
    // Vocal Style
    tone: character.tone || [],
    pacing: character.pacing,
    inflection: character.inflection,
    vocabulary: character.vocabulary,
    
    // Personality
    primaryTraits: character.primary_traits || [],
    secondaryTraits: character.secondary_traits || [],
    quirks: character.quirks || [],
    interruptionTolerance: character.interruption_tolerance,
    
    // Operational Directives
    primaryMotivation: character.primary_motivation,
    coreGoal: character.core_goal,
    secondaryGoals: character.secondary_goals || [],
    
    // Interaction Model
    coreAbilities: character.core_abilities || [],
    approach: character.approach,
    patience: character.patience,
    demeanor: character.demeanor,
    adaptability: character.adaptability,
    
    // Signature Phrases
    greeting: character.greeting,
    affirmation: character.affirmation,
    comfort: character.comfort,
    defaultIntroMessage: character.default_intro_message,
    
    // Boundaries
    forbiddenTopics: character.forbidden_topics || [],
    interactionPolicy: character.interaction_policy,
    conflictResolution: character.conflict_resolution
  };
  
  return transformed;
}

/**
 * Character summary transformation (for lists)
 */
export function transformCharacterSummary(character: any): any {
  if (!character) return null;
  
  return {
    id: character.id,
    name: character.name,
    archetype: character.archetype,
    chatbotRole: character.chatbot_role,
    description: character.description,
    createdAt: character.created_at,
    updatedAt: character.updated_at,
    primaryTraits: character.primary_traits || [],
    colors: character.colors || [],
    tone: character.tone || [],
    imageUrl: character.image_url,
    ownerId: character.owner_id
  };
}

/**
 * Setting-specific field transformations
 */
export function transformSetting(setting: any): any {
  if (!setting) return null;
  
  const transformed = {
    id: setting.id,
    name: setting.name,
    description: setting.description,
    plot: setting.plot,
    settingType: setting.setting_type,
    timeOfDay: setting.time_of_day,
    mood: setting.mood,
    theme: setting.theme,
    imageUrl: setting.image_url,
    ownerId: setting.owner_id,
    createdAt: setting.created_at,
    updatedAt: setting.updated_at,
    
    // Handle nested locations if present
    locations: setting.setting_locations?.map((sl: any) => transformLocation(sl.locations)) || 
               setting.locations || []
  };
  
  return transformed;
}

/**
 * Location-specific field transformations
 */
export function transformLocation(location: any): any {
  if (!location) return null;
  
  return {
    id: location.id,
    name: location.name,
    description: location.description,
    settingId: location.setting_id,
    atmosphere: location.atmosphere,
    details: location.details || {},
    ownerId: location.owner_id,
    createdAt: location.created_at,
    updatedAt: location.updated_at,
    
    // Handle nested setting if present
    setting: location.settings ? transformSetting(location.settings) : null
  };
}

/**
 * Chat session-specific field transformations (legacy)
 */
export function transformChatSession(session: any): any {
  if (!session) return null;
  
  return {
    id: session.id,
    name: session.name,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    lastActivity: session.last_activity,
    settingId: session.setting_id,
    ownerId: session.owner_id,
    characterId: session.character_id,
    
    // Handle nested relations
    character: session.characters ? transformCharacterSummary(session.characters) : null,
    setting: session.settings ? transformSetting(session.settings) : null,
    messages: session.messages?.map((msg: any) => transformChatMessage(msg)) || []
  };
}

/**
 * Story-specific field transformations (replaces chat session)
 */
export function transformStory(story: any): any {
  if (!story) return null;
  
  return {
    id: story.id,
    name: story.name,
    createdAt: story.created_at,
    updatedAt: story.updated_at,
    lastActivity: story.last_activity,
    settingId: story.setting_id,
    ownerId: story.owner_id,
    characterId: story.character_id,
    
    // Handle nested relations
    character: story.characters ? transformCharacterSummary(story.characters) : null,
    settings: story.settings ? transformSetting(story.settings) : null,
    messages: story.messages?.map((msg: any) => transformStoryMessage(msg)) || []
  };
}

/**
 * Chat message-specific field transformations (legacy)
 */
export function transformChatMessage(message: any): any {
  if (!message) return null;
  
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    characterId: message.character_id,
    timestamp: message.timestamp,
    chatSessionId: message.chat_session_id
  };
}

/**
 * Story message-specific field transformations (replaces chat message)
 */
export function transformStoryMessage(message: any): any {
  if (!message) return null;
  
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    characterId: message.character_id,
    timestamp: message.timestamp,
    storyId: message.story_id
  };
}

/**
 * Character memory-specific field transformations
 */
export function transformCharacterMemory(memory: any): any {
  if (!memory) return null;
  
  return {
    id: memory.id,
    createdAt: memory.created_at,
    content: memory.content,
    summary: memory.summary,
    memoryType: memory.memory_type,
    embedding: memory.embedding,
    emotionalWeight: memory.emotional_weight,
    importance: memory.importance,
    dayNumber: memory.day_number,
    timeOfDay: memory.time_of_day,
    location: memory.location,
    relatedCharacters: memory.related_characters || [],
    topics: memory.topics || [],
    characterId: memory.character_id,
    sessionId: memory.session_id
  };
}

/**
 * Generic transformation for any object
 * Use this for objects where you want automatic snake_case -> camelCase conversion
 */
export function transformGeneric(obj: any): any {
  return transformKeys(obj);
}

/**
 * Transform arrays of objects
 */
export function transformArray<T>(
  items: any[], 
  transformer: (item: any) => T
): T[] {
  return items?.map(transformer) || [];
}

/**
 * Main transformation router - automatically detects type and applies appropriate transformation
 */
export function autoTransform(data: any, context?: string): any {
  if (!data) return null;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => autoTransform(item, context));
  }
  
  // Detect object type based on fields present
  if (typeof data === 'object') {
    // Character detection
    if (data.chatbot_role || data.primary_traits || data.avatar_image) {
      return transformCharacter(data);
    }
    
    // Setting detection  
    if (data.setting_type || data.time_of_day || (data.theme && data.mood)) {
      return transformSetting(data);
    }
    
    // Location detection
    if (data.setting_id && data.atmosphere && data.details) {
      return transformLocation(data);
    }
    
    // Chat session detection
    if (data.last_activity && data.character_id) {
      return transformChatSession(data);
    }
    
    // Chat message detection
    if (data.chat_session_id && data.sender && data.content) {
      return transformChatMessage(data);
    }
    
    // Character memory detection
    if (data.memory_type && data.emotional_weight) {
      return transformCharacterMemory(data);
    }
    
    // Fallback to generic transformation
    return transformGeneric(data);
  }
  
  return data;
}

// Export all transformers
export default {
  transformCharacter,
  transformCharacterSummary,
  transformSetting,
  transformLocation,
  transformChatSession,
  transformChatMessage,
  transformCharacterMemory,
  transformGeneric,
  transformArray,
  autoTransform
};