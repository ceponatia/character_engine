/**
 * Utility functions for parsing and formatting comma-separated tags
 */

/**
 * Parses a comma-separated string into an array of trimmed tags
 * @param input - Comma-separated string like "tag1, tag2, tag3"
 * @returns Array of trimmed strings, empty strings filtered out
 */
export function parseCommaSeparatedTags(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }
  
  return input
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Formats an array of tags into a comma-separated string
 * @param tags - Array of tag strings
 * @returns Comma-separated string like "tag1, tag2, tag3"
 */
export function formatTagsToCommaSeparated(tags: string[]): string {
  if (!Array.isArray(tags)) {
    return '';
  }
  
  return tags
    .filter(tag => tag && tag.trim().length > 0)
    .map(tag => tag.trim())
    .join(', ');
}

/**
 * Validates and cleans a tag array
 * @param tags - Array of tag strings
 * @returns Cleaned array with duplicates removed and empty strings filtered
 */
export function cleanTagArray(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  
  const cleaned = tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  
  // Remove duplicates (case-insensitive)
  const unique = cleaned.filter((tag, index) => 
    cleaned.findIndex(t => t.toLowerCase() === tag.toLowerCase()) === index
  );
  
  return unique;
}

/**
 * Processes form input for tag fields - handles both string and array inputs
 * @param input - Either a comma-separated string or array of strings
 * @returns Cleaned array of unique tags
 */
export function processTagInput(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return cleanTagArray(input);
  }
  
  if (typeof input === 'string') {
    const parsed = parseCommaSeparatedTags(input);
    return cleanTagArray(parsed);
  }
  
  return [];
}