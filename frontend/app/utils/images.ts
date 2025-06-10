/**
 * Image Utilities - Image generation, validation, and fallback logic
 */

/**
 * Generate character avatar URL using DiceBear API
 */
export function getCharacterAvatar(character: { name?: string; imageUrl?: string } | string, style: string = 'personas'): string {
  // Handle both object and string inputs for backward compatibility
  if (typeof character === 'object') {
    // Use imageUrl from API if available
    if (character.imageUrl) {
      return character.imageUrl;
    }
    
    // Fallback to generated avatar
    const name = character.name || 'Character';
    const seed = encodeURIComponent(name);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=1e293b,334155,475569&scale=110`;
  } else {
    // String input (just name)
    const seed = encodeURIComponent(character || 'default');
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=1e293b,334155,475569&scale=110`;
  }
}

/**
 * Get setting image URL with fallbacks based on setting type
 */
export function getSettingImage(setting: {
  imageUrl?: string;
  name?: string;
  settingType?: string;
  setting_type?: string;
  theme?: string;
}): string {
  // Use custom uploaded image if available
  if (setting.imageUrl) {
    return setting.imageUrl;
  }
  
  // Generate a default themed image based on setting type and name
  const settingName = setting.name || 'Setting';
  const settingType = setting.settingType || setting.setting_type || 'general';
  const seed = encodeURIComponent(`${settingName}-${settingType}`);
  
  // Return different default images based on setting type
  switch (settingType.toLowerCase()) {
    case 'fantasy':
      return `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'modern':
      return `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'sci-fi':
    case 'futuristic':
      return `https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'historical':
      return `https://images.unsplash.com/photo-1465188162913-8fb5709d6d57?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'outdoor':
    case 'nature':
      return `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'indoor':
    case 'room':
      return `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
    case 'general':
    default:
      return `https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&seed=${seed}`;
  }
}

/**
 * Generate a gradient background class based on content type
 */
export function getGradientBackground(type: string, name?: string): string {
  const gradients = {
    character: 'bg-gradient-to-br from-rose-600 to-pink-600',
    setting: 'bg-gradient-to-br from-purple-600 to-blue-600',
    location: 'bg-gradient-to-br from-green-600 to-teal-600',
    story: 'bg-gradient-to-br from-orange-600 to-red-600',
    default: 'bg-gradient-to-br from-slate-600 to-slate-800'
  };
  
  return gradients[type as keyof typeof gradients] || gradients.default;
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File, options: {
  maxSizeMB?: number;
  allowedTypes?: string[];
} = {}): { isValid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }
  
  return { isValid: true };
}

/**
 * Convert file to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get optimized image URL with specified dimensions
 */
export function getOptimizedImageUrl(url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
} = {}): string {
  const { width = 800, height = 600, quality = 80, format = 'webp' } = options;
  
  // If it's an Unsplash URL, add optimization parameters
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${width}&h=${height}&q=${quality}&fm=${format}`;
  }
  
  // If it's a DiceBear URL, add size parameter
  if (url.includes('dicebear.com')) {
    return url.includes('scale=') ? url : `${url}&scale=${Math.min(width, height) / 8}`;
  }
  
  return url;
}

/**
 * Create image placeholder with initials
 */
export function createInitialsPlaceholder(name: string, size: number = 200): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  // Simple SVG placeholder with initials
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#475569"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
            fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get appropriate emoji icon for content type
 */
export function getTypeIcon(type: string): string {
  const icons = {
    character: '👤',
    setting: '🌍',
    location: '📍',
    story: '📖',
    session: '💬',
    indoor: '🏠',
    outdoor: '🌳',
    fantasy: '🏰',
    modern: '🏙️',
    historical: '🏛️',
    futuristic: '🚀',
    'sci-fi': '🤖',
    romantic: '💕',
    adventure: '⚔️',
    mystery: '🔍',
    comedy: '😄',
    drama: '🎭'
  };
  
  return icons[type.toLowerCase() as keyof typeof icons] || '📄';
}