'use client';

import { useState } from 'react';
import { getCharacterAvatar, getSettingImage, getLocationImage } from '../../utils/helpers';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType?: 'character' | 'setting' | 'location' | 'generic';
  fallbackData?: {
    name?: string;
    settingType?: string;
    locationType?: string;
    index?: number;
  };
  onLoad?: () => void;
  onError?: () => void;
}

export default function SafeImage({ 
  src, 
  alt, 
  className = '', 
  fallbackType = 'generic',
  fallbackData = {},
  onLoad,
  onError
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getFallbackSrc = () => {
    switch (fallbackType) {
      case 'character':
        return getCharacterAvatar({ 
          imageUrl: src, 
          name: fallbackData.name 
        });
      case 'setting':
        return getSettingImage({ 
          imageUrl: src, 
          name: fallbackData.name,
          settingType: fallbackData.settingType 
        });
      case 'location':
        return getLocationImage({ 
          imageUrl: src, 
          name: fallbackData.name,
          locationType: fallbackData.locationType 
        }, fallbackData.index);
      case 'generic':
      default:
        return `https://via.placeholder.com/400x300?text=${encodeURIComponent(alt)}`;
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const imageSrc = hasError ? getFallbackSrc() : (src || getFallbackSrc());

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}