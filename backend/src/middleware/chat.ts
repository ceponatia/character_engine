import { Server, Socket } from 'socket.io';
import { characterEngine } from '../services/character-engine';
import { llmService } from '../services/llm';

export interface ChatMessageData {
  characterId: string;
  message: string;
  userId?: string;
  conversationId?: string;
  sessionId?: string; // For session-based chats
  streaming?: boolean;
}

export interface TypingData {
  characterId: string;
  userId?: string;
  isTyping: boolean;
}

export class ChatMiddleware {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  handleJoinSession = (socket: Socket, sessionId: string) => {
    try {
      socket.join(`session_${sessionId}`);
      console.log(`🔗 User ${socket.id} joined session ${sessionId}`);
      
      socket.emit('session_joined', { sessionId });
    } catch (error) {
      console.error('❌ Error joining session:', error);
      socket.emit('session_error', {
        error: 'Failed to join session'
      });
    }
  };

  handleChatMessage = async (socket: Socket, data: ChatMessageData) => {
    try {
      console.log(`💬 Chat message received:`, {
        characterId: data.characterId,
        message: data.message.substring(0, 50) + '...',
        userId: data.userId || socket.id,
        streaming: data.streaming
      });

      // Validate required fields
      if (!data.characterId || !data.message) {
        socket.emit('chat_error', {
          error: 'Missing required fields: characterId and message are required'
        });
        return;
      }

      const userId = data.userId || socket.id;

      // Set character as typing
      characterEngine.setCharacterTyping(data.characterId, true);
      socket.emit('character_typing', {
        characterId: data.characterId,
        isTyping: true
      });

      if (data.streaming) {
        // Handle streaming response
        await this.handleStreamingResponse(socket, data, userId);
      } else {
        // Handle regular response
        await this.handleRegularResponse(socket, data, userId);
      }

    } catch (error) {
      console.error('❌ Chat message handling error:', error);
      
      // Clear typing state
      if (data.characterId) {
        characterEngine.setCharacterTyping(data.characterId, false);
        socket.emit('character_typing', {
          characterId: data.characterId,
          isTyping: false
        });
      }

      socket.emit('chat_error', {
        error: error instanceof Error ? error.message : 'Failed to process message'
      });
    }
  };

  private async handleRegularResponse(socket: Socket, data: ChatMessageData, userId: string) {
    try {
      const response = await characterEngine.generateCharacterResponse(
        data.characterId,
        data.message,
        userId,
        data.conversationId
      );

      // Clear typing state
      characterEngine.setCharacterTyping(data.characterId, false);
      socket.emit('character_typing', {
        characterId: data.characterId,
        isTyping: false
      });

      // Send complete response
      socket.emit('chat_response', {
        characterId: data.characterId,
        message: response.content,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        isComplete: true
      });

      console.log(`✅ Regular response sent for character ${data.characterId}`);

    } catch (error) {
      throw error; // Re-throw to be handled by main error handler
    }
  }

  private async handleStreamingResponse(socket: Socket, data: ChatMessageData, userId: string) {
    try {
      const messageId = `msg_${Date.now()}`;
      let accumulatedResponse = '';

      const response = await characterEngine.generateStreamingCharacterResponse(
        data.characterId,
        data.message,
        userId,
        (chunk: string) => {
          accumulatedResponse += chunk;
          
          // Send chunk to client
          socket.emit('chat_response_chunk', {
            characterId: data.characterId,
            chunk: chunk,
            messageId: messageId,
            timestamp: new Date().toISOString(),
            isComplete: false
          });
        },
        data.conversationId
      );

      // Clear typing state
      characterEngine.setCharacterTyping(data.characterId, false);
      socket.emit('character_typing', {
        characterId: data.characterId,
        isTyping: false
      });

      // Send completion signal
      socket.emit('chat_response_complete', {
        characterId: data.characterId,
        messageId: messageId,
        fullMessage: response.content,
        timestamp: new Date().toISOString(),
        isComplete: true
      });

      console.log(`✅ Streaming response completed for character ${data.characterId}`);

    } catch (error) {
      throw error; // Re-throw to be handled by main error handler
    }
  }

  handleTyping = (socket: Socket, data: TypingData) => {
    try {
      console.log(`⌨️ Typing event:`, {
        characterId: data.characterId,
        userId: data.userId || socket.id,
        isTyping: data.isTyping
      });

      // Broadcast typing status to other clients
      socket.broadcast.emit('user_typing', {
        userId: data.userId || socket.id,
        characterId: data.characterId,
        isTyping: data.isTyping
      });

    } catch (error) {
      console.error('❌ Typing handling error:', error);
      socket.emit('chat_error', {
        error: 'Failed to handle typing event'
      });
    }
  };

  handleGetConversationHistory = (socket: Socket, data: { characterId: string; userId?: string }) => {
    try {
      const userId = data.userId || socket.id;
      const history = characterEngine.getConversationHistory(data.characterId, userId);

      socket.emit('conversation_history', {
        characterId: data.characterId,
        messages: history.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp.toISOString()
        }))
      });

    } catch (error) {
      console.error('❌ Conversation history error:', error);
      socket.emit('chat_error', {
        error: 'Failed to retrieve conversation history'
      });
    }
  };

  handleClearConversation = (socket: Socket, data: { characterId: string; userId?: string }) => {
    try {
      const userId = data.userId || socket.id;
      characterEngine.clearConversationHistory(data.characterId, userId);

      socket.emit('conversation_cleared', {
        characterId: data.characterId,
        timestamp: new Date().toISOString()
      });

      console.log(`🗑️ Conversation cleared for character ${data.characterId} and user ${userId}`);

    } catch (error) {
      console.error('❌ Clear conversation error:', error);
      socket.emit('chat_error', {
        error: 'Failed to clear conversation'
      });
    }
  };

  handleGetCharacterState = (socket: Socket, data: { characterId: string }) => {
    try {
      const state = characterEngine.getCharacterState(data.characterId);

      socket.emit('character_state', {
        characterId: data.characterId,
        state: state || null
      });

    } catch (error) {
      console.error('❌ Character state error:', error);
      socket.emit('chat_error', {
        error: 'Failed to get character state'
      });
    }
  };

  // Health check for chat system
  async handleHealthCheck(socket: Socket) {
    try {
      const [characterHealth, llmHealth] = await Promise.all([
        characterEngine.healthCheck(),
        llmService.healthCheck()
      ]);

      socket.emit('chat_health', {
        character: characterHealth,
        llm: llmHealth,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Chat health check error:', error);
      socket.emit('chat_error', {
        error: 'Failed to perform health check'
      });
    }
  }
}

export default ChatMiddleware;