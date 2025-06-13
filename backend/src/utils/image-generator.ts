/**
 * Image Generation Utility
 * Generates and downloads fallback images for characters, settings, and locations
 * Saves images locally and returns local paths instead of external URLs
 */

import { downloadAndSaveImage } from './image-storage';

/**
 * Interface for items with image URLs
 */
interface ImageItem {
  imageUrl?: string;
  name?: string;
}

/**
 * Interface for characters with image URLs
 */
interface CharacterItem extends ImageItem {
}

/**
 * Interface for settings with type-based images
 */
interface SettingItem extends ImageItem {
  settingType?: string;
}

/**
 * Interface for locations with type-based images
 */
interface LocationItem extends ImageItem {
  locationType?: string;
}

/**
 * Generates and downloads avatar for a character
 */
export async function generateCharacterAvatar(character: CharacterItem): Promise<string> {
  // If already has a valid local URL, return it
  if (character.imageUrl && character.imageUrl.startsWith('/images/')) {
    return character.imageUrl;
  }
  
  // Generate external URL
  const name = character.name || 'Character';
  const externalUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=1e293b,334155,475569&scale=110`;
  
  // Download and save locally
  try {
    const localPath = await downloadAndSaveImage(externalUrl, name, 'character', 'generated');
    return localPath;
  } catch (error) {
    console.error(`Failed to download character avatar for ${name}:`, error);
    // Fallback to external URL if download fails
    return externalUrl;
  }
}

/**
 * Generates and downloads image for a setting based on type
 */
export async function generateSettingImage(setting: SettingItem): Promise<string> {
  // If already has a valid local URL, return it
  if (setting.imageUrl && setting.imageUrl.startsWith('/images/')) {
    return setting.imageUrl;
  }
  
  // Generate external URL based on setting type and name
  const settingName = setting.name || 'Setting';
  const settingType = setting.settingType || 'general';
  const seed = encodeURIComponent(`${settingName}-${settingType}`);
  
  // Get external URL based on setting type
  let externalUrl: string;
  switch (settingType.toLowerCase()) {
    case 'fantasy':
      externalUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'modern':
      externalUrl = `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'sci-fi':
      externalUrl = `https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'historical':
      externalUrl = `https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'romantic':
      externalUrl = `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'adventure':
      externalUrl = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
      break;
    case 'general':
    default:
      externalUrl = `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
  }
  
  // Download and save locally
  try {
    const localPath = await downloadAndSaveImage(externalUrl, settingName, 'setting', 'generated');
    return localPath;
  } catch (error) {
    console.error(`Failed to download setting image for ${settingName}:`, error);
    // Fallback to external URL if download fails
    return externalUrl;
  }
}

/**
 * Generates and downloads image for a location based on type
 */
export async function generateLocationImage(location: LocationItem, index: number = 0): Promise<string> {
  // If already has a valid local URL, return it
  if (location.imageUrl && location.imageUrl.startsWith('/images/')) {
    return location.imageUrl;
  }
  
  // Generate external URL based on location type and name
  const locationName = location.name || `Location ${index + 1}`;
  const locationType = location.locationType || 'room';
  const seed = encodeURIComponent(`${locationName}-${locationType}-${index}`);
  
  // Get external URL based on location type
  let externalUrl: string;
  switch (locationType.toLowerCase()) {
    case 'outdoor':
      externalUrl = `https://picsum.photos/seed/${seed}-outdoor/400/300`;
      break;
    case 'building':
      externalUrl = `https://picsum.photos/seed/${seed}-building/400/300`;
      break;
    case 'landmark':
      externalUrl = `https://picsum.photos/seed/${seed}-landmark/400/300`;
      break;
    case 'vehicle':
      externalUrl = `https://picsum.photos/seed/${seed}-vehicle/400/300`;
      break;
    case 'room':
    default:
      externalUrl = `https://picsum.photos/seed/${seed}-room/400/300`;
  }
  
  // Download and save locally
  try {
    const localPath = await downloadAndSaveImage(externalUrl, locationName, 'location', 'generated');
    return localPath;
  } catch (error) {
    console.error(`Failed to download location image for ${locationName}:`, error);
    // Fallback to external URL if download fails
    return externalUrl;
  }
}

/**
 * Helper function to validate if a string is a proper URL
 */
function isValidUrl(urlString: string): boolean {
  if (!urlString) return false;
  
  // Check if it's a valid URL (starts with http/https)
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return true;
  }
  
  // Check if it's a relative path starting with /
  if (urlString.startsWith('/')) {
    return true;
  }
  
  // If it's just a filename, it's not valid
  return false;
}

/**
 * Auto-generates and downloads image for any type of content
 */
export async function autoGenerateImage(item: any, type: 'character' | 'setting' | 'location', index: number = 0): Promise<string> {
  switch (type) {
    case 'character':
      return await generateCharacterAvatar(item);
    case 'setting':
      return await generateSettingImage(item);
    case 'location':
      return await generateLocationImage(item, index);
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}

/**
 * Ensures an item has a valid image URL, generating one if needed
 */
export async function ensureImageUrl(item: any, type: 'character' | 'setting' | 'location', index: number = 0): Promise<string> {
  // Check if already has a valid local image
  const existingUrl = item.imageUrl || item.image_url;
  if (existingUrl && existingUrl.startsWith('/images/')) {
    return existingUrl;
  }
  
  // Generate and download new image
  return await autoGenerateImage(item, type, index);
}