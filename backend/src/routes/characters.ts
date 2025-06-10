import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import SupabaseDB from '../utils/supabase-db';
import { transformCharacter, transformCharacterSummary, transformArray } from '../utils/field-transformer';
import type { CharacterInsert } from '../types/supabase';

const app = new Hono();

// Character creation validation schema
const createCharacterSchema = z.object({
  characterBio: z.object({
    name: z.string().min(1),
    identity: z.object({
      archetype: z.string().default(''),
      chatbotRole: z.string().default(''),
      sourceMaterial: z.string().optional(),
      conceptualAge: z.string().optional(),
    }).optional(),
    presentation: z.object({
      visualAvatar: z.object({
        description: z.string().optional(),
        attire: z.string().optional(),
        colors: z.array(z.string()).default([]),
        features: z.string().optional(),
        avatarImage: z.string().optional(),
      }).optional(),
      vocalStyle: z.object({
        tone: z.array(z.string()).default([]),
        pacing: z.string().optional(),
        inflection: z.string().optional(),
        vocabulary: z.string().optional(),
      }).optional(),
    }).optional(),
    personality: z.object({
      primaryTraits: z.array(z.string()).default([]),
      secondaryTraits: z.array(z.string()).default([]),
      quirks: z.array(z.string()).default([]),
      interruptionTolerance: z.string().default('medium'),
    }).optional(),
    operationalDirectives: z.object({
      primaryMotivation: z.string().optional(),
      coreGoal: z.string().optional(),
      secondaryGoals: z.array(z.string()).default([]),
    }).optional(),
    interactionModel: z.object({
      coreAbilities: z.array(z.string()).default([]),
      style: z.object({
        approach: z.string().optional(),
        patience: z.string().optional(),
        demeanor: z.string().optional(),
        adaptability: z.string().optional(),
      }).optional(),
      signaturePhrases: z.object({
        greeting: z.string().optional(),
        affirmation: z.string().optional(),
        comfort: z.string().optional(),
      }).optional(),
    }).optional(),
    boundaries: z.object({
      forbiddenTopics: z.array(z.string()).default([]),
      interactionPolicy: z.string().optional(),
      conflictResolution: z.string().optional(),
    }).optional(),
    defaultIntroMessage: z.string().optional(),
  })
});

// Create a new character
app.post('/', zValidator('json', createCharacterSchema), async (c) => {
  try {
    const { characterBio } = c.req.valid('json');
    
    // Map the nested structure to flat Supabase schema
    const characterData: CharacterInsert = {
      name: characterBio.name,
      archetype: characterBio.identity?.archetype || '',
      chatbot_role: characterBio.identity?.chatbotRole || '',
      source_material: characterBio.identity?.sourceMaterial,
      conceptual_age: characterBio.identity?.conceptualAge,
      
      // Visual Avatar
      description: characterBio.presentation?.visualAvatar?.description,
      attire: characterBio.presentation?.visualAvatar?.attire,
      colors: characterBio.presentation?.visualAvatar?.colors || [],
      features: characterBio.presentation?.visualAvatar?.features,
      avatar_image: characterBio.presentation?.visualAvatar?.avatarImage,
      
      // Vocal Style
      tone: characterBio.presentation?.vocalStyle?.tone || [],
      pacing: characterBio.presentation?.vocalStyle?.pacing,
      inflection: characterBio.presentation?.vocalStyle?.inflection,
      vocabulary: characterBio.presentation?.vocalStyle?.vocabulary,
      
      // Personality
      primary_traits: characterBio.personality?.primaryTraits || [],
      secondary_traits: characterBio.personality?.secondaryTraits || [],
      quirks: characterBio.personality?.quirks || [],
      interruption_tolerance: characterBio.personality?.interruptionTolerance || 'medium',
      
      // Operational Directives
      primary_motivation: characterBio.operationalDirectives?.primaryMotivation,
      core_goal: characterBio.operationalDirectives?.coreGoal,
      secondary_goals: characterBio.operationalDirectives?.secondaryGoals || [],
      
      // Interaction Model
      core_abilities: characterBio.interactionModel?.coreAbilities || [],
      approach: characterBio.interactionModel?.style?.approach,
      patience: characterBio.interactionModel?.style?.patience,
      demeanor: characterBio.interactionModel?.style?.demeanor,
      adaptability: characterBio.interactionModel?.style?.adaptability,
      
      // Signature Phrases
      greeting: characterBio.interactionModel?.signaturePhrases?.greeting,
      affirmation: characterBio.interactionModel?.signaturePhrases?.affirmation,
      comfort: characterBio.interactionModel?.signaturePhrases?.comfort,
      
      // Default intro message
      default_intro_message: characterBio.defaultIntroMessage,
      
      // Boundaries
      forbidden_topics: characterBio.boundaries?.forbiddenTopics || [],
      interaction_policy: characterBio.boundaries?.interactionPolicy,
      conflict_resolution: characterBio.boundaries?.conflictResolution,
    };

    const character = await SupabaseDB.createCharacter(characterData);

    return c.json({
      success: true,
      character: transformCharacterSummary(character)
    }, 201);
  } catch (error) {
    console.error('Error creating character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create character',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get all characters
app.get('/', async (c) => {
  try {
    const characters = await SupabaseDB.getAllCharacters();
    
    // Transform to frontend-compatible format using centralized transformer
    const transformedCharacters = transformArray(characters, transformCharacterSummary);

    return c.json({ characters: transformedCharacters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch characters' 
    }, 500);
  }
});

// Get a specific character by ID
app.get('/:id', async (c) => {
  try {
    const character = await SupabaseDB.getCharacterById(c.req.param('id'));

    if (!character) {
      return c.json({ 
        success: false, 
        error: 'Character not found' 
      }, 404);
    }

    // Transform to frontend-compatible format using centralized transformer
    const transformedCharacter = transformCharacter(character);

    return c.json({ character: transformedCharacter });
  } catch (error) {
    console.error('Error fetching character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch character' 
    }, 500);
  }
});

// Delete a character
app.delete('/:id', async (c) => {
  try {
    await SupabaseDB.deleteCharacter(c.req.param('id'));

    return c.json({ 
      success: true, 
      message: 'Character deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete character' 
    }, 500);
  }
});

// Character memory routes
app.get('/:id/memories', async (c) => {
  try {
    const memories = await SupabaseDB.getCharacterMemories(c.req.param('id'));
    return c.json({ memories });
  } catch (error) {
    console.error('Error fetching character memories:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch character memories' 
    }, 500);
  }
});

app.post('/:id/memories', async (c) => {
  try {
    const body = await c.req.json();
    const memory = await SupabaseDB.addCharacterMemory({
      characterId: c.req.param('id'),
      content: body.content,
      memoryType: body.memoryType || 'conversation',
      embedding: body.embedding,
      emotionalWeight: body.emotionalWeight,
      importance: body.importance,
      topics: body.topics
    });
    
    return c.json({ success: true, memory }, 201);
  } catch (error) {
    console.error('Error adding character memory:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to add character memory' 
    }, 500);
  }
});

export default app;