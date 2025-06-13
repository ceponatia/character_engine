/**
 * Image Storage Utility
 * Handles downloading, saving, and serving images locally
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { validateImage, quickValidateImage } from './image-validator';

/**
 * Base configuration for image storage
 */
const STORAGE_CONFIG = {
  baseDir: './uploads/images',
  maxSizeMB: 10,
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  defaultQuality: 80,
};

/**
 * Generate a safe filename from a string
 */
export function generateSafeFilename(input: string, extension: string = 'png'): string {
  // Remove unsafe characters and create hash for uniqueness
  const safe = input.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const hash = crypto.createHash('md5').update(input).digest('hex').substring(0, 8);
  return `${safe}-${hash}.${extension}`;
}

/**
 * Get storage path for different content types
 */
export function getStoragePath(type: 'character' | 'setting' | 'location', category: 'user' | 'generated' = 'generated'): string {
  // Both user and generated images go in the same folder (e.g., /images/characters/, /images/settings/)
  return path.join(STORAGE_CONFIG.baseDir, `${type}s`);
}

/**
 * Download an image from URL and save it locally
 */
export async function downloadAndSaveImage(
  url: string, 
  name: string, 
  type: 'character' | 'setting' | 'location',
  category: 'user' | 'generated' = 'generated'
): Promise<string> {
  try {
    // Generate safe filename
    const extension = getExtensionFromUrl(url);
    const filename = generateSafeFilename(name, extension);
    
    // Ensure directory exists
    const storageDir = getStoragePath(type, category);
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }
    
    const filePath = path.join(storageDir, filename);
    
    // Download the image
    console.log(`Downloading image from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Comprehensive validation
    const validation = await validateImage(buffer, filename, response.headers.get('content-type') || undefined);
    
    if (!validation.isValid) {
      throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Image warnings for ${name}:`, validation.warnings);
    }
    
    // Log metadata
    console.log(`Image metadata for ${name}:`, {
      format: validation.metadata.format,
      size: `${validation.metadata.sizeMB.toFixed(2)}MB`,
      dimensions: validation.metadata.width && validation.metadata.height 
        ? `${validation.metadata.width}x${validation.metadata.height}`
        : 'unknown'
    });
    
    // Save the file
    await writeFile(filePath, buffer);
    
    // Return the web-accessible path
    const webPath = `/images/${type}s/${filename}`;
    console.log(`✅ Image saved: ${webPath}`);
    
    return webPath;
    
  } catch (error) {
    console.error(`❌ Failed to download image for ${name}:`, error);
    throw error;
  }
}

/**
 * Save uploaded file buffer to storage
 */
export async function saveUploadedImage(
  buffer: Buffer,
  originalName: string,
  name: string,
  type: 'character' | 'setting' | 'location'
): Promise<string> {
  try {
    // Comprehensive validation
    const validation = await validateImage(buffer, originalName);
    
    if (!validation.isValid) {
      throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Image warnings for ${name}:`, validation.warnings);
    }
    
    // Extract extension from validation result or original filename
    const detectedFormat = validation.metadata.format;
    let extension = 'png'; // Default fallback
    
    if (detectedFormat) {
      // Map MIME type to extension
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png', 
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp'
      };
      extension = mimeToExt[detectedFormat] || path.extname(originalName).slice(1).toLowerCase() || 'png';
    } else {
      extension = path.extname(originalName).slice(1).toLowerCase() || 'png';
    }
    
    // Log metadata
    console.log(`Upload metadata for ${name}:`, {
      format: validation.metadata.format,
      size: `${validation.metadata.sizeMB.toFixed(2)}MB`,
      dimensions: validation.metadata.width && validation.metadata.height 
        ? `${validation.metadata.width}x${validation.metadata.height}`
        : 'unknown',
      hash: validation.metadata.hash?.substring(0, 8) + '...'
    });
    
    // Generate filename and path
    const filename = generateSafeFilename(name, extension);
    const storageDir = getStoragePath(type, 'user');
    
    // Ensure directory exists
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }
    
    const filePath = path.join(storageDir, filename);
    
    // Save the file
    await writeFile(filePath, buffer);
    
    // Return the web-accessible path
    const webPath = `/images/${type}s/${filename}`;
    console.log(`✅ User image saved: ${webPath}`);
    
    return webPath;
    
  } catch (error) {
    console.error(`❌ Failed to save uploaded image for ${name}:`, error);
    throw error;
  }
}

/**
 * Extract file extension from URL
 */
function getExtensionFromUrl(url: string): string {
  try {
    // Handle API URLs like DiceBear (default to svg)
    if (url.includes('dicebear.com')) return 'svg';
    if (url.includes('unsplash.com')) return 'jpg';
    if (url.includes('picsum.photos')) return 'jpg';
    
    // Try to extract from URL path
    const pathname = new URL(url).pathname;
    const extension = path.extname(pathname).slice(1).toLowerCase();
    
    return STORAGE_CONFIG.allowedFormats.includes(extension) ? extension : 'png';
  } catch {
    return 'png'; // Default fallback
  }
}

/**
 * Clean up old/unused images (for maintenance)
 */
export async function cleanupUnusedImages(): Promise<void> {
  // TODO: Implement cleanup logic that:
  // 1. Scans database for all image_url references
  // 2. Finds files in storage that aren't referenced
  // 3. Optionally removes them (with confirmation)
  console.log('Image cleanup not yet implemented');
}

/**
 * Get image info without downloading
 */
export async function getImageInfo(url: string): Promise<{
  contentType: string;
  size: number;
  isValid: boolean;
}> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    const size = parseInt(response.headers.get('content-length') || '0');
    
    return {
      contentType,
      size,
      isValid: response.ok && contentType.startsWith('image/')
    };
  } catch {
    return {
      contentType: '',
      size: 0,
      isValid: false
    };
  }
}