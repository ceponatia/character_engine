/**
 * Utility functions for parsing and formatting database fields
 * Used across LibraryTemplate and individual detail pages
 */

/**
 * Capitalizes the first letter of each word, including after commas
 * @param text - The text to capitalize
 * @returns Text with proper capitalization
 */
const capitalizeWords = (text: string): string => {
  return text
    .split(', ')
    .map(part => part.trim())
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(', ');
};

/**
 * Parses JSON string fields (like mood, theme arrays) into readable text
 * @param value - The field value that might be a JSON string
 * @returns Formatted string with array values joined by commas
 */
export const parseJsonField = (value: string | undefined): string => {
  if (!value) return '';
  
  // If it's already a regular string, return as-is
  if (!value.startsWith('[') && !value.startsWith('{')) {
    return value;
  }
  
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.join(', ');
    }
    return value;
  } catch {
    return value;
  }
};

/**
 * Parses theme field specifically (should show only first value)
 * @param value - The theme field value that might be a JSON string
 * @returns First theme value only (since theme should be single), properly capitalized
 */
export const parseThemeField = (value: string | undefined): string => {
  const parsed = parseJsonField(value);
  // For theme, take only the first value since it should be single
  const themeValue = parsed.split(', ')[0] || parsed;
  return capitalizeWords(themeValue);
};

/**
 * Parses mood field with proper capitalization
 * @param value - The mood field value that might be a JSON string
 * @returns Properly formatted and capitalized mood values
 */
export const parseMoodField = (value: string | undefined): string => {
  const parsed = parseJsonField(value);
  return capitalizeWords(parsed);
};

/**
 * Parses time of day field with proper capitalization
 * @param value - The timeOfDay field value
 * @returns Properly formatted and capitalized time of day
 */
export const parseTimeOfDayField = (value: string | undefined): string => {
  if (!value) return '';
  return capitalizeWords(value);
};

/**
 * Parses a field with field-specific logic
 * @param value - The field value
 * @param fieldName - The name of the field (for special handling)
 * @returns Properly formatted field value
 */
export const parseFieldValue = (value: string | undefined, fieldName: string): string => {
  switch (fieldName) {
    case 'theme':
      return parseThemeField(value);
    case 'mood':
      return parseMoodField(value);
    case 'timeOfDay':
      return parseTimeOfDayField(value);
    case 'tags':
    default:
      return parseJsonField(value);
  }
};

/**
 * Parses multiple metadata fields for display
 * @param item - The data item
 * @param fieldNames - Array of field names to parse
 * @param getNestedValue - Function to get nested values from objects
 * @returns Array of parsed field values
 */
export const parseMetadataFields = (
  item: any, 
  fieldNames: string[], 
  getNestedValue: (obj: any, path: string) => any
): string[] => {
  return fieldNames
    .map(field => {
      const value = getNestedValue(item, field);
      if (!value) return null;
      
      return parseFieldValue(value, field);
    })
    .filter(Boolean)
    .slice(0, 3); // Limit to 3 tags for UI consistency
};