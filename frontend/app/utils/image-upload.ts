/**
 * Image Upload Utility - Handles all image upload operations with proper fallback logic
 * Prevents accidental image replacement and provides consistent upload patterns
 */

import { getApiUrl } from './api-config';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageUploadOptions {
  type: 'character' | 'setting' | 'location' | 'story';
  preserveExisting?: boolean; // If true, don't upload if no new image provided
  existingImageUrl?: string; // Current image URL to preserve
}

/**
 * Uploads an image file to the server
 */
export async function uploadImage(
  file: File | null, 
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    // If no file provided and we should preserve existing, return existing URL
    if (!file && options.preserveExisting && options.existingImageUrl) {
      return {
        success: true,
        imageUrl: options.existingImageUrl
      };
    }

    // If no file provided and no existing URL, return empty
    if (!file) {
      return {
        success: true,
        imageUrl: ''
      };
    }

    // Upload the new file
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', options.type);

    const response = await fetch(getApiUrl('/api/upload'), {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        imageUrl: data.imageUrl
      };
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      return {
        success: false,
        error: errorData.error || 'Failed to upload image'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Gets the final image URL to use, with proper fallback logic
 */
export function getFinalImageUrl(
  uploadedImageUrl: string | undefined,
  existingImageUrl: string | undefined,
  fallbackImageUrl?: string
): string {
  // Priority: uploaded > existing > fallback > empty
  return uploadedImageUrl || existingImageUrl || fallbackImageUrl || '';
}

/**
 * Generates fallback image URLs for different types
 */
export function generateFallbackImageUrl(
  name: string,
  type: 'character' | 'setting' | 'location',
  index?: number
): string {
  const seed = encodeURIComponent(`${name}${index !== undefined ? `-${index}` : ''}`);
  
  switch (type) {
    case 'character':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    case 'setting':
    case 'location':
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=1e293b,374151,0f172a`;
    default:
      return '';
  }
}

/**
 * Handles batch image uploads (e.g., for locations in a setting)
 */
export async function uploadBatchImages(
  files: { [key: number]: File | null },
  options: ImageUploadOptions & {
    existingUrls?: { [key: number]: string };
    nameSeed?: (index: number) => string;
  }
): Promise<{ [key: number]: string }> {
  const results: { [key: number]: string } = {};
  
  for (const [indexStr, file] of Object.entries(files)) {
    const index = parseInt(indexStr);
    const existingUrl = options.existingUrls?.[index];
    
    const result = await uploadImage(file, {
      ...options,
      existingImageUrl: existingUrl
    });
    
    if (result.success) {
      results[index] = result.imageUrl || '';
    } else {
      // On error, preserve existing URL or generate fallback
      results[index] = existingUrl || 
        (options.nameSeed ? generateFallbackImageUrl(options.nameSeed(index), options.type, index) : '');
    }
  }
  
  return results;
}

/**
 * Image upload state management hook-like utility
 */
export class ImageUploadManager {
  private files: Map<string, File | null> = new Map();
  private previews: Map<string, string> = new Map();
  private existingUrls: Map<string, string> = new Map();

  setFile(key: string, file: File | null): void {
    this.files.set(key, file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previews.set(key, e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.previews.delete(key);
    }
  }

  setExistingUrl(key: string, url: string): void {
    this.existingUrls.set(key, url);
  }

  getPreview(key: string): string {
    return this.previews.get(key) || this.existingUrls.get(key) || '';
  }

  hasNewFile(key: string): boolean {
    return this.files.has(key) && this.files.get(key) !== null;
  }

  getFile(key: string): File | null {
    return this.files.get(key) || null;
  }

  clear(key: string): void {
    this.files.delete(key);
    this.previews.delete(key);
  }

  async uploadAll(
    options: ImageUploadOptions
  ): Promise<{ [key: string]: string }> {
    const results: { [key: string]: string } = {};
    
    for (const [key, file] of this.files.entries()) {
      const existingUrl = this.existingUrls.get(key);
      
      const result = await uploadImage(file, {
        ...options,
        existingImageUrl: existingUrl
      });
      
      if (result.success) {
        results[key] = result.imageUrl || existingUrl || '';
      } else {
        results[key] = existingUrl || '';
      }
    }
    
    return results;
  }
}