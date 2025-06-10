'use client';

import { useState } from 'react';

interface ImageUploadAreaProps {
  label: string;
  value: string | File | null;
  preview: string;
  onImageChange: (file: File | null) => void;
  onRemove: () => void;
  entityType: string; // e.g., "character", "setting", "story"
  entityName?: string; // The name field value for auto-generation text
  placeholder?: {
    emoji: string;
    text: string;
  };
  getDefaultImageUrl?: () => string;
  className?: string;
}

export default function ImageUploadArea({
  label,
  value,
  preview,
  onImageChange,
  onRemove,
  entityType,
  entityName,
  placeholder = { emoji: '📷', text: 'No image selected' },
  getDefaultImageUrl,
  className = ''
}: ImageUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const processImageFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageChange(file);
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
    setIsDragging(true);
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const triggerImageUpload = () => {
    document.getElementById(`imageUpload-${entityType}`)?.click();
  };

  const hasImage = preview || (typeof value === 'string' && value);
  const defaultImageUrl = getDefaultImageUrl?.();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div 
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          isDragging 
            ? 'border-rose-500 bg-rose-500/10' 
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-start space-x-6">
          {/* Image Preview Area - Clickable */}
          <div 
            className="w-48 h-48 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-700/50 cursor-pointer hover:bg-slate-700/70 transition-all duration-200"
            onClick={triggerImageUpload}
          >
            {preview ? (
              <img src={preview} alt={`${entityType} preview`} className="w-full h-full object-cover rounded-lg" />
            ) : defaultImageUrl ? (
              <img src={defaultImageUrl} alt={`Default ${entityType} image`} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center">
                <span className="text-4xl">{placeholder.emoji}</span>
                <p className="text-slate-400 text-sm mt-2">{placeholder.text}</p>
                <p className="text-slate-500 text-xs mt-1">Click to browse</p>
              </div>
            )}
          </div>
          
          {/* Upload Instructions and Controls */}
          <div className="flex-1 space-y-4">
            <div className="text-center py-6">
              <p className="text-slate-300 font-medium mb-1">
                {isDragging ? 'Drop image here!' : 'Drag and drop an image here'}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                or click the image box to browse files
              </p>
              
              <div className="space-y-3">
                <input
                  type="file"
                  id={`imageUpload-${entityType}`}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {hasImage && (
                  <div className="flex justify-center">
                    <button 
                      type="button" 
                      onClick={onRemove}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-slate-400 text-sm">
                    <strong>Supported formats:</strong> JPG, PNG, GIF, WebP<br/>
                    <strong>Auto-generated:</strong> Uses {entityType} {entityName ? 'name' : 'data'} if no image uploaded
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-rose-500/20 border-2 border-rose-500 border-dashed rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">📎</div>
              <p className="text-rose-300 text-lg font-medium">Drop your image here!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}