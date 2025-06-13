'use client';

import { useState, useCallback } from 'react';
import { generateFallbackImageUrl } from '../../utils/image-upload';

interface EnhancedImageUploadProps {
  label: string;
  value: File | null;
  existingImageUrl?: string;
  onImageChange: (file: File | null) => void;
  entityType: 'character' | 'setting' | 'location';
  entityName?: string;
  placeholder?: {
    emoji: string;
    text: string;
  };
  className?: string;
  disabled?: boolean;
  showFallbackInfo?: boolean;
}

export default function EnhancedImageUpload({
  label,
  value,
  existingImageUrl,
  onImageChange,
  entityType,
  entityName,
  placeholder = { emoji: '📷', text: 'No image selected' },
  className = '',
  disabled = false,
  showFallbackInfo = true
}: EnhancedImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>('');

  // Generate fallback URL for display purposes
  const fallbackUrl = entityName ? generateFallbackImageUrl(entityName, entityType) : '';

  // Get the current preview URL - prioritize uploaded image preview, then existing, then fallback
  const getPreviewUrl = useCallback(() => {
    if (preview) return preview;
    if (existingImageUrl) return existingImageUrl;
    if (fallbackUrl) return fallbackUrl;
    return '';
  }, [preview, existingImageUrl, fallbackUrl]);

  const processImageFile = (file: File) => {
    if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      onImageChange(file);
    } else {
      alert('Please select a valid image file under 5MB');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onImageChange(null);
  };

  const currentPreview = getPreviewUrl();
  const hasImage = !!currentPreview;
  const isNewUpload = !!value;
  const hasExisting = !!existingImageUrl;

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
        {isNewUpload && <span className="text-green-400 ml-2">• New image selected</span>}
        {!isNewUpload && hasExisting && <span className="text-blue-400 ml-2">• Using existing image</span>}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          disabled 
            ? 'border-slate-600 bg-slate-800/30 cursor-not-allowed'
            : isDragging
            ? 'border-rose-400 bg-rose-500/10'
            : hasImage
            ? 'border-slate-600 bg-slate-800/40'
            : 'border-slate-600 hover:border-rose-400/50 bg-slate-800/40 cursor-pointer hover:bg-slate-700/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !hasImage && document.getElementById(`image-upload-${label}`)?.click()}
      >
        {hasImage ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-700/50">
              <img
                src={currentPreview}
                alt={`${entityType} image`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, show placeholder
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            
            <div className="flex gap-2">
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById(`image-upload-${label}`)?.click();
                    }}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            
            {showFallbackInfo && !isNewUpload && !hasExisting && entityName && (
              <p className="text-xs text-slate-400 text-center">
                Auto-generated image for "{entityName}"
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="text-4xl">{placeholder.emoji}</div>
            <div className="text-center">
              <p className="text-slate-300 mb-1">
                {disabled ? 'Image upload disabled' : placeholder.text}
              </p>
              {!disabled && (
                <p className="text-sm text-slate-400">
                  Click to browse or drag & drop • JPG, PNG, GIF • Max 5MB
                </p>
              )}
              {showFallbackInfo && !disabled && entityName && (
                <p className="text-xs text-slate-500 mt-2">
                  Auto-generated image will be used if no image is uploaded
                </p>
              )}
            </div>
          </div>
        )}

        <input
          id={`image-upload-${label}`}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * Simplified wrapper for common use cases
 */
export const CharacterImageUpload = (props: Omit<EnhancedImageUploadProps, 'entityType' | 'placeholder'>) => (
  <EnhancedImageUpload
    {...props}
    entityType="character"
    placeholder={{ emoji: '👤', text: 'No character image selected' }}
  />
);

export const SettingImageUpload = (props: Omit<EnhancedImageUploadProps, 'entityType' | 'placeholder'>) => (
  <EnhancedImageUpload
    {...props}
    entityType="setting"
    placeholder={{ emoji: '🏰', text: 'No setting image selected' }}
  />
);

export const LocationImageUpload = (props: Omit<EnhancedImageUploadProps, 'entityType' | 'placeholder'>) => (
  <EnhancedImageUpload
    {...props}
    entityType="location"
    placeholder={{ emoji: '📍', text: 'No location image selected' }}
  />
);