import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';
// Types will be defined inline since we're using the new schema structure
import { safeLLMRequest, resourceCheckMiddleware } from '../middleware/llm-safety';

const app = new Hono();

// Apply resource check middleware to LLM-related endpoints
app.use('/*/generate', resourceCheckMiddleware);

/**
 * Get all chat sessions
 * GET /api/chat-sessions
 */
app.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    
    // First get chat sessions without joins
    let query = supabase
      .from('chat_sessions')
      .select('*')
      .order('last_activity', { ascending: false });
      
    if (limit) {
      query = query.limit(limit);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    return c.json({ 
      success: true,
      sessions: sessions || [],
      count: sessions?.length || 0
    });
  } catch (error: any) {
    console.error('Failed to fetch chat sessions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch chat sessions',
      message: error.message
    }, 500);
  }
});

/**
 * Create new chat session
 * POST /api/chat-sessions
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Handle both single character and story config formats
    let character_id, title, user_id, sessionData;
    
    if (body.character_id) {
      // Single character format (legacy)
      ({ character_id, title, user_id } = body);
      
      if (!character_id) {
        return c.json({
          success: false,
          error: 'Missing required field: character_id'
        }, 400);
      }

      sessionData = {
        name: title || `Chat with Character`,
        owner_id: user_id || null,
        setting_id: null,
        character_id: character_id
      };
    } else if (body.settingId && body.characters) {
      // Story config format (new)
      const { settingId, characters } = body;
      
      if (!characters || characters.length === 0) {
        return c.json({
          success: false,
          error: 'At least one character is required for story'
        }, 400);
      }

      // Use first character as primary for now (single character session)
      const primaryCharacter = characters[0];
      character_id = primaryCharacter.characterId;
      
      sessionData = {
        name: title || `Story Session`,
        owner_id: user_id || null,
        setting_id: settingId,
        character_id: character_id
      };
    } else {
      return c.json({
        success: false,
        error: 'Missing required fields: either character_id or settingId with characters'
      }, 400);
    }

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;

    // Character relationship is now directly in the session via character_id

    // Create initial message(s) - get character info first
    if (character_id) {
      const { data: character, error: charError } = await supabase
        .from('characters')
        .select('id, name, greeting')
        .eq('id', character_id)
        .single();

      if (!charError && character) {
        if (body.characters) {
          // Story format: use custom intro message
          const primaryCharacterConfig = body.characters[0];
          const introMessage = primaryCharacterConfig.introMessage;
          
          if (introMessage && introMessage.trim()) {
            const systemMessage = {
              content: introMessage,
              sender: 'character',
              character_id: character.id,
              chat_session_id: session.id
            };

            const { error: msgError } = await supabase
              .from('chat_messages')
              .insert(systemMessage);

            if (msgError) {
              console.warn('Failed to create intro message:', msgError);
            }
          }
        } else if (character.greeting) {
          // Regular chat: use character's default greeting
          const systemMessage = {
            content: character.greeting,
            sender: 'character',
            character_id: character.id,
            chat_session_id: session.id
          };

          const { error: msgError } = await supabase
            .from('chat_messages')
            .insert(systemMessage);

          if (msgError) {
            console.warn('Failed to create greeting message:', msgError);
          }
        }
      }
    }

    return c.json({
      success: true,
      session,
      message: 'Chat session created successfully'
    });
  } catch (error: any) {
    console.error('Failed to create chat session:', error);
    return c.json({
      success: false,
      error: 'Failed to create chat session',
      message: error.message
    }, 500);
  }
});

/**
 * Get specific chat session with messages
 * GET /api/chat-sessions/:id
 */
app.get('/:id', async (c) => {
  try {
    const { id: sessionId } = c.req.param();

    // Get session details first
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      return c.json({
        success: false,
        error: 'Chat session not found'
      }, 404);
    }

    // Get related character and setting separately to avoid join issues
    let character = null;
    let setting = null;

    if (session.character_id) {
      const { data: charData } = await supabase
        .from('characters')
        .select('id, name, archetype, chatbot_role, greeting, avatar_image')
        .eq('id', session.character_id)
        .single();
      character = charData;
    }

    if (session.setting_id) {
      const { data: settingData } = await supabase
        .from('settings')
        .select('id, name, description, theme')
        .eq('id', session.setting_id)
        .single();
      setting = settingData;
    }

    // Combine the data
    const sessionWithRelations = {
      ...session,
      characters: character,
      settings: setting
    };

    // Get messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (messagesError) throw messagesError;

    return c.json({
      success: true,
      session: {
        ...sessionWithRelations,
        messages: messages || []
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch chat session:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch chat session',
      message: error.message
    }, 500);
  }
});

/**
 * Send message and get AI response
 * POST /api/chat-sessions/:id/messages
 */
app.post('/:id/messages', async (c) => {
  try {
    // Extract session ID from URL path since Hono route mounting interferes with param extraction
    const url = new URL(c.req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Path: api/chat-sessions/{sessionId}/messages
    const sessionIdIndex = pathSegments.findIndex(segment => segment === 'chat-sessions') + 1;
    const sessionId = pathSegments[sessionIdIndex];
    
    console.log('DEBUG: sessionId extracted =', sessionId);
    console.log('DEBUG: pathSegments =', pathSegments);
    
    if (!sessionId || sessionId === 'messages') {
      return c.json({
        success: false,
        error: 'Session ID is required',
        details: { 
          url: c.req.url,
          pathSegments,
          sessionIdIndex,
          extractedSessionId: sessionId
        }
      }, 400);
    }
    
    const body = await c.req.json();
    const { content, role = 'user' } = body;

    if (!content) {
      return c.json({
        success: false,
        error: 'Message content is required'
      }, 400);
    }

    // Get session details first
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return c.json({
        success: false,
        error: 'Chat session not found',
        details: {
          sessionId,
          sessionError: sessionError?.message,
          session: session
        }
      }, 404);
    }

    // Get character details separately if character_id exists
    let character = null;
    if (session.character_id) {
      const { data: charData } = await supabase
        .from('characters')
        .select(`
          id,
          name,
          archetype,
          chatbot_role,
          greeting,
          tone,
          primary_traits,
          approach,
          demeanor,
          primary_motivation
        `)
        .eq('id', session.character_id)
        .single();
      character = charData;
    }

    // Add character to session object for compatibility
    const sessionWithCharacter = {
      ...session,
      characters: character
    };

    // Save user message
    const userMessage = {
      chat_session_id: sessionId,
      content,
      sender: 'user',
      character_id: null
    };

    const { data: savedUserMessage, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert(userMessage)
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Generate AI response if user message
    let aiResponse = null;
    if (role === 'user') {
      try {
        const character = sessionWithCharacter.characters as any;
        if (!character) {
          throw new Error('No character found in this session');
        }
        
        const startTime = Date.now();

        // Build character-aware prompt
        const characterPrompt = buildCharacterPrompt(character, content);
        
        // Generate response with safety wrapper
        console.log('DEBUG: About to call LLM with prompt:', characterPrompt.substring(0, 200) + '...');
        let llmResponse;
        try {
          llmResponse = await safeLLMRequest(characterPrompt, {
            model: 'pygmalion2-7b',
            temperature: 0.7,
            max_tokens: 512,
            requestId: `chat_${sessionId}_${Date.now()}`
          });
          console.log('DEBUG: LLM response received:', JSON.stringify(llmResponse));
        } catch (llmError: any) {
          console.error('DEBUG: LLM error:', llmError);
          throw new Error(`LLM call failed: ${llmError.message}`);
        }

        const responseTime = Date.now() - startTime;

        // Save AI response
        const aiMessage = {
          chat_session_id: sessionId,
          content: llmResponse.response || 'I apologize, but I had trouble generating a response.',
          sender: 'character',
          character_id: character.id
        };

        const { data: savedAiMessage, error: aiMsgError } = await supabase
          .from('chat_messages')
          .insert(aiMessage)
          .select()
          .single();

        if (aiMsgError) throw aiMsgError;
        aiResponse = savedAiMessage;

        // Update session last activity
        await supabase
          .from('chat_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', sessionId);

      } catch (llmError: any) {
        console.error('LLM generation failed:', llmError);
        
        // Save error response
        const character = sessionWithCharacter.characters as any;
        const errorMessage = {
          chat_session_id: sessionId,
          content: 'I apologize, but I encountered an error while processing your message. Please try again.',
          sender: 'character',
          character_id: character?.id || null
        };

        const { data: errorMsg } = await supabase
          .from('chat_messages')
          .insert(errorMessage)
          .select()
          .single();

        aiResponse = errorMsg;
      }
    }

    return c.json({
      success: true,
      userMessage: savedUserMessage,
      aiResponse,
      message: 'Message sent successfully'
    });

  } catch (error: any) {
    console.error('Failed to send message:', error);
    return c.json({
      success: false,
      error: 'Failed to send message',
      message: error.message,
      stack: error.stack,
      details: JSON.stringify(error)
    }, 500);
  }
});

/**
 * Update chat session
 * PATCH /api/chat-sessions/:id
 */
app.patch('/:id', async (c) => {
  try {
    const { id: sessionId } = c.req.param();
    const body = await c.req.json();
    const { title, metadata } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.name = title; // Using 'name' field from schema
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      session,
      message: 'Chat session updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update chat session:', error);
    return c.json({
      success: false,
      error: 'Failed to update chat session',
      message: error.message
    }, 500);
  }
});

/**
 * Delete chat session and all messages
 * DELETE /api/chat-sessions/:id
 */
app.delete('/:id', async (c) => {
  try {
    const { id: sessionId } = c.req.param();

    // Delete messages first (cascade should handle this, but being explicit)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('chat_session_id', sessionId);

    if (messagesError) {
      console.warn('Error deleting messages:', messagesError);
    }

    // Delete session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) throw sessionError;

    return c.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete chat session:', error);
    return c.json({
      success: false,
      error: 'Failed to delete chat session',
      message: error.message
    }, 500);
  }
});

/**
 * Build character-aware prompt for LLM
 */
function buildCharacterPrompt(character: any, userMessage: string): string {
  const traits = Array.isArray(character.primary_traits) ? character.primary_traits.join(', ') : '';
  const tone = Array.isArray(character.tone) ? character.tone.join(', ') : '';
  
  // Use Pygmalion-2 template format
  const systemPrompt = `<|system|>Enter RP mode. Pretend to be ${character.name} whose persona follows:

Name: ${character.name}
Archetype: ${character.archetype}
Role: ${character.chatbot_role}
Character traits: ${traits}
Speaking tone: ${tone}
Approach: ${character.approach || 'friendly and engaging'}

You shall reply to the user while staying in character, and generate natural conversational responses.

<|user|>${userMessage}

<|model|>`;

  return systemPrompt;
}

export default app;