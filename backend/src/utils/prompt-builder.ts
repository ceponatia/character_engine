import { Character } from '@prisma/client';

export interface CharacterPersonality {
  name: string;
  archetype: string;
  chatbotRole: string;
  description?: string;
  attire?: string;
  colors?: string[];
  features?: string;
  primaryTraits: string[];
  secondaryTraits: string[];
  quirks: string[];
  tone: string[];
  vocabulary?: string;
  approach?: string;
  demeanor?: string;
  greeting?: string;
  affirmation?: string;
  comfort?: string;
  forbiddenTopics: string[];
  interactionPolicy?: string;
}

export interface PromptTestConfig {
  strategy: 'minimal' | 'detailed' | 'structured' | 'examples' | 'conversational' | 'optimized';
  tokenBudget: number;
  includeHistory: boolean;
  includeExamples: boolean;
}

export interface ConversationContext {
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentMood?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration?: number;
  ragContext?: any; // RAG context from retrieval service
}

export class ImprovedPromptBuilder {
  
  // =================================================================
  // STRATEGY 1: MINIMAL PROMPT (50-100 tokens)
  // Best for: Fast responses, token-limited models, simple interactions
  // =================================================================
  public static buildMinimalPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    const primaryTrait = character.primaryTraits[0] || 'helpful';
    const tone = character.tone[0] || 'friendly';
    
    const prompt = `You are ${character.name}, a ${character.archetype}. Be ${primaryTrait} and ${tone}.

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  // =================================================================
  // STRATEGY 2: DETAILED COMPREHENSIVE PROMPT (300-500 tokens)
  // Best for: Complex personalities, nuanced responses, larger models
  // =================================================================
  public static buildDetailedPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    const sections = [];

    // Core Identity Section
    sections.push(`You are ${character.name}, ${character.description || character.archetype}.`);
    sections.push(`Your role: ${character.chatbotRole}`);

    // Personality Section
    if (character.primaryTraits.length > 0) {
      sections.push(`Primary traits: ${character.primaryTraits.join(', ')}`);
    }
    if (character.secondaryTraits.length > 0) {
      sections.push(`Secondary traits: ${character.secondaryTraits.join(', ')}`);
    }
    if (character.quirks.length > 0) {
      sections.push(`Quirks: ${character.quirks.join(', ')}`);
    }

    // Communication Style
    if (character.tone.length > 0) {
      sections.push(`Speaking tone: ${character.tone.join(', ')}`);
    }
    if (character.vocabulary) {
      sections.push(`Vocabulary: ${character.vocabulary}`);
    }
    if (character.approach) {
      sections.push(`Approach: ${character.approach}`);
    }

    // Conversation History
    if (context.recentMessages.length > 0) {
      const recentHistory = context.recentMessages
        .slice(-4)
        .map(msg => `${msg.role === 'user' ? 'User' : character.name}: ${msg.content}`)
        .join('\n');
      sections.push(`\nRecent conversation:\n${recentHistory}`);
    }

    // Boundaries
    if (character.forbiddenTopics.length > 0) {
      sections.push(`\nAvoid discussing: ${character.forbiddenTopics.join(', ')}`);
    }

    sections.push(`\nStay in character. Respond naturally as ${character.name}.`);

    const prompt = `${sections.join('\n\n')}

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  // =================================================================
  // STRATEGY 3: STRUCTURED BULLET-POINT PROMPT (200-300 tokens)
  // Best for: Clear organization, consistent formatting, mid-size models
  // =================================================================
  public static buildStructuredPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    const prompt = `CHARACTER: ${character.name}
ARCHETYPE: ${character.archetype}
ROLE: ${character.chatbotRole}

PERSONALITY:
• Primary: ${character.primaryTraits.slice(0, 3).join(', ')}
• Tone: ${character.tone.slice(0, 2).join(', ')}
• Style: ${character.vocabulary || 'conversational'}

BEHAVIOR:
• Approach: ${character.approach || 'warm and engaging'}
• Demeanor: ${character.demeanor || 'friendly'}
${character.quirks.length > 0 ? `• Quirks: ${character.quirks.slice(0, 2).join(', ')}` : ''}

${context.recentMessages.length > 0 ? `CONTEXT: ${context.recentMessages[context.recentMessages.length - 1]?.content.slice(0, 100)}...` : ''}

INSTRUCTIONS: Respond as ${character.name}. Stay in character. Do not include your name in the response.

User: ${userMessage}

Response:`;

    return prompt;
  }

  // =================================================================
  // STRATEGY 4: CONVERSATIONAL HISTORY-AWARE PROMPT (250-400 tokens)
  // Best for: Maintaining conversation flow, relationship building
  // =================================================================
  public static buildConversationalPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    let historySection = '';
    
    if (context.recentMessages.length > 0) {
      const messages = context.recentMessages.slice(-6);
      const formattedHistory = messages
        .map(msg => `${msg.role === 'user' ? 'User' : character.name}: ${msg.content}`)
        .join('\n');
      
      historySection = `\nConversation so far:\n${formattedHistory}\n`;
    }

    const moodContext = context.currentMood ? `\nCurrent mood: ${context.currentMood}` : '';
    const timeContext = context.timeOfDay ? `\nTime: ${context.timeOfDay}` : '';

    const prompt = `You are ${character.name}, a ${character.archetype}. 
${character.primaryTraits.length > 0 ? `You are ${character.primaryTraits.slice(0, 2).join(' and ')}.` : ''}
${character.tone.length > 0 ? `You speak in a ${character.tone[0]} manner.` : ''}
${character.approach ? `Your conversational approach: ${character.approach}` : ''}${moodContext}${timeContext}${historySection}
Continue the conversation naturally. Respond as ${character.name} (do not include your name in the response):

User: ${userMessage}

Response:`;

    return prompt;
  }
  
  /**
   * Builds an optimized prompt for character consistency with small models
   */
  public static buildOptimizedPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    
    // Create character description with key traits
    const characterDesc = this.buildCharacterDescription(character);
    
    // Build conversation context
    const conversationHistory = this.buildConversationHistory(context);
    
    // Create the prompt with clear role definition  
    const prompt = `${characterDesc}

${conversationHistory}

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  /**
   * Builds concise character description optimized for model understanding
   */
  private static buildCharacterDescription(character: CharacterPersonality): string {
    const traits = [...character.primaryTraits, ...character.secondaryTraits].slice(0, 5);
    const toneWords = character.tone.slice(0, 3);
    
    let desc = `You are ${character.name}.`;
    
    if (character.description) {
      desc += ` ${character.description}`;
    } else if (character.archetype) {
      desc += ` You are a ${character.archetype.toLowerCase()}.`;
    }
    
    if (character.chatbotRole) {
      desc += ` Your role: ${character.chatbotRole}`;
    }
    
    if (traits.length > 0) {
      desc += ` You are ${traits.join(', ')}.`;
    }
    
    if (toneWords.length > 0) {
      desc += ` You speak in a ${toneWords.join(', ')} manner.`;
    }
    
    // Add signature phrases if available
    if (character.greeting) {
      desc += ` You often greet people with phrases like "${character.greeting}"`;
    }
    
    if (character.quirks && character.quirks.length > 0) {
      const quirk = character.quirks[0];
      desc += ` You tend to ${quirk.toLowerCase()}.`;
    }
    
    desc += ` Always respond as ${character.name} would.`;
    
    return desc;
  }

  /**
   * Builds conversation history in a simple format
   */
  private static buildConversationHistory(context: ConversationContext): string {
    if (!context.recentMessages || context.recentMessages.length === 0) {
      return '';
    }

    const recentMessages = context.recentMessages
      .slice(-4) // Only last 4 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`)
      .join('\n');

    return recentMessages;
  }

  // =================================================================
  // STRATEGY 5: FEW-SHOT EXAMPLE-BASED PROMPT (400-600 tokens)
  // Best for: Consistent response patterns, teaching specific behaviors
  // =================================================================
  public static buildFewShotPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    
    const characterDesc = this.buildCharacterDescription(character);
    const examples = this.buildCharacterExamples(character);
    const conversationHistory = this.buildConversationHistory(context);
    
    const prompt = `${characterDesc}

Examples of how ${character.name} responds:
${examples}

${conversationHistory}

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  /**
   * Creates character-specific response examples
   */
  private static buildCharacterExamples(character: CharacterPersonality): string {
    const examples = [];
    
    // Use greeting as first example
    if (character.greeting) {
      examples.push(`User: Hello ${character.name}!
${character.name}: ${character.greeting}`);
    }
    
    // Create a trait-based example
    if (character.primaryTraits.length > 0) {
      const trait = character.primaryTraits[0];
      if (trait.toLowerCase().includes('wise')) {
        examples.push(`User: I'm feeling confused about something.
${character.name}: Take a moment to breathe, dear one. Clarity often comes when we step back and observe.`);
      } else if (trait.toLowerCase().includes('caring')) {
        examples.push(`User: I had a rough day.
${character.name}: I'm sorry to hear that. Would you like to talk about what happened?`);
      } else if (trait.toLowerCase().includes('mysterious')) {
        examples.push(`User: What are you thinking about?
${character.name}: The shadows hold many secrets... but some are meant to be discovered slowly.`);
      }
    }
    
    return examples.join('\n\n');
  }

  // =================================================================
  // STRATEGY 6: TEMPLATE-BASED RESPONSES (100-200 tokens)
  // Best for: Specific response patterns, consistent behavior
  // =================================================================
  public static buildTemplatePrompt(
    character: CharacterPersonality,
    userMessage: string,
    responseTemplate: string
  ): string {
    return `You are ${character.name}. Use this response pattern: "${responseTemplate}"

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;
  }

  // =================================================================
  // CHARACTER ENFORCEMENT SYSTEM - TINYLLAMA OPTIMIZED WITH RAG
  // =================================================================
  public static buildCharacterEnforcedPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] },
    strategy: 'minimal' | 'detailed' | 'structured' | 'examples' | 'conversational' | 'optimized' = 'optimized'
  ): string {
    // Check if we have RAG context
    if (context.ragContext) {
      return this.buildRAGEnhancedPrompt(character, userMessage, context);
    }

    // For TinyLlama, use simpler but effective character enforcement
    const traits = character.primaryTraits.slice(0, 3).join(', ');
    const tone = character.tone.slice(0, 2).join(', ');
    
    // Add conversation context if available
    let contextStr = '';
    if (context.recentMessages.length > 0) {
      const lastMsg = context.recentMessages[context.recentMessages.length - 1];
      if (lastMsg.role === 'assistant') {
        contextStr = `\nYou recently said: "${lastMsg.content.substring(0, 60)}..."`;
      }
    }

    // Include comprehensive physical appearance from database with specific hair color emphasis
    let appearanceStr = '';
    const appearanceParts = [];
    
    if (character.description) {
      appearanceParts.push(character.description);
    }
    if (character.features) {
      appearanceParts.push(`Your features: ${character.features}`);
    }
    if (character.attire) {
      appearanceParts.push(`You wear: ${character.attire}`);
    }
    
    if (appearanceParts.length > 0) {
      appearanceStr = `\nYour appearance: ${appearanceParts.join('. ')}`;
      
      // Add explicit hair color clarification for Luna
      if (character.name === 'Luna' && appearanceStr.includes('silver hair')) {
        appearanceStr += `\nIMPORTANT: Your hair color is SILVER, not purple. Purple refers to your robes/clothing.`;
      }
    }

    // Enhanced prompt for Nous-Hermes2 with better roleplay capabilities
    const prompt = `You are ${character.name}, a ${character.archetype}. You embody these traits: ${traits}. 
Your speaking style is ${tone}.${character.vocabulary ? ` Use ${character.vocabulary} language.` : ''}${appearanceStr}${contextStr}

You are currently in a romantic roleplay scenario. Respond naturally and in character. Be creative, emotionally engaging, and maintain the personality and boundaries defined for ${character.name}.

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  // =================================================================
  // RAG-ENHANCED PROMPT BUILDING
  // =================================================================
  public static buildRAGEnhancedPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext
  ): string {
    const ragContext = context.ragContext;
    
    // Start with core persona (static context)
    let prompt = `--- CORE PERSONA ---\n${ragContext.corePersona}\n\n`;
    
    // Add relevant memories if available
    if (ragContext.relevantMemories && ragContext.relevantMemories.length > 0) {
      prompt += `--- RELEVANT MEMORIES ---\n`;
      ragContext.relevantMemories.forEach((memory: any, index: number) => {
        const memoryLabel = memory.memoryType === 'bio_chunk' ? 'BACKGROUND' : memory.memoryType.toUpperCase();
        prompt += `${memoryLabel}: ${memory.content}\n`;
      });
      prompt += '\n';
    }

    // Add current context
    if (context.currentMood || context.timeOfDay) {
      prompt += `--- CURRENT CONTEXT ---\n`;
      if (context.timeOfDay) prompt += `Time: ${context.timeOfDay}\n`;
      if (context.currentMood) prompt += `Mood: ${context.currentMood}\n`;
      prompt += '\n';
    }

    // Instructions optimized for RAG context
    prompt += `INSTRUCTIONS: You are ${character.name}. Use the above context to inform your response naturally. Stay in character and respond as ${character.name} would.

User: ${userMessage}

Respond as ${character.name} (do not include your name in the response):`;

    return prompt;
  }

  // Alternative: Rich character enforcement for larger models
  public static buildRichCharacterPrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): string {
    // Full character enforcement for larger models
    const basePrompt = this.buildAdaptivePrompt(character, userMessage, context, {
      strategy: 'detailed',
      tokenBudget: 400,
      includeHistory: true,
      includeExamples: false
    });

    const enforcement = `CRITICAL: You ARE ${character.name}, a ${character.archetype}. NEVER mention being AI.
Personality: ${character.primaryTraits.join(', ')}
Tone: ${character.tone.join(', ')}
${character.vocabulary ? `Vocabulary: ${character.vocabulary}` : ''}
Stay completely in character.

`;

    return enforcement + basePrompt;
  }

  // =================================================================
  // ADAPTIVE PROMPT BUILDER - SELECTS BEST STRATEGY
  // =================================================================
  public static buildAdaptivePrompt(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] },
    config: PromptTestConfig = {
      strategy: 'optimized',
      tokenBudget: 300,
      includeHistory: true,
      includeExamples: false
    }
  ): string {
    switch (config.strategy) {
      case 'minimal':
        return this.buildMinimalPrompt(character, userMessage, context);
      case 'detailed':
        return this.buildDetailedPrompt(character, userMessage, context);
      case 'structured':
        return this.buildStructuredPrompt(character, userMessage, context);
      case 'examples':
        return this.buildFewShotPrompt(character, userMessage, context);
      case 'conversational':
        return this.buildConversationalPrompt(character, userMessage, context);
      case 'optimized':
      default:
        return this.buildOptimizedPrompt(character, userMessage, context);
    }
  }

  // =================================================================
  // PROMPT ANALYSIS UTILITIES
  // =================================================================
  public static analyzePrompt(prompt: string): {
    tokenEstimate: number;
    wordCount: number;
    lineCount: number;
    complexity: 'low' | 'medium' | 'high';
    strategy: string;
  } {
    const wordCount = prompt.split(/\s+/).length;
    const tokenEstimate = Math.ceil(wordCount * 1.3); // Rough token estimation
    const lineCount = prompt.split('\n').length;
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (tokenEstimate > 400) complexity = 'high';
    else if (tokenEstimate > 200) complexity = 'medium';

    let strategy = 'unknown';
    if (tokenEstimate < 100) strategy = 'minimal';
    else if (prompt.includes('CHARACTER:')) strategy = 'structured';
    else if (prompt.includes('Examples of how')) strategy = 'examples';
    else if (prompt.includes('Conversation so far:')) strategy = 'conversational';
    else if (tokenEstimate > 300) strategy = 'detailed';
    else strategy = 'optimized';

    return {
      tokenEstimate,
      wordCount,
      lineCount,
      complexity,
      strategy
    };
  }

  // Test all strategies and compare results
  public static compareAllStrategies(
    character: CharacterPersonality,
    userMessage: string,
    context: ConversationContext = { recentMessages: [] }
  ): Record<string, { prompt: string; analysis: any }> {
    const strategies = ['minimal', 'detailed', 'structured', 'examples', 'conversational', 'optimized'] as const;
    const results: Record<string, { prompt: string; analysis: any }> = {};

    strategies.forEach(strategy => {
      const prompt = this.buildAdaptivePrompt(character, userMessage, context, {
        strategy,
        tokenBudget: 400,
        includeHistory: true,
        includeExamples: strategy === 'examples'
      });
      results[strategy] = {
        prompt,
        analysis: this.analyzePrompt(prompt)
      };
    });

    return results;
  }

  // Legacy minimal prompt method (now replaced by Strategy 1)
  public static buildLegacyMinimalPrompt(
    character: CharacterPersonality,
    userMessage: string
  ): string {
    const name = character.name;
    const role = character.archetype || character.chatbotRole || 'companion';
    const trait = character.primaryTraits[0] || 'caring';
    
    return `You are ${name}, a ${role.toLowerCase()}. You are ${trait.toLowerCase()}. Respond as ${name}.

User: ${userMessage}
${name}:`;
  }

  /**
   * Parse character from database format (now using native arrays)
   */
  public static parseCharacterFromDB(dbCharacter: Character): CharacterPersonality {
    return {
      name: dbCharacter.name,
      archetype: dbCharacter.archetype || '',
      chatbotRole: dbCharacter.chatbotRole || '',
      description: dbCharacter.description || undefined,
      attire: dbCharacter.attire || undefined,
      colors: dbCharacter.colors || undefined,
      features: dbCharacter.features || undefined,
      primaryTraits: dbCharacter.primaryTraits || [],
      secondaryTraits: dbCharacter.secondaryTraits || [],
      quirks: dbCharacter.quirks || [],
      tone: dbCharacter.tone || [],
      vocabulary: dbCharacter.vocabulary || undefined,
      approach: dbCharacter.approach || undefined,
      demeanor: dbCharacter.demeanor || undefined,
      greeting: dbCharacter.greeting || undefined,
      affirmation: dbCharacter.affirmation || undefined,
      comfort: dbCharacter.comfort || undefined,
      forbiddenTopics: dbCharacter.forbiddenTopics || [],
      interactionPolicy: dbCharacter.interactionPolicy || undefined
    };
  }

  // No longer needed - using native arrays
  private static parseJSONField(field: string[] | null): string[] {
    return field || [];
  }
}