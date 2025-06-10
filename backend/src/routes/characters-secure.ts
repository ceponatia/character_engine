import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { 
  sanitizeInput, 
  validateBody, 
  validateParams, 
  characterSchema, 
  idParamSchema,
  paginationSchema 
} from '../middleware/validation';
import { 
  asyncHandler, 
  NotFoundError, 
  ForbiddenError,
  ValidationError 
} from '../middleware/error-handler';
import { createRateLimit } from '../middleware/rate-limit';
import SupabaseDB from '../utils/supabase-db';
import { transformCharacter, transformCharacterSummary, transformCharacterMemory, transformArray } from '../utils/field-transformer';
import type { CharacterInsert, Character } from '../types/supabase';

const app = new Hono();

// Apply authentication to all character routes
app.use('*', authMiddleware);

// Apply input sanitization to all POST/PUT routes
app.use('/', sanitizeInput);
app.use('/:id', sanitizeInput);

// Get all characters for the authenticated user
app.get('/', asyncHandler(async (c) => {
  const userId = c.get('userId');
  const query = c.req.query();
  
  // Validate pagination parameters
  const { page, limit, sort, order } = paginationSchema.parse({
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    order: query.order
  });
  
  const characters = await SupabaseDB.getAllCharacters(userId, {
    page,
    limit,
    sort,
    order
  });
  
  const transformedCharacters = transformArray(characters, transformCharacterSummary);
  
  return c.json({
    success: true,
    data: transformedCharacters,
    pagination: {
      page,
      limit,
      total: transformedCharacters.length
    }
  });
}));

// Get a specific character by ID
app.get('/:id', 
  validateParams(idParamSchema),
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const userId = c.get('userId');
    
    const character = await SupabaseDB.getCharacterById(id);
    
    if (!character) {
      throw NotFoundError('Character');
    }
    
    // Ensure user owns this character
    if (character.owner_id !== userId) {
      throw ForbiddenError('You do not have access to this character');
    }
    
    return c.json({
      success: true,
      data: transformCharacter(character)
    });
  })
);

// Create a new character
app.post('/',
  createRateLimit, // Stricter rate limiting for creation
  validateBody(characterSchema),
  asyncHandler(async (c) => {
    const characterData = c.get('validatedBody') as CharacterInsert;
    const userId = c.get('userId');
    
    // Add owner ID to character data
    const characterWithOwner: CharacterInsert = {
      ...characterData,
      owner_id: userId
    };
    
    const character = await SupabaseDB.createCharacter(characterWithOwner);
    
    return c.json({
      success: true,
      data: transformCharacterSummary(character)
    }, 201);
  })
);

// Update a character
app.put('/:id',
  validateParams(idParamSchema),
  validateBody(characterSchema.partial()), // Allow partial updates
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const updates = c.get('validatedBody');
    const userId = c.get('userId');
    
    // Check if character exists and user owns it
    const existingCharacter = await SupabaseDB.getCharacterById(id);
    
    if (!existingCharacter) {
      throw NotFoundError('Character');
    }
    
    if (existingCharacter.owner_id !== userId) {
      throw ForbiddenError('You do not have permission to update this character');
    }
    
    const updatedCharacter = await SupabaseDB.updateCharacter(id, updates);
    
    return c.json({
      success: true,
      data: transformCharacter(updatedCharacter)
    });
  })
);

// Delete a character
app.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const userId = c.get('userId');
    
    // Check if character exists and user owns it
    const existingCharacter = await SupabaseDB.getCharacterById(id);
    
    if (!existingCharacter) {
      throw NotFoundError('Character');
    }
    
    if (existingCharacter.owner_id !== userId) {
      throw ForbiddenError('You do not have permission to delete this character');
    }
    
    await SupabaseDB.deleteCharacter(id);
    
    return c.json({
      success: true,
      message: 'Character deleted successfully'
    });
  })
);

// Get character memories (for AI context)
app.get('/:id/memories',
  validateParams(idParamSchema),
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const userId = c.get('userId');
    const query = c.req.query();
    
    // Verify ownership
    const character = await SupabaseDB.getCharacterById(id);
    if (!character || character.owner_id !== userId) {
      throw NotFoundError('Character');
    }
    
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const memories = await SupabaseDB.getCharacterMemories(id, limit);
    
    return c.json({
      success: true,
      data: transformArray(memories, transformCharacterMemory)
    });
  })
);

// Add a character memory
app.post('/:id/memories',
  validateParams(idParamSchema),
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const userId = c.get('userId');
    const body = await c.req.json();
    
    // Verify ownership
    const character = await SupabaseDB.getCharacterById(id);
    if (!character || character.owner_id !== userId) {
      throw NotFoundError('Character');
    }
    
    // Validate memory data
    if (!body.content || typeof body.content !== 'string') {
      throw ValidationError('Memory content is required');
    }
    
    const memory = await SupabaseDB.addCharacterMemory({
      characterId: id,
      content: body.content,
      memoryType: body.memoryType || 'conversation',
      emotionalWeight: body.emotionalWeight,
      importance: body.importance,
      topics: body.topics
    });
    
    return c.json({
      success: true,
      data: transformCharacterMemory(memory)
    }, 201);
  })
);

// Search character memories using vector similarity
app.post('/:id/memories/search',
  validateParams(idParamSchema),
  asyncHandler(async (c) => {
    const { id } = c.get('validatedParams');
    const userId = c.get('userId');
    const body = await c.req.json();
    
    // Verify ownership
    const character = await SupabaseDB.getCharacterById(id);
    if (!character || character.owner_id !== userId) {
      throw NotFoundError('Character');
    }
    
    if (!body.queryEmbedding || !Array.isArray(body.queryEmbedding)) {
      throw ValidationError('Query embedding vector is required');
    }
    
    const memories = await SupabaseDB.searchSimilarMemories(
      id,
      body.queryEmbedding,
      body.threshold || 0.7,
      body.limit || 10
    );
    
    return c.json({
      success: true,
      data: transformArray(memories, transformCharacterMemory)
    });
  })
);

export default app;