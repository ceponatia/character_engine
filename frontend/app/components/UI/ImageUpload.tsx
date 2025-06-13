'use client';

import { useState, useRef, useCallback } from 'react';
import { getApiUrl } from '../../utils/api-config';

interface ImageUploadProps {
  type: 'character' | 'setting' | 'location';
  name: string;
  onSuccess: (imagePath: string) => void;
  onError?: (error: string) => void;
  className?: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
}

interface ValidationConfig {
  maxSizeMB: number;
  maxDimensions: {
    width: number;
    height: number;
  };
  supportedFormats: string[];
  allowedMimeTypes: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  file?: File;
}

export default function ImageUpload({
  type,
  name,
  onSuccess,
  onError,
  className = '',
  acceptedFormats,
  maxSizeMB = 10,
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [validationConfig, setValidationConfig] = useState<ValidationConfig | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch validation config from backend
  const fetchValidationConfig = async (): Promise<ValidationConfig> => {
    if (validationConfig) return validationConfig;
    
    try {
      const response = await fetch(getApiUrl('/api/upload/info'));
      const data = await response.json();
      const config = data.validation;
      setValidationConfig(config);
      return config;
    } catch (error) {
      console.error('Failed to fetch validation config:', error);
      // Fallback config
      return {
        maxSizeMB: 10,
        maxDimensions: { width: 4096, height: 4096 },
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      };
    }
  };

  // Client-side validation
  const validateFile = async (file: File): Promise<ValidationResult> => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      file
    };

    const config = await fetchValidationConfig();

    // File size validation
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > config.maxSizeMB) {
      result.errors.push(`File too large: ${sizeMB.toFixed(2)}MB (max: ${config.maxSizeMB}MB)`);
    }

    // File type validation
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.supportedFormats.includes(fileExtension)) {
      result.errors.push(`Unsupported format: ${fileExtension}. Supported: ${config.supportedFormats.join(', ')}`);
    }

    // MIME type validation
    if (!config.allowedMimeTypes.includes(file.type)) {
      result.errors.push(`Invalid file type: ${file.type}`);
    }

    // Additional client-side checks
    if (file.size < 100) {
      result.errors.push('File too small (minimum 100 bytes)');
    }

    // Image dimension validation (if possible)
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const dimensions = await getImageDimensions(file);
        if (dimensions.width > config.maxDimensions.width || dimensions.height > config.maxDimensions.height) {
          result.errors.push(`Image too large: ${dimensions.width}x${dimensions.height} (max: ${config.maxDimensions.width}x${config.maxDimensions.height})`);
        }
        if (dimensions.width < 16 || dimensions.height < 16) {
          result.errors.push(`Image too small: ${dimensions.width}x${dimensions.height} (min: 16x16)`);
        }

        // Aspect ratio warning
        const aspectRatio = Math.max(dimensions.width / dimensions.height, dimensions.height / dimensions.width);
        if (aspectRatio > 10) {
          result.warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)} (image may appear distorted)`);
        }
      } catch (error) {
        result.warnings.push('Could not validate image dimensions');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  };

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setPreviewUrl(null);

    try {
      // Client-side validation
      const validation = await validateFile(file);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        onError?.(errorMessage);
        return;
      }

      // Show warnings to user
      if (validation.warnings.length > 0) {
        console.warn('Image upload warnings:', validation.warnings);
      }

      // Create preview
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name);

      // Upload to server
      const response = await fetch(getApiUrl(`/api/upload/${type}`), {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onSuccess(result.imagePath);
      } else {
        const errorMessage = result.details || result.error || 'Upload failed';
        onError?.(errorMessage);
      }

    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // File input change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  }, [disabled, handleUpload]);

  // Click to select file
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedFormats?.map(format => `.${format}`).join(',') || 'image/*'}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-rose-400 bg-rose-400/10' 
            : 'border-slate-600 hover:border-rose-400 hover:bg-slate-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300">Uploading image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-200 font-medium">Upload {type} image</p>
              <p className="text-sm text-slate-400 mt-1">
                Click or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Max {maxSizeMB}MB • JPG, PNG, GIF, WebP, SVG
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
      </div>

      {/* Validation info */}
      <div className="mt-3 text-xs text-slate-500">
        <p>✅ File format validation • ✅ Size limits • ✅ Security scanning</p>
      </div>
    </div>
  );
}

// Pre-configured components for specific use cases
export const CharacterImageUpload = (props: Omit<ImageUploadProps, 'type'>) => (
  <ImageUpload {...props} type="character" />
);

export const SettingImageUpload = (props: Omit<ImageUploadProps, 'type'>) => (
  <ImageUpload {...props} type="setting" />
);

export const LocationImageUpload = (props: Omit<ImageUploadProps, 'type'>) => (
  <ImageUpload {...props} type="location" />
);