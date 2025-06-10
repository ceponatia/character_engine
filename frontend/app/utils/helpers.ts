// Shared utility functions for the frontend
// Re-exports from other utility modules for convenience
export { formatRelativeTime, capitalize, getInitials } from './text';
export { createSearchFilter, debounce, sortByRelevance } from './search';
export { apiGet, apiPost, apiPut, apiDelete, charactersApi, settingsApi, locationsApi, storiesApi } from './api';

/**
 * Truncates text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Card overlay specific truncation utilities
 */
export const truncateCardTitle = (text: string): string => {
  return truncateText(text, 50);
};

export const truncateCardDescription = (text: string): string => {
  return truncateText(text, 120);
};

/**
 * Interface for items with image URLs
 */
interface ImageItem {
  imageUrl?: string;
  name?: string;
}

/**
 * Interface for characters with avatar images
 */
interface CharacterItem extends ImageItem {
  avatarImage?: string;
}

/**
 * Interface for settings with type-based images
 */
interface SettingItem extends ImageItem {
  settingType?: string;
}

/**
 * Gets the avatar source for a character with fallback logic
 */
export const getCharacterAvatar = (character: CharacterItem): string => {
  // Use imageUrl from API (which consolidates avatar_image and image_url)
  if (character.imageUrl) {
    return character.imageUrl;
  }
  
  // Fallback to generated avatar
  const name = character.name || 'Character';
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e293b,334155,475569&scale=110`;
};

/**
 * Gets the image URL for a setting with type-based theming
 */
export const getSettingImage = (setting: SettingItem): string => {
  // Use custom uploaded image if available
  if (setting.imageUrl) {
    return setting.imageUrl;
  }
  
  // Generate a default themed image based on setting type and name
  const settingName = setting.name || 'Setting';
  const settingType = setting.settingType || 'general';
  const seed = encodeURIComponent(`${settingName}-${settingType}`);
  
  // Return different default images based on setting type
  switch (settingType.toLowerCase()) {
    case 'fantasy':
      return `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'modern':
      return `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'sci-fi':
      return `https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'historical':
      return `https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'general':
    default:
      return `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
  }
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Gets a default image URL for location cards based on location type
 */
export const getLocationImage = (location: { 
  imageUrl?: string; 
  name?: string; 
  locationType?: string; 
}, index: number = 0): string => {
  // Use custom uploaded image if available
  if (location.imageUrl) {
    return location.imageUrl;
  }
  
  // Generate a default themed image based on location type and name
  const locationName = location.name || `Location ${index + 1}`;
  const locationType = location.locationType || 'room';
  const seed = encodeURIComponent(`${locationName}-${locationType}-${index}`);
  
  // Return different default images based on location type
  switch (locationType.toLowerCase()) {
    case 'outdoor':
      return `https://picsum.photos/seed/${seed}-outdoor/400/300`;
    case 'building':
      return `https://picsum.photos/seed/${seed}-building/400/300`;
    case 'landmark':
      return `https://picsum.photos/seed/${seed}-landmark/400/300`;
    case 'vehicle':
      return `https://picsum.photos/seed/${seed}-vehicle/400/300`;
    case 'room':
    default:
      return `https://picsum.photos/seed/${seed}-room/400/300`;
  }
};