export interface ResponseTemplate {
  pattern: string;
  examples: string[];
}

export interface CharacterResponseTemplates {
  [characterName: string]: {
    greeting: ResponseTemplate;
    questioning: ResponseTemplate;
    caring: ResponseTemplate;
    mysterious: ResponseTemplate;
    wise: ResponseTemplate;
    general: ResponseTemplate;
  };
}

export class CharacterResponseBuilder {
  
  /**
   * Creates character-specific response templates to guide LLM output
   */
  public static createCharacterPrompt(
    characterName: string,
    archetype: string,
    primaryTrait: string,
    userMessage: string,
    characterGreeting?: string
  ): string {
    
    // Detect message type
    const messageType = this.detectMessageType(userMessage);
    
    // Build appropriate prompt based on character and message type
    const basePrompt = `You are ${characterName}, a ${archetype.toLowerCase()}. You are ${primaryTrait.toLowerCase()}.`;
    
    let guidance = '';
    switch (messageType) {
      case 'greeting':
        guidance = characterGreeting ? 
          `Respond with: "${characterGreeting}"` :
          `Respond warmly and introduce yourself briefly.`;
        break;
      case 'question':
        guidance = `Answer as ${characterName} would, showing your ${primaryTrait.toLowerCase()} nature.`;
        break;
      case 'statement':
        guidance = `Respond supportively as ${characterName}, reflecting your ${primaryTrait.toLowerCase()} personality.`;
        break;
      default:
        guidance = `Respond naturally as ${characterName}.`;
    }
    
    return `${basePrompt} ${guidance}

User: ${userMessage}
${characterName}:`;
  }

  /**
   * Detects the type of user message to tailor response
   */
  private static detectMessageType(message: string): 'greeting' | 'question' | 'statement' | 'other' {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }
    
    if (lowerMessage.includes('?') || lowerMessage.startsWith('what') || lowerMessage.startsWith('how') || 
        lowerMessage.startsWith('why') || lowerMessage.startsWith('when') || lowerMessage.startsWith('where')) {
      return 'question';
    }
    
    if (lowerMessage.includes('i ') || lowerMessage.includes('my ') || lowerMessage.includes('me ')) {
      return 'statement';
    }
    
    return 'other';
  }

  /**
   * Creates a stop-word controlled prompt that prevents hallucination
   */
  public static createControlledPrompt(
    characterName: string,
    archetype: string,
    primaryTrait: string,
    userMessage: string,
    characterGreeting?: string
  ): string {
    
    const prompt = this.createCharacterPrompt(characterName, archetype, primaryTrait, userMessage, characterGreeting);
    
    // Add instruction to stop after one response
    return `${prompt} [Respond with just one short message as ${characterName}. Do not continue the conversation.]`;
  }
}