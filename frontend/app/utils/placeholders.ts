/**
 * Utility functions for processing text placeholders like {{user}} and {{char}}
 */

/**
 * Process text placeholders with actual values
 * @param text - Text containing placeholders
 * @param userName - User name to replace {{user}} with (defaults to 'User')
 * @param characterName - Character name to replace {{char}} with
 * @returns Text with placeholders replaced
 */
export function processTextPlaceholders(
  text: string, 
  userName?: string, 
  characterName?: string
): string {
  if (!text) return text;
  
  let processedText = text;
  
  // Replace {{user}} with actual user name or default to 'User'
  const finalUserName = userName && userName.trim() ? userName.trim() : 'User';
  processedText = processedText.replace(/\{\{user\}\}/gi, finalUserName);
  
  // Replace {{char}} with character name if provided
  if (characterName && characterName.trim()) {
    processedText = processedText.replace(/\{\{char\}\}/gi, characterName.trim());
  }
  
  return processedText;
}

/**
 * Process character placeholders specifically for character creation/editing
 * Used in character builder to replace {{char}} with character name before saving
 * @param text - Text containing {{char}} placeholders
 * @param characterName - Character name to replace {{char}} with
 * @returns Text with {{char}} replaced with character name
 */
export function processCharacterPlaceholders(text: string, characterName: string): string {
  if (!text || !characterName) return text;
  
  return text.replace(/\{\{char\}\}/gi, characterName.trim());
}

/**
 * Process user message placeholders for display in chat
 * Used to show processed text in chat history while keeping {{char}} for LLM
 * @param text - User message text
 * @param userName - User name to replace {{user}} with
 * @param characterName - Character name to replace {{char}} with
 * @returns Text with placeholders replaced for display
 */
export function processMessageDisplayPlaceholders(
  text: string, 
  userName?: string, 
  characterName?: string
): string {
  return processTextPlaceholders(text, userName, characterName);
}

/**
 * Transform asterisk text to HTML for chat display
 * Converts *text* to styled italics while preserving original in database
 * @param text - Text containing asterisk formatting
 * @param isUserMessage - Whether this is a user message (for styling)
 * @returns HTML string with asterisk text converted to styled italics
 */
export function transformAsteriskToItalics(text: string, isUserMessage: boolean = false): string {
  if (!text) return text;
  
  // Different styling for user vs character messages
  const italicClass = isUserMessage 
    ? 'italic opacity-70 text-pink-100' // Lighter pink for user messages on red background
    : 'italic opacity-50 text-slate-300'; // Gray for character messages
  
  // Replace *text* with styled italics using appropriate classes
  return text.replace(/\*([^*]+)\*/g, `<em class="${italicClass}">$1</em>`);
}

/**
 * Complete chat message transformation for display
 * Processes placeholders and converts asterisk formatting to HTML
 * @param text - Raw message text
 * @param userName - User name for {{user}} replacement
 * @param characterName - Character name for {{char}} replacement
 * @param isUserMessage - Whether this is a user message (for styling)
 * @returns Fully processed HTML string for display
 */
export function transformChatMessageForDisplay(
  text: string,
  userName?: string,
  characterName?: string,
  isUserMessage: boolean = false
): string {
  // First process placeholders
  const processedPlaceholders = processTextPlaceholders(text, userName, characterName);
  
  // Then convert asterisk formatting to italics with appropriate styling
  return transformAsteriskToItalics(processedPlaceholders, isUserMessage);
}