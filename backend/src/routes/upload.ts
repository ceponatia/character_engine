/**
 * Image Upload Routes
 * Handles file uploads for characters, settings, and locations
 */

import { Hono } from 'hono';
import { saveUploadedImage } from '../utils/image-storage';
import { quickValidateImage, getValidationConfig } from '../utils/image-validator';

const upload = new Hono();

/**
 * POST /api/upload
 * General upload endpoint that routes to specific type handlers
 */
upload.post('/', async (c) => {
  try {
    const formData = await c.req.formData();
    
    const file = formData.get('image') as File;
    const type = formData.get('type') as string;
    
    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }
    
    if (!type) {
      return c.json({ error: 'Upload type is required (character, setting, location)' }, 400);
    }
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Quick validation before processing
    const quickValidation = await quickValidateImage(buffer, file.name);
    if (!quickValidation.isValid) {
      return c.json({ 
        error: 'Invalid image file',
        details: quickValidation.error 
      }, 400);
    }
    
    // Generate a default name if not provided
    const name = formData.get('name') as string || `${type}-${Date.now()}`;
    
    // Save the uploaded image (includes comprehensive validation)
    const imagePath = await saveUploadedImage(buffer, file.name, name, type as 'character' | 'setting' | 'location');
    
    return c.json({
      success: true,
      imageUrl: imagePath, // Return as imageUrl for consistency with frontend expectations
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully`
    });
    
  } catch (error) {
    console.error('General image upload error:', error);
    return c.json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/upload/character
 * Upload an image for a character
 */
upload.post('/character', async (c) => {
  try {
    const formData = await c.req.formData();
    
    const file = formData.get('image') as File;
    const name = formData.get('name') as string;
    
    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }
    
    if (!name) {
      return c.json({ error: 'Character name is required' }, 400);
    }
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Quick validation before processing
    const quickValidation = await quickValidateImage(buffer, file.name);
    if (!quickValidation.isValid) {
      return c.json({ 
        error: 'Invalid image file',
        details: quickValidation.error 
      }, 400);
    }
    
    // Save the uploaded image (includes comprehensive validation)
    const imagePath = await saveUploadedImage(buffer, file.name, name, 'character');
    
    return c.json({
      success: true,
      imagePath,
      message: 'Character image uploaded successfully'
    });
    
  } catch (error) {
    console.error('Character image upload error:', error);
    return c.json({ 
      error: 'Failed to upload character image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/upload/setting
 * Upload an image for a setting
 */
upload.post('/setting', async (c) => {
  try {
    const formData = await c.req.formData();
    
    const file = formData.get('image') as File;
    const name = formData.get('name') as string;
    
    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }
    
    if (!name) {
      return c.json({ error: 'Setting name is required' }, 400);
    }
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Quick validation before processing
    const quickValidation = await quickValidateImage(buffer, file.name);
    if (!quickValidation.isValid) {
      return c.json({ 
        error: 'Invalid image file',
        details: quickValidation.error 
      }, 400);
    }
    
    // Save the uploaded image (includes comprehensive validation)
    const imagePath = await saveUploadedImage(buffer, file.name, name, 'setting');
    
    return c.json({
      success: true,
      imagePath,
      message: 'Setting image uploaded successfully'
    });
    
  } catch (error) {
    console.error('Setting image upload error:', error);
    return c.json({ 
      error: 'Failed to upload setting image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/upload/location
 * Upload an image for a location
 */
upload.post('/location', async (c) => {
  try {
    const formData = await c.req.formData();
    
    const file = formData.get('image') as File;
    const name = formData.get('name') as string;
    
    if (!file) {
      return c.json({ error: 'No image file provided' }, 400);
    }
    
    if (!name) {
      return c.json({ error: 'Location name is required' }, 400);
    }
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Quick validation before processing
    const quickValidation = await quickValidateImage(buffer, file.name);
    if (!quickValidation.isValid) {
      return c.json({ 
        error: 'Invalid image file',
        details: quickValidation.error 
      }, 400);
    }
    
    // Save the uploaded image (includes comprehensive validation)
    const imagePath = await saveUploadedImage(buffer, file.name, name, 'location');
    
    return c.json({
      success: true,
      imagePath,
      message: 'Location image uploaded successfully'
    });
    
  } catch (error) {
    console.error('Location image upload error:', error);
    return c.json({ 
      error: 'Failed to upload location image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/upload/info
 * Get upload configuration and limits
 */
upload.get('/info', async (c) => {
  const config = getValidationConfig();
  
  return c.json({
    validation: config,
    endpoints: {
      character: '/api/upload/character',
      setting: '/api/upload/setting', 
      location: '/api/upload/location'
    },
    usage: {
      method: 'POST',
      contentType: 'multipart/form-data',
      fields: {
        image: 'File - The image file to upload',
        name: 'String - The name of the character/setting/location'
      }
    },
    security: {
      features: [
        'Magic byte validation',
        'File signature verification', 
        'Dangerous content detection',
        'Format spoofing protection',
        'Dimension and size limits'
      ]
    }
  });
});

export default upload;