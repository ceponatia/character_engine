import { Context, Next } from 'hono';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Sanitization middleware to prevent XSS
export async function sanitizeInput(c: Context, next: Next) {
  try {
    const contentType = c.req.header('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await c.req.json();
      
      // Recursively sanitize all string fields
      const sanitized = sanitizeObject(body);
      
      // Store sanitized body for use in routes
      c.set('sanitizedBody', sanitized);
    }
    
    await next();
  } catch (error) {
    console.error('Sanitization error:', error);
    return c.json({
      error: 'Invalid request format',
      message: 'Unable to process request body'
    }, 400);
  }
}

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { 
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: []  // Remove all attributes
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// Validation schemas
export const characterSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  archetype: z.string().min(1).max(100).trim(),
  chatbot_role: z.string().min(1).max(100).trim(),
  conceptual_age: z.string().max(50).optional(),
  source_material: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  attire: z.string().max(500).optional(),
  colors: z.array(z.string().max(50)).max(10).default([]),
  features: z.string().max(500).optional(),
  image_url: z.string().url().optional(),
  tone: z.array(z.string().max(50)).max(10).default([]),
  pacing: z.string().max(100).optional(),
  inflection: z.string().max(100).optional(),
  vocabulary: z.string().max(100).optional(),
  primary_traits: z.array(z.string().max(50)).max(10).default([]),
  secondary_traits: z.array(z.string().max(50)).max(10).default([]),
  quirks: z.array(z.string().max(100)).max(10).default([]),
  interruption_tolerance: z.enum(['high', 'medium', 'low']).default('medium'),
  primary_motivation: z.string().max(500).optional(),
  core_goal: z.string().max(500).optional(),
  secondary_goals: z.array(z.string().max(200)).max(10).default([]),
  core_abilities: z.array(z.string().max(100)).max(10).default([]),
  approach: z.string().max(500).optional(),
  patience: z.string().max(100).optional(),
  demeanor: z.string().max(100).optional(),
  adaptability: z.string().max(100).optional(),
  greeting: z.string().max(1000).optional(),
  affirmation: z.string().max(500).optional(),
  comfort: z.string().max(500).optional(),
  forbidden_topics: z.array(z.string().max(100)).max(20).default([]),
  interaction_policy: z.string().max(1000).optional(),
  conflict_resolution: z.string().max(500).optional(),
});

export const settingSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional(),
  theme: z.string().max(100).optional(),
  atmosphere: z.string().max(1000).optional(),
  time_period: z.string().max(100).optional(),
  style_notes: z.string().max(1000).optional(),
  is_public: z.boolean().default(false),
});

export const locationSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional(),
  setting_type: z.string().max(100).optional(),
  atmosphere: z.string().max(1000).optional(),
  notable_features: z.array(z.string().max(200)).max(10).default([]),
  mood: z.string().max(100).optional(),
  is_public: z.boolean().default(false),
});

export const chatSessionSchema = z.object({
  character_id: z.string().uuid(),
  setting_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200).trim(),
  context: z.string().max(5000).optional(),
});

export const chatMessageSchema = z.object({
  session_id: z.string().uuid(),
  content: z.string().min(1).max(4000).trim(),
  is_user_message: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

// Validation middleware factory
export function validateBody<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = c.get('sanitizedBody') || await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Validation failed',
          message: 'The provided data is invalid',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400);
      }
      
      console.error('Validation error:', error);
      return c.json({
        error: 'Validation error',
        message: 'Unable to validate request data'
      }, 400);
    }
  };
}

export function validateParams<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      c.set('validatedParams', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Invalid parameters',
          message: 'The provided parameters are invalid',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400);
      }
      
      console.error('Parameter validation error:', error);
      return c.json({
        error: 'Parameter validation error',
        message: 'Unable to validate request parameters'
      }, 400);
    }
  };
}

// Common parameter schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().max(50).optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});