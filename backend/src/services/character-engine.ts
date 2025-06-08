import { Character } from '@prisma/client';
import { prisma } from '../utils/database';
import { ImprovedPromptBuilder, CharacterPersonality, ConversationContext, PromptTestConfig } from '../utils/prompt-builder';
import { CharacterTemplateEngine } from '../utils/character-templates';
import { llmService, LLMResponse } from './llm';
import { ragRetrievalService, RAGContext } from './rag-retrieval';

export interface ChatMessage {
  id: string;
  characterId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface CharacterState {
  characterId: string;
  mood?: string;
  location?: string;
  isTyping: boolean;
  lastActive: Date;
}

export interface SessionContext {
  userName?: string;
  character?: {
    name: string;
    id: string;
  };
  currentLocation?: string;
  timeOfDay?: string;
  sessionId?: string;
}

export interface CharacterEngineConfig {
  promptStrategy: 'minimal' | 'detailed' | 'structured' | 'examples' | 'conversational' | 'optimized';
  useImprovedPrompts: boolean;
  useRAG: boolean;
  tokenBudget: number;
  includeHistory: boolean;
  includeExamples: boolean;
}

export class CharacterEngine {
  private characterStates: Map<string, CharacterState> = new Map();
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private config: CharacterEngineConfig = {
    promptStrategy: 'optimized',
    useImprovedPrompts: true,
    useRAG: true,
    tokenBudget: 300,
    includeHistory: true,
    includeExamples: false
  };

  async getCharacter(characterId: string): Promise<Character | null> {
    try {
      const character = await prisma.character.findUnique({
        where: { id: characterId }
      });
      return character;
    } catch (error) {
      console.error('Error fetching character:', error);
      return null;
    }
  }

  async generateCharacterResponse(
    characterId: string,
    userMessage: string,
    userId: string,
    conversationId?: string
  ): Promise<LLMResponse> {
    try {
      // Get character from database
      const dbCharacter = await this.getCharacter(characterId);
      if (!dbCharacter) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      // Convert to character personality format
      const character = this.config.useImprovedPrompts 
        ? ImprovedPromptBuilder.parseCharacterFromDB(dbCharacter)
        : ImprovedPromptBuilder.parseCharacterFromDB(dbCharacter);

      // Create session context for template processing
      const sessionContext: SessionContext = {
        userName: 'user', // Default until user profiles are implemented
        character: {
          name: dbCharacter.name,
          id: dbCharacter.id
        },
        currentLocation: this.characterStates.get(characterId)?.location,
        timeOfDay: this.getTimeOfDay(),
        sessionId: conversationId
      };

      // Process user message for template variables
      const processedUserMessage = this.processMessageTemplates(userMessage, sessionContext);

      // Get conversation context
      const context = await this.getConversationContext(characterId, userId, conversationId, processedUserMessage);

      // Add user message to history
      const userChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        characterId,
        userId,
        content: processedUserMessage,
        role: 'user',
        timestamp: new Date()
      };
      this.addMessageToHistory(characterId, userChatMessage);

      // HYBRID APPROACH: Check if we should use template or dynamic response
      const messageType = CharacterTemplateEngine.detectMessageType(processedUserMessage);
      const useTemplate = CharacterTemplateEngine.shouldUseTemplate(character, processedUserMessage);

      let prompt: string;
      if (useTemplate) {
        // Use template for reliable responses (greetings, comfort) WITH appearance data
        const templateResponse = CharacterTemplateEngine.getTemplateResponse(character, messageType);
        if (this.config.useImprovedPrompts) {
          // Use the enhanced prompt builder for templates too
          prompt = ImprovedPromptBuilder.buildCharacterEnforcedPrompt(
            character,
            processedUserMessage,
            context,
            'minimal'
          );
          console.log(`📋 Using enhanced template with appearance for ${messageType}: "${templateResponse}"`);
        } else {
          prompt = ImprovedPromptBuilder.buildTemplatePrompt(character, processedUserMessage, templateResponse);
          console.log(`📋 Using legacy template for ${messageType}: "${templateResponse}"`);
        }
      } else {
        // Use dynamic LLM generation for conversations with character enforcement
        if (this.config.useImprovedPrompts) {
          prompt = ImprovedPromptBuilder.buildCharacterEnforcedPrompt(
            character,
            processedUserMessage,
            context,
            this.config.promptStrategy
          );
          console.log(`🎭 Using improved ${this.config.promptStrategy} strategy with character enforcement`);
        } else {
          prompt = ImprovedPromptBuilder.buildOptimizedPrompt(character, processedUserMessage, context);
          console.log(`🎭 Using legacy prompt builder`);
        }
      }

      // Update character state
      this.updateCharacterState(characterId, { isTyping: true });

      // Generate response
      console.log(`🎭 Generating response for character: ${character.name}`);
      const response = await llmService.generateResponse(prompt);

      // Clean up response to remove character name prefix and process template variables
      const cleanedContent = this.cleanCharacterResponse(response.content, character.name, sessionContext);

      // Add assistant response to history
      const assistantChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        characterId,
        userId,
        content: cleanedContent,
        role: 'assistant',
        timestamp: new Date()
      };
      this.addMessageToHistory(characterId, assistantChatMessage);

      // Update character state
      this.updateCharacterState(characterId, { isTyping: false, lastActive: new Date() });

      console.log(`✅ Response generated for ${character.name}: ${cleanedContent.substring(0, 100)}...`);
      return {
        ...response,
        content: cleanedContent
      };

    } catch (error) {
      // Update character state on error
      this.updateCharacterState(characterId, { isTyping: false });
      
      console.error('Character response generation error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStreamingCharacterResponse(
    characterId: string,
    userMessage: string,
    userId: string,
    onChunk: (chunk: string) => void,
    conversationId?: string
  ): Promise<LLMResponse> {
    try {
      const dbCharacter = await this.getCharacter(characterId);
      if (!dbCharacter) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      const character = this.config.useImprovedPrompts 
        ? ImprovedPromptBuilder.parseCharacterFromDB(dbCharacter)
        : ImprovedPromptBuilder.parseCharacterFromDB(dbCharacter);
      
      // Create session context for template processing
      const sessionContext: SessionContext = {
        userName: 'user', // Default until user profiles are implemented
        character: {
          name: dbCharacter.name,
          id: dbCharacter.id
        },
        currentLocation: this.characterStates.get(characterId)?.location,
        timeOfDay: this.getTimeOfDay(),
        sessionId: conversationId
      };
      
      // Process user message for template variables
      const processedUserMessage = this.processMessageTemplates(userMessage, sessionContext);
      const context = await this.getConversationContext(characterId, userId, conversationId, processedUserMessage);

      // Add user message to history
      const userChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        characterId,
        userId,
        content: processedUserMessage,
        role: 'user',
        timestamp: new Date()
      };
      this.addMessageToHistory(characterId, userChatMessage);

      // Use same hybrid approach for streaming
      const messageType = CharacterTemplateEngine.detectMessageType(processedUserMessage);
      const useTemplate = CharacterTemplateEngine.shouldUseTemplate(character, processedUserMessage);

      let prompt: string;
      if (useTemplate) {
        const templateResponse = CharacterTemplateEngine.getTemplateResponse(character, messageType);
        if (this.config.useImprovedPrompts) {
          // Use the enhanced prompt builder for templates too
          prompt = ImprovedPromptBuilder.buildCharacterEnforcedPrompt(
            character,
            processedUserMessage,
            context,
            'minimal'
          );
        } else {
          prompt = ImprovedPromptBuilder.buildTemplatePrompt(character, processedUserMessage, templateResponse);
        }
      } else {
        if (this.config.useImprovedPrompts) {
          prompt = ImprovedPromptBuilder.buildCharacterEnforcedPrompt(
            character,
            processedUserMessage,
            context,
            this.config.promptStrategy
          );
        } else {
          prompt = ImprovedPromptBuilder.buildOptimizedPrompt(character, processedUserMessage, context);
        }
      }

      // Update character state
      this.updateCharacterState(characterId, { isTyping: true });

      // Generate streaming response with cleaned chunks
      console.log(`🎭 Generating streaming response for character: ${character.name}`);
      let accumulatedResponse = '';
      let isFirstChunk = true;
      
      const response = await llmService.generateStreamingResponse(prompt, (chunk: string) => {
        // Clean the first chunk to remove character name prefix
        if (isFirstChunk) {
          const cleanedChunk = this.cleanCharacterResponse(chunk, character.name, sessionContext);
          accumulatedResponse += cleanedChunk;
          onChunk(cleanedChunk);
          isFirstChunk = false;
        } else {
          accumulatedResponse += chunk;
          onChunk(chunk);
        }
      });

      // Clean the final accumulated response
      const cleanedContent = this.cleanCharacterResponse(accumulatedResponse, character.name, sessionContext);

      // Add assistant response to history
      const assistantChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        characterId,
        userId,
        content: cleanedContent,
        role: 'assistant',
        timestamp: new Date()
      };
      this.addMessageToHistory(characterId, assistantChatMessage);

      // Update character state
      this.updateCharacterState(characterId, { isTyping: false, lastActive: new Date() });

      return {
        ...response,
        content: cleanedContent
      };

    } catch (error) {
      this.updateCharacterState(characterId, { isTyping: false });
      console.error('Streaming character response error:', error);
      throw error;
    }
  }

  private async getConversationContext(
    characterId: string,
    userId: string,
    conversationId?: string,
    userMessage?: string
  ): Promise<ConversationContext> {
    // Base context with current state
    const baseContext: ConversationContext = {
      recentMessages: [],
      currentMood: this.characterStates.get(characterId)?.mood,
      timeOfDay: this.getTimeOfDay(),
      sessionDuration: this.getSessionDuration(characterId)
    };

    if (this.config.useRAG && userMessage) {
      // Use RAG for intelligent context retrieval
      try {
        const ragContext = await ragRetrievalService.getCharacterContextForLLM(
          characterId,
          userMessage,
          {
            maxResults: 2, // Limit to avoid token overload
            minSimilarity: 0.6, // Lower threshold for broader relevance
          }
        );

        // Convert RAG memories to conversation context format
        const ragMessages = ragContext.relevantMemories.map(memory => ({
          role: 'assistant' as const,
          content: `[MEMORY: ${memory.memoryType}] ${memory.content}`,
          timestamp: memory.createdAt,
        }));

        return {
          ...baseContext,
          recentMessages: ragMessages,
          ragContext: ragContext, // Add RAG context for prompt building
        };
      } catch (error) {
        console.error('RAG retrieval failed, falling back to conversation history:', error);
      }
    }

    // Fallback to traditional conversation history
    const historyKey = conversationId || `${characterId}_${userId}`;
    const messages = this.conversationHistory.get(historyKey) || [];

    // Get recent messages (last 10)
    const recentMessages = messages
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

    return {
      ...baseContext,
      recentMessages,
    };
  }

  private addMessageToHistory(characterId: string, message: ChatMessage): void {
    const historyKey = `${characterId}_${message.userId}`;
    const existing = this.conversationHistory.get(historyKey) || [];
    
    // Keep last 50 messages per conversation
    const updated = [...existing, message].slice(-50);
    this.conversationHistory.set(historyKey, updated);
  }

  // Add method to clear conversation history for testing
  clearAllConversationHistory(): void {
    this.conversationHistory.clear();
    console.log('🧹 All conversation history cleared');
  }

  clearConversationHistoryForCharacter(characterId: string): void {
    const keysToDelete: string[] = [];
    this.conversationHistory.forEach((_, key) => {
      if (key.startsWith(characterId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.conversationHistory.delete(key));
    console.log(`🧹 Conversation history cleared for character ${characterId}`);
  }

  private updateCharacterState(characterId: string, updates: Partial<CharacterState>): void {
    const existing = this.characterStates.get(characterId) || {
      characterId,
      isTyping: false,
      lastActive: new Date()
    };

    this.characterStates.set(characterId, { ...existing, ...updates });
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getSessionDuration(characterId: string): number {
    const state = this.characterStates.get(characterId);
    if (!state?.lastActive) return 0;
    return Date.now() - state.lastActive.getTime();
  }

  // Public methods for managing character states
  getCharacterState(characterId: string): CharacterState | undefined {
    return this.characterStates.get(characterId);
  }

  setCharacterTyping(characterId: string, isTyping: boolean): void {
    this.updateCharacterState(characterId, { isTyping });
  }

  getConversationHistory(characterId: string, userId: string): ChatMessage[] {
    const historyKey = `${characterId}_${userId}`;
    return this.conversationHistory.get(historyKey) || [];
  }

  clearConversationHistory(characterId: string, userId: string): void {
    const historyKey = `${characterId}_${userId}`;
    this.conversationHistory.delete(historyKey);
  }

  // Configuration management methods
  setPromptStrategy(strategy: CharacterEngineConfig['promptStrategy']): void {
    this.config.promptStrategy = strategy;
    console.log(`🔧 Prompt strategy updated to: ${strategy}`);
  }

  setTokenBudget(budget: number): void {
    this.config.tokenBudget = budget;
    console.log(`🔧 Token budget updated to: ${budget}`);
  }

  toggleImprovedPrompts(enabled: boolean): void {
    this.config.useImprovedPrompts = enabled;
    console.log(`🔧 Improved prompts ${enabled ? 'enabled' : 'disabled'}`);
  }

  getConfig(): CharacterEngineConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CharacterEngineConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log(`🔧 Character engine config updated:`, updates);
  }


  // Test different prompt strategies for a character
  async testPromptStrategies(
    characterId: string,
    userMessage: string,
    userId: string
  ): Promise<Record<string, { prompt: string; analysis: any }>> {
    const dbCharacter = await this.getCharacter(characterId);
    if (!dbCharacter) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    const character = ImprovedPromptBuilder.parseCharacterFromDB(dbCharacter);
    const context = await this.getConversationContext(characterId, userId);

    const results = ImprovedPromptBuilder.compareAllStrategies(character, userMessage, context);
    
    console.log(`🧪 Tested all prompt strategies for character: ${character.name}`);
    Object.entries(results).forEach(([strategy, data]) => {
      console.log(`  ${strategy}: ${(data as any).analysis?.tokenEstimate || 'unknown'} tokens, ${(data as any).analysis?.complexity || 'unknown'} complexity`);
    });

    return results;
  }

  async healthCheck(): Promise<{ 
    status: string; 
    activeCharacters: number; 
    totalMessages: number;
    config: CharacterEngineConfig;
  }> {
    const activeCharacters = this.characterStates.size;
    const totalMessages = Array.from(this.conversationHistory.values())
      .reduce((total, messages) => total + messages.length, 0);

    return {
      status: 'healthy',
      activeCharacters,
      totalMessages,
      config: this.getConfig()
    };
  }

  /**
   * Enhanced template processing with session context support
   */
  private processMessageTemplates(message: string, sessionContext?: any): string {
    let processedMessage = message;
    
    // Replace {{user}} with actual username or default
    processedMessage = processedMessage.replace(/\{\{user\}\}/gi, sessionContext?.userName || 'user');
    
    // Replace {{character_name}} with character name
    if (sessionContext?.character?.name) {
      processedMessage = processedMessage.replace(/\{\{character_name\}\}/gi, sessionContext.character.name);
    }
    
    // Replace {{location}} with current location
    if (sessionContext?.currentLocation) {
      processedMessage = processedMessage.replace(/\{\{location\}\}/gi, sessionContext.currentLocation);
    } else {
      processedMessage = processedMessage.replace(/\{\{location\}\}/gi, 'here');
    }
    
    // Replace {{time_of_day}} with current time
    if (sessionContext?.timeOfDay) {
      processedMessage = processedMessage.replace(/\{\{time_of_day\}\}/gi, sessionContext.timeOfDay);
    } else {
      processedMessage = processedMessage.replace(/\{\{time_of_day\}\}/gi, this.getTimeOfDay());
    }
    
    // Debug logging to track template replacement
    if (message !== processedMessage) {
      console.log(`🔧 Template variables processed: "${message}" → "${processedMessage}"`);
    }
    
    return processedMessage;
  }

  /**
   * Clean character response to remove character name prefix and process any template variables
   */
  private cleanCharacterResponse(response: string, characterName: string, sessionContext?: SessionContext): string {
    let cleanedResponse = response.trim();
    
    // Handle completely empty or meta responses
    if (!cleanedResponse || 
        cleanedResponse === '(Still in character)' || 
        cleanedResponse === '(still in character)' ||
        cleanedResponse.match(/^\([^)]*\)$/)) {
      return "I'm here with you."; // Fallback response
    }
    
    // Common patterns where character name appears at the beginning
    const patterns = [
      new RegExp(`^${characterName}:\\s*`, 'i'),           // "Character: "
      new RegExp(`^${characterName}\\s*-\\s*`, 'i'),      // "Character - "
      new RegExp(`^${characterName}\\s*says:\\s*`, 'i'),  // "Character says: "
      new RegExp(`^${characterName}\\s*replies:\\s*`, 'i'), // "Character replies: "
      new RegExp(`^${characterName}\\s*responds:\\s*`, 'i'), // "Character responds: "
      new RegExp(`^"${characterName}:\\s*`, 'i'),         // "Character: (with quotes)
      new RegExp(`^.*Character:\\s*`, 'i'),               // Any variation of "Character:"
      new RegExp(`^Test\\s*Character:\\s*`, 'i'),         // "Test Character:"
    ];

    // Remove character name prefix if found
    for (const pattern of patterns) {
      if (pattern.test(cleanedResponse)) {
        cleanedResponse = cleanedResponse.replace(pattern, '').trim();
        break;
      }
    }

    // Remove parenthetical meta-comments
    cleanedResponse = cleanedResponse.replace(/^\([^)]*\)\s*/, '');
    
    // Remove leading quotes if the response started with them after cleaning
    if (cleanedResponse.startsWith('"') && !response.trim().startsWith('"')) {
      cleanedResponse = cleanedResponse.substring(1);
    }

    // Process any template variables that appeared in the LLM output
    if (sessionContext) {
      cleanedResponse = this.processMessageTemplates(cleanedResponse, sessionContext);
    }
    
    // If response is still empty after cleaning, provide fallback
    if (!cleanedResponse.trim()) {
      return "I'm listening.";
    }

    return cleanedResponse;
  }
}

// Singleton instance for the application
export const characterEngine = new CharacterEngine();