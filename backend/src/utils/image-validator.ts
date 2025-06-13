/**
 * Comprehensive Image Validation Utility
 * Validates image files for security, format, size, and quality
 */

import crypto from 'crypto';

/**
 * Image validation configuration
 */
export const IMAGE_VALIDATION_CONFIG = {
  // File size limits (in bytes)
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  minSizeBytes: 100, // 100 bytes minimum
  
  // Allowed formats and their MIME types
  allowedFormats: {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'svg': ['image/svg+xml', 'text/xml'],
    'bmp': ['image/bmp'],
    'ico': ['image/x-icon', 'image/vnd.microsoft.icon']
  },
  
  // Dangerous file signatures to block
  dangerousSignatures: [
    // Executable files
    'MZ', // PE/COFF executable
    'PK', // ZIP archive (could contain executables)
    '7z', // 7-Zip archive
    'Rar', // RAR archive
    
    // Script files masquerading as images
    '<?php', // PHP
    '#!/', // Shell script
    '<script', // JavaScript
    'python', // Python
  ],
  
  // Image dimensions limits
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 16,
  minHeight: 16,
  
  // Quality and compression
  maxAspectRatio: 10, // Width/Height or Height/Width ratio
};

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    format?: string;
    mimeType?: string;
    sizeBytes: number;
    sizeMB: number;
    width?: number;
    height?: number;
    aspectRatio?: number;
    hash?: string;
  };
}

/**
 * File signature (magic bytes) detection
 */
const FILE_SIGNATURES = {
  // Image formats
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
  'image/bmp': [
    [0x42, 0x4D], // BM
  ],
  'image/svg+xml': [
    [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
    [0x3C, 0x73, 0x76, 0x67], // <svg
  ],
};

/**
 * Detect file format by magic bytes
 */
function detectFormatBySignature(buffer: Buffer): string | null {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (buffer.length >= signature.length) {
        const match = signature.every((byte, index) => buffer[index] === byte);
        if (match) {
          return mimeType;
        }
      }
    }
  }
  return null;
}

/**
 * Check for dangerous file signatures
 */
function hasDangerousSignature(buffer: Buffer): string | null {
  const beginning = buffer.slice(0, 100).toString('ascii', 0, 100);
  
  for (const signature of IMAGE_VALIDATION_CONFIG.dangerousSignatures) {
    if (beginning.includes(signature)) {
      return signature;
    }
  }
  
  return null;
}

/**
 * Extract image dimensions (basic implementation)
 */
function extractImageDimensions(buffer: Buffer, format: string): { width?: number; height?: number } {
  try {
    switch (format) {
      case 'image/png':
        return extractPngDimensions(buffer);
      case 'image/jpeg':
        return extractJpegDimensions(buffer);
      case 'image/gif':
        return extractGifDimensions(buffer);
      case 'image/bmp':
        return extractBmpDimensions(buffer);
      default:
        return {};
    }
  } catch (error) {
    console.warn('Failed to extract image dimensions:', error);
    return {};
  }
}

/**
 * Extract PNG dimensions
 */
function extractPngDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG header: 8 bytes signature + 4 bytes length + 4 bytes "IHDR" + width(4) + height(4)
  if (buffer.length < 24) throw new Error('Invalid PNG file');
  
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  
  return { width, height };
}

/**
 * Extract JPEG dimensions (simplified)
 */
function extractJpegDimensions(buffer: Buffer): { width?: number; height?: number } {
  // JPEG dimension extraction is complex, returning empty for now
  // Would need to parse JPEG segments to find SOF marker
  return {};
}

/**
 * Extract GIF dimensions
 */
function extractGifDimensions(buffer: Buffer): { width: number; height: number } {
  // GIF header: 6 bytes signature + width(2, little-endian) + height(2, little-endian)
  if (buffer.length < 10) throw new Error('Invalid GIF file');
  
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  
  return { width, height };
}

/**
 * Extract BMP dimensions
 */
function extractBmpDimensions(buffer: Buffer): { width: number; height: number } {
  // BMP header: 14 bytes file header + 4 bytes size + 4 bytes reserved + width(4) + height(4)
  if (buffer.length < 26) throw new Error('Invalid BMP file');
  
  const width = buffer.readInt32LE(18);
  const height = Math.abs(buffer.readInt32LE(22)); // Height can be negative
  
  return { width, height };
}

/**
 * Validate file extension against content
 */
function validateExtensionMatch(filename: string, detectedFormat: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const allowedMimeTypes = IMAGE_VALIDATION_CONFIG.allowedFormats[extension as keyof typeof IMAGE_VALIDATION_CONFIG.allowedFormats];
  
  return allowedMimeTypes ? allowedMimeTypes.includes(detectedFormat) : false;
}

/**
 * Main image validation function
 */
export async function validateImage(
  buffer: Buffer, 
  filename: string, 
  providedMimeType?: string
): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      sizeBytes: buffer.length,
      sizeMB: buffer.length / (1024 * 1024),
    }
  };

  // 1. File size validation
  if (buffer.length > IMAGE_VALIDATION_CONFIG.maxSizeBytes) {
    result.errors.push(`File too large: ${result.metadata.sizeMB.toFixed(2)}MB (max: ${IMAGE_VALIDATION_CONFIG.maxSizeBytes / (1024 * 1024)}MB)`);
  }
  
  if (buffer.length < IMAGE_VALIDATION_CONFIG.minSizeBytes) {
    result.errors.push(`File too small: ${buffer.length} bytes (min: ${IMAGE_VALIDATION_CONFIG.minSizeBytes} bytes)`);
  }

  // 2. Check for dangerous signatures
  const dangerousSignature = hasDangerousSignature(buffer);
  if (dangerousSignature) {
    result.errors.push(`File contains dangerous signature: ${dangerousSignature}`);
  }

  // 3. Detect actual file format by magic bytes
  const detectedFormat = detectFormatBySignature(buffer);
  if (!detectedFormat) {
    result.errors.push('Could not detect valid image format from file content');
  } else {
    result.metadata.format = detectedFormat;
    result.metadata.mimeType = detectedFormat;
  }

  // 4. Validate file extension matches content
  if (detectedFormat && !validateExtensionMatch(filename, detectedFormat)) {
    result.warnings.push('File extension does not match detected format');
  }

  // 5. Validate against provided MIME type
  if (providedMimeType && detectedFormat && providedMimeType !== detectedFormat) {
    result.warnings.push(`Provided MIME type (${providedMimeType}) does not match detected format (${detectedFormat})`);
  }

  // 6. Extract and validate image dimensions
  if (detectedFormat) {
    const dimensions = extractImageDimensions(buffer, detectedFormat);
    if (dimensions.width && dimensions.height) {
      result.metadata.width = dimensions.width;
      result.metadata.height = dimensions.height;
      result.metadata.aspectRatio = dimensions.width / dimensions.height;

      // Validate dimensions
      if (dimensions.width > IMAGE_VALIDATION_CONFIG.maxWidth || dimensions.height > IMAGE_VALIDATION_CONFIG.maxHeight) {
        result.errors.push(`Image dimensions too large: ${dimensions.width}x${dimensions.height} (max: ${IMAGE_VALIDATION_CONFIG.maxWidth}x${IMAGE_VALIDATION_CONFIG.maxHeight})`);
      }
      
      if (dimensions.width < IMAGE_VALIDATION_CONFIG.minWidth || dimensions.height < IMAGE_VALIDATION_CONFIG.minHeight) {
        result.errors.push(`Image dimensions too small: ${dimensions.width}x${dimensions.height} (min: ${IMAGE_VALIDATION_CONFIG.minWidth}x${IMAGE_VALIDATION_CONFIG.minHeight})`);
      }

      // Validate aspect ratio
      const aspectRatio = Math.max(dimensions.width / dimensions.height, dimensions.height / dimensions.width);
      if (aspectRatio > IMAGE_VALIDATION_CONFIG.maxAspectRatio) {
        result.warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)} (image may appear distorted)`);
      }
    }
  }

  // 7. Generate file hash for duplicate detection
  result.metadata.hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // 8. Final validation
  result.isValid = result.errors.length === 0;

  return result;
}

/**
 * Quick validation for file uploads (lighter version)
 */
export async function quickValidateImage(
  file: File | Buffer, 
  filename?: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    let buffer: Buffer;
    let name: string;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      name = file.name;
    } else {
      buffer = file;
      name = filename || 'unknown';
    }

    // Quick checks only
    if (buffer.length > IMAGE_VALIDATION_CONFIG.maxSizeBytes) {
      return { isValid: false, error: 'File too large' };
    }

    const dangerousSignature = hasDangerousSignature(buffer);
    if (dangerousSignature) {
      return { isValid: false, error: 'Potentially dangerous file' };
    }

    const detectedFormat = detectFormatBySignature(buffer);
    if (!detectedFormat) {
      return { isValid: false, error: 'Invalid image format' };
    }

    return { isValid: true };

  } catch (error) {
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Get supported formats for frontend
 */
export function getSupportedFormats(): string[] {
  return Object.keys(IMAGE_VALIDATION_CONFIG.allowedFormats);
}

/**
 * Get validation configuration for frontend
 */
export function getValidationConfig() {
  return {
    maxSizeMB: IMAGE_VALIDATION_CONFIG.maxSizeBytes / (1024 * 1024),
    maxDimensions: {
      width: IMAGE_VALIDATION_CONFIG.maxWidth,
      height: IMAGE_VALIDATION_CONFIG.maxHeight
    },
    supportedFormats: getSupportedFormats(),
    allowedMimeTypes: Object.values(IMAGE_VALIDATION_CONFIG.allowedFormats).flat()
  };
}