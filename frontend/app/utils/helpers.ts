// Shared utility functions for the frontend
// Re-exports from other utility modules for convenience
export { formatRelativeTime, capitalize, getInitials } from './text';
export { createSearchFilter, debounce, sortByRelevance } from './search';
export { apiGet, apiPost, apiPut, apiDelete, charactersApi, settingsApi, locationsApi, storiesApi } from './api';
export { parseJsonField, parseThemeField, parseMoodField, parseTimeOfDayField, parseFieldValue, parseMetadataFields } from './field-parsing';
import { getApiBaseUrl } from './api-config';
import { generateFallbackImageUrl } from './image-upload';

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
    // Check if it's already a full URL (http/https)
    if (character.imageUrl.startsWith('http')) {
      return character.imageUrl;
    }
    // If it's a relative path, construct the backend URL using API config
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${character.imageUrl.startsWith('/') ? character.imageUrl : `/${character.imageUrl}`}`;
  }
  
  // Use consistent fallback generation from image utility
  const characterName = character.name || 'Character';
  return generateFallbackImageUrl(characterName, 'character');
};

/**
 * Gets the image URL for a setting with type-based theming
 */
export const getSettingImage = (setting: SettingItem): string => {
  // Use custom uploaded image if available (check for non-empty string)
  if (setting.imageUrl && setting.imageUrl.trim() !== '') {
    // Check if it's already a full URL (http/https)
    if (setting.imageUrl.startsWith('http')) {
      return setting.imageUrl;
    }
    // If it's a relative path, construct the backend URL using API config
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${setting.imageUrl.startsWith('/') ? setting.imageUrl : `/${setting.imageUrl}`}`;
  }
  
  // Use consistent fallback generation from image utility
  const settingName = setting.name || 'Setting';
  return generateFallbackImageUrl(settingName, 'setting');
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
    // Check if it's already a full URL (http/https)
    if (location.imageUrl.startsWith('http')) {
      return location.imageUrl;
    }
    // If it's a relative path, construct the backend URL using API config
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${location.imageUrl.startsWith('/') ? location.imageUrl : `/${location.imageUrl}`}`;
  }
  
  // Use consistent fallback generation from image utility
  const locationName = location.name || `Location ${index + 1}`;
  return generateFallbackImageUrl(locationName, 'location', index);
};