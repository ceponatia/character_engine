/**
 * Frontend Image Validation Utilities
 * Client-side image validation to provide immediate feedback
 */

/**
 * Validation configuration (matches backend)
 */
export const IMAGE_VALIDATION_CONFIG = {
  maxSizeMB: 10,
  minSizeBytes: 100,
  maxDimensions: {
    width: 4096,
    height: 4096
  },
  minDimensions: {
    width: 16,
    height: 16
  },
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ],
  maxAspectRatio: 10
};

/**
 * Validation result interface
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    name: string;
    size: number;
    sizeMB: number;
    type: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
}

/**
 * Read file as array buffer for binary analysis
 */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect file format by magic bytes (client-side version)
 */
async function detectFileFormat(file: File): Promise<string | null> {
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const uint8Array = new Uint8Array(buffer);
    
    // Check magic bytes for common formats
    if (uint8Array.length >= 8) {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
          uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
        return 'image/png';
      }
      
      // JPEG: FF D8 FF
      if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
        return 'image/jpeg';
      }
      
      // GIF: 47 49 46 38 (GIF8)
      if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && 
          uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
        return 'image/gif';
      }
      
      // WebP: 52 49 46 46 (RIFF)
      if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
          uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
        return 'image/webp';
      }
      
      // BMP: 42 4D (BM)
      if (uint8Array[0] === 0x42 && uint8Array[1] === 0x4D) {
        return 'image/bmp';
      }
    }
    
    // SVG detection (text-based)
    const textContent = new TextDecoder().decode(uint8Array.slice(0, 100));
    if (textContent.includes('<svg') || textContent.includes('<?xml')) {
      return 'image/svg+xml';
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to detect file format:', error);
    return null;
  }
}

/**
 * Get image dimensions using Image element
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Skip dimension check for SVG files
    if (file.type === 'image/svg+xml') {
      resolve({ width: 0, height: 0 }); // SVG dimensions are flexible
      return;
    }
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension analysis'));
    };
    
    img.src = url;
  });
}

/**
 * Check for potentially dangerous content
 */
async function checkForDangerousContent(file: File): Promise<string[]> {
  const warnings: string[] = [];
  
  try {
    // For text-based formats like SVG, check content
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const text = await file.text();
      
      // Check for script tags
      if (text.includes('<script')) {
        warnings.push('SVG contains script tags (potential security risk)');
      }
      
      // Check for external references
      if (text.includes('xlink:href') || text.includes('href=')) {
        warnings.push('SVG contains external references');
      }
      
      // Check for embedded data
      if (text.includes('data:')) {
        warnings.push('SVG contains embedded data URLs');
      }
    }
    
    // Check file size vs content (potential zip bomb detection)
    if (file.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Unusually large file size for image');
    }
    
  } catch (error) {
    console.warn('Failed to check for dangerous content:', error);
  }
  
  return warnings;
}

/**
 * Main client-side validation function
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      name: file.name,
      size: file.size,
      sizeMB: file.size / (1024 * 1024),
      type: file.type
    }
  };

  // 1. Basic file checks
  if (!file) {
    result.errors.push('No file provided');
    result.isValid = false;
    return result;
  }

  // 2. File size validation
  if (file.size > IMAGE_VALIDATION_CONFIG.maxSizeMB * 1024 * 1024) {
    result.errors.push(`File too large: ${result.metadata.sizeMB.toFixed(2)}MB (max: ${IMAGE_VALIDATION_CONFIG.maxSizeMB}MB)`);
  }
  
  if (file.size < IMAGE_VALIDATION_CONFIG.minSizeBytes) {
    result.errors.push(`File too small: ${file.size} bytes (min: ${IMAGE_VALIDATION_CONFIG.minSizeBytes} bytes)`);
  }

  // 3. File type validation
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !IMAGE_VALIDATION_CONFIG.supportedFormats.includes(fileExtension)) {
    result.errors.push(`Unsupported file extension: ${fileExtension}. Supported: ${IMAGE_VALIDATION_CONFIG.supportedFormats.join(', ')}`);
  }

  // 4. MIME type validation
  if (!IMAGE_VALIDATION_CONFIG.allowedMimeTypes.includes(file.type)) {
    result.errors.push(`Invalid MIME type: ${file.type}`);
  }

  // 5. Magic byte validation
  try {
    const detectedFormat = await detectFileFormat(file);
    if (!detectedFormat) {
      result.warnings.push('Could not detect file format from content');
    } else if (detectedFormat !== file.type) {
      result.warnings.push(`File content (${detectedFormat}) does not match declared type (${file.type})`);
    }
  } catch (error) {
    result.warnings.push('Failed to validate file format');
  }

  // 6. Image dimensions validation
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width > 0 && dimensions.height > 0) {
      result.metadata.width = dimensions.width;
      result.metadata.height = dimensions.height;
      result.metadata.aspectRatio = dimensions.width / dimensions.height;

      // Check dimensions
      if (dimensions.width > IMAGE_VALIDATION_CONFIG.maxDimensions.width || 
          dimensions.height > IMAGE_VALIDATION_CONFIG.maxDimensions.height) {
        result.errors.push(`Image too large: ${dimensions.width}x${dimensions.height} (max: ${IMAGE_VALIDATION_CONFIG.maxDimensions.width}x${IMAGE_VALIDATION_CONFIG.maxDimensions.height})`);
      }
      
      if (dimensions.width < IMAGE_VALIDATION_CONFIG.minDimensions.width || 
          dimensions.height < IMAGE_VALIDATION_CONFIG.minDimensions.height) {
        result.errors.push(`Image too small: ${dimensions.width}x${dimensions.height} (min: ${IMAGE_VALIDATION_CONFIG.minDimensions.width}x${IMAGE_VALIDATION_CONFIG.minDimensions.height})`);
      }

      // Check aspect ratio
      const aspectRatio = Math.max(dimensions.width / dimensions.height, dimensions.height / dimensions.width);
      if (aspectRatio > IMAGE_VALIDATION_CONFIG.maxAspectRatio) {
        result.warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)} (image may appear distorted)`);
      }
    }
  } catch (error) {
    result.warnings.push('Could not validate image dimensions');
  }

  // 7. Security checks
  try {
    const securityWarnings = await checkForDangerousContent(file);
    result.warnings.push(...securityWarnings);
  } catch (error) {
    result.warnings.push('Could not perform security validation');
  }

  // 8. Final validation
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Quick validation for immediate feedback
 */
export function quickValidateImage(file: File): { isValid: boolean; error?: string } {
  // Basic checks that don't require async operations
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.size > IMAGE_VALIDATION_CONFIG.maxSizeMB * 1024 * 1024) {
    return { isValid: false, error: `File too large (max ${IMAGE_VALIDATION_CONFIG.maxSizeMB}MB)` };
  }

  if (file.size < IMAGE_VALIDATION_CONFIG.minSizeBytes) {
    return { isValid: false, error: 'File too small' };
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !IMAGE_VALIDATION_CONFIG.supportedFormats.includes(fileExtension)) {
    return { isValid: false, error: `Unsupported format: ${fileExtension}` };
  }

  if (!IMAGE_VALIDATION_CONFIG.allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: `Invalid file type: ${file.type}` };
  }

  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get validation configuration
 */
export function getValidationConfig() {
  return IMAGE_VALIDATION_CONFIG;
}