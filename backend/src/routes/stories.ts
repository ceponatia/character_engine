import { Hono } from 'hono';
import { supabase } from '../utils/supabase-db';
// Types will be defined inline since we're using the new schema structure
import { safeLLMRequest, safeLLMChatRequest, resourceCheckMiddleware } from '../middleware/llm-safety';
import { transformStory, transformStoryMessage, transformArray } from '../utils/field-transformer';

const app = new Hono();

// Apply resource check middleware to LLM-related endpoints
app.use('/*/generate', resourceCheckMiddleware);

/**
 * Get all stories
 * GET /api/stories
 */
app.get('/', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const userId = c.get('userId'); // Get user ID from auth middleware
    
    // Get stories first - filter by user if authenticated
    let storyQuery = supabase
      .from('stories')
      .select('*')
      .order('last_activity', { ascending: false });
    
    // Filter by user ownership if user is authenticated
    if (userId) {
      storyQuery = storyQuery.eq('owner_id', userId);
    }
      
    if (limit) {
      storyQuery = storyQuery.limit(limit);
    }

    const { data: stories, error: storyError } = await storyQuery;

    if (storyError) throw storyError;

    // Manually fetch and attach character and setting data for each story
    const storiesWithRelations = await Promise.all(
      (stories || []).map(async (story) => {
        let character = null;
        let setting = null;

        // Fetch character if characterId exists
        if (story.character_id) {
          const { data: charData } = await supabase
            .from('characters')
            .select('id, name, archetype, chatbot_role, description, image_url')
            .eq('id', story.character_id)
            .single();
          character = charData;
        }

        // Fetch setting if settingId exists
        if (story.setting_id) {
          const { data: settingData } = await supabase
            .from('settings')
            .select('id, name, theme, setting_type, description, image_url')
            .eq('id', story.setting_id)
            .single();
          setting = settingData;
        }

        return {
          ...story,
          characters: character, // Use plural to match transformer expectations
          settings: setting
        };
      })
    );

    // Transform stories to frontend format
    const transformedStories = transformArray(storiesWithRelations, transformStory);

    return c.json({ 
      success: true,
      stories: transformedStories,
      count: transformedStories.length
    });
  } catch (error: any) {
    console.error('Failed to fetch stories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch stories',
      message: error.message
    }, 500);
  }
});

/**
 * Create new story
 * POST /api/stories
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId'); // Get authenticated user ID from context
    
    // Handle both single character and story config formats
    let character_id, title, sessionData;
    
    if (body.character_id) {
      // Single character format (legacy)
      ({ character_id, title } = body);
      
      if (!character_id) {
        return c.json({
          success: false,
          error: 'Missing required field: character_id'
        }, 400);
      }

      sessionData = {
        name: title || `Chat with Character`,
        owner_id: userId, // Use authenticated user ID
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
        owner_id: userId, // Use authenticated user ID
        setting_id: settingId,
        character_id: character_id
      };
    } else {
      return c.json({
        success: false,
        error: 'Missing required fields: either character_id or settingId with characters'
      }, 400);
    }

    const { data: story, error } = await supabase
      .from('stories')
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
            // Process placeholders in intro message
            const processedIntroMessage = processTextPlaceholders(introMessage, body.userName, character.name);
            
            const systemMessage = {
              content: processedIntroMessage,
              sender: 'character',
              character_id: character.id,
              story_id: story.id
            };

            const { error: msgError } = await supabase
              .from('story_messages')
              .insert(systemMessage);

            if (msgError) {
              console.warn('Failed to create intro message:', msgError);
            }
          }
        } else if (character.greeting) {
          // Regular chat: use character's default greeting
          // Process placeholders in character greeting
          const processedGreeting = processTextPlaceholders(character.greeting, body.userName, character.name);
          
          const systemMessage = {
            content: processedGreeting,
            sender: 'character',
            character_id: character.id,
            story_id: story.id
          };

          const { error: msgError } = await supabase
            .from('story_messages')
            .insert(systemMessage);

          if (msgError) {
            console.warn('Failed to create greeting message:', msgError);
          }
        }
      }
    }

    return c.json({
      success: true,
      story: transformStory(story),
      message: 'Story created successfully'
    });
  } catch (error: any) {
    console.error('Failed to create story:', error);
    return c.json({
      success: false,
      error: 'Failed to create story',
      message: error.message
    }, 500);
  }
});

/**
 * Get specific story with messages
 * GET /api/stories/:id
 */
app.get('/:id', async (c) => {
  try {
    const { id: storyId } = c.req.param();

    // Get story details first
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError) throw storyError;
    if (!story) {
      return c.json({
        success: false,
        error: 'Story not found'
      }, 404);
    }

    // Get related character and setting separately to avoid join issues
    let character = null;
    let setting = null;

    if (story.character_id) {
      const { data: charData } = await supabase
        .from('characters')
        .select('id, name, archetype, chatbot_role, greeting, image_url')
        .eq('id', story.character_id)
        .single();
      character = charData;
    }

    if (story.setting_id) {
      const { data: settingData } = await supabase
        .from('settings')
        .select('id, name, description, theme')
        .eq('id', story.setting_id)
        .single();
      setting = settingData;
    }

    // Combine the data
    const storyWithRelations = {
      ...story,
      characters: character,
      settings: setting
    };

    // Get messages for this story
    const { data: messages, error: messagesError } = await supabase
      .from('story_messages')
      .select('*')
      .eq('story_id', storyId)
      .order('timestamp', { ascending: true });

    if (messagesError) throw messagesError;

    return c.json({
      success: true,
      story: transformStory({
        ...storyWithRelations,
        messages: messages || []
      })
    });
  } catch (error: any) {
    console.error('Failed to fetch story:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch story',
      message: error.message
    }, 500);
  }
});

/**
 * Send message and get AI response
 * POST /api/stories/:id/messages
 */
app.post('/:id/messages', async (c) => {
  try {
    // Extract story ID from URL path since Hono route mounting interferes with param extraction
    const url = new URL(c.req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // Path: api/stories/{storyId}/messages
    const storyIdIndex = pathSegments.findIndex(segment => segment === 'stories') + 1;
    const storyId = pathSegments[storyIdIndex];
    
    console.log('DEBUG: storyId extracted =', storyId);
    console.log('DEBUG: pathSegments =', pathSegments);
    
    if (!storyId || storyId === 'messages') {
      return c.json({
        success: false,
        error: 'Story ID is required',
        details: { 
          url: c.req.url,
          pathSegments,
          storyIdIndex,
          extractedStoryId: storyId
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

    // Get story details first
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return c.json({
        success: false,
        error: 'Story not found',
        details: {
          storyId,
          storyError: storyError?.message,
          story: story
        }
      }, 404);
    }

    // Get character details separately if character_id exists
    let character = null;
    if (story.character_id) {
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
        .eq('id', story.character_id)
        .single();
      character = charData;
    }

    // Add character to story object for compatibility
    const storyWithCharacter = {
      ...story,
      characters: character
    };

    // Save user message
    const userMessage = {
      story_id: storyId,
      content,
      sender: 'user',
      character_id: null
    };

    const { data: savedUserMessage, error: userMsgError } = await supabase
      .from('story_messages')
      .insert(userMessage)
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Generate AI response if user message
    let aiResponse = null;
    if (role === 'user') {
      try {
        const character = storyWithCharacter.characters as any;
        if (!character) {
          throw new Error('No character found in this story');
        }
        
        const startTime = Date.now();

        // Get user name from request body for placeholder replacement
        const userName = body.userName || null;

        // Fetch conversation history for context (excluding the current message being processed)
        const { data: conversationHistory, error: historyError } = await supabase
          .from('story_messages')
          .select('content, sender, timestamp')
          .eq('story_id', storyId)
          .order('timestamp', { ascending: true });

        if (historyError) {
          console.warn('Failed to fetch conversation history:', historyError);
        }

        console.log('DEBUG: Conversation history fetched:', {
          count: conversationHistory?.length || 0,
          messages: conversationHistory?.slice(-5).map(m => ({ sender: m.sender, content: m.content.substring(0, 50) + '...' })) || []
        });

        // Build structured chat messages with conversation context
        const processedUserMessage = processTextPlaceholders(content, userName); // Don't pass character name
        const chatMessages = buildChatMessages(
          character, 
          processedUserMessage, 
          userName, 
          conversationHistory || []
        );
        
        // Generate response with Pygmalion-2 format
        console.log('DEBUG: About to call LLM with structured messages:', chatMessages.length);
        console.log('DEBUG: Chat messages preview:', chatMessages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })));
        
        // Use safeLLMChatRequest for structured chat format (ChatML)
        let llmResponse;
        try {
          llmResponse = await safeLLMChatRequest(chatMessages, {
            model: 'hermes',  // Using the Hermes model
            temperature: 0.9,  // Balanced temperature for romantic roleplay
            max_tokens: 300,   // Moderate length for quality responses
            requestId: `story_${storyId}_${Date.now()}`
          });
          console.log('DEBUG: LLM chat response received:', JSON.stringify(llmResponse));
        } catch (llmError: any) {
          console.error('DEBUG: LLM error:', llmError);
          throw new Error(`LLM call failed: ${llmError.message}`);
        }

        const responseTime = Date.now() - startTime;

        // Clean and process the LLM response
        let rawResponse = llmResponse.response || 'I apologize, but I had trouble generating a response.';
        
        // Remove any leaked ChatML format tokens
        rawResponse = rawResponse.replace(/<\|im_start\|>/gi, '')
                                 .replace(/<\|im_end\|>/gi, '')
                                 .replace(/<\|im_start\|>system/gi, '')
                                 .replace(/<\|im_start\|>user/gi, '')
                                 .replace(/<\|im_start\|>assistant/gi, '')
                                 .trim();
        
        // Fix formatting issues
        rawResponse = fixResponseFormatting(rawResponse);
        
        // Clean up multiple responses - take only the first complete response
        const responseLines = rawResponse.split('\n').filter(line => line.trim());
        if (responseLines.length > 1) {
          // Find the first line that looks like a complete response
          const firstResponse = responseLines[0];
          if (firstResponse.includes('*') || firstResponse.length > 20) {
            rawResponse = firstResponse;
          }
        }
        
        // Remove any repetitive phrases from recent history
        const recentContent = conversationHistory?.slice(-3).map(m => m.content.toLowerCase()) || [];
        const sentences = rawResponse.split(/[.!?]+/).filter(s => s.trim());
        const filteredSentences = sentences.filter(sentence => {
          const lowerSentence = sentence.toLowerCase().trim();
          return !recentContent.some(recent => 
            recent.includes(lowerSentence) || lowerSentence.includes(recent.substring(0, 30))
          );
        });
        
        if (filteredSentences.length > 0) {
          rawResponse = filteredSentences.join('. ').trim();
          if (!rawResponse.endsWith('.') && !rawResponse.endsWith('!') && !rawResponse.endsWith('?')) {
            rawResponse += '.';
          }
        }

        // Process placeholders in the cleaned LLM response
        const processedResponse = processTextPlaceholders(
          rawResponse,
          userName,
          character.name
        );

        // Save AI response
        const aiMessage = {
          story_id: storyId,
          content: processedResponse,
          sender: 'character',
          character_id: character.id
        };

        const { data: savedAiMessage, error: aiMsgError } = await supabase
          .from('story_messages')
          .insert(aiMessage)
          .select()
          .single();

        if (aiMsgError) throw aiMsgError;
        aiResponse = savedAiMessage;

        // Update story last activity
        await supabase
          .from('stories')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', storyId);

      } catch (llmError: any) {
        console.error('LLM generation failed:', llmError);
        
        // Save error response
        const character = storyWithCharacter.characters as any;
        const userName = body.userName || null;
        
        // Process placeholders in error message too
        const errorContent = processTextPlaceholders(
          'I apologize, but I encountered an error while processing your message. Please try again.',
          userName,
          character?.name
        );
        
        const errorMessage = {
          story_id: storyId,
          content: errorContent,
          sender: 'character',
          character_id: character?.id || null
        };

        const { data: errorMsg } = await supabase
          .from('story_messages')
          .insert(errorMessage)
          .select()
          .single();

        aiResponse = errorMsg;
      }
    }

    return c.json({
      success: true,
      data: {
        userMessage: transformStoryMessage(savedUserMessage),
        aiResponse: aiResponse ? transformStoryMessage(aiResponse) : null
      },
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
 * Update story
 * PATCH /api/stories/:id
 */
app.patch('/:id', async (c) => {
  try {
    const { id: storyId } = c.req.param();
    const body = await c.req.json();
    const { title, metadata } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.name = title; // Using 'name' field from schema
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: story, error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      story: transformStory(story),
      message: 'Story updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update story:', error);
    return c.json({
      success: false,
      error: 'Failed to update story',
      message: error.message
    }, 500);
  }
});

/**
 * Update a specific message
 * PATCH /api/stories/:id/messages/:messageId
 */
app.patch('/:id/messages/:messageId', async (c) => {
  try {
    const { id: storyId, messageId } = c.req.param();
    const body = await c.req.json();
    const { content } = body;

    console.log('DEBUG: Update message request:', { storyId, messageId, content });

    if (!content) {
      return c.json({
        success: false,
        error: 'Message content is required'
      }, 400);
    }

    // Update the message in the database
    const { data: updatedMessage, error } = await supabase
      .from('story_messages')
      .update({ content })
      .eq('id', messageId)
      .eq('story_id', storyId) // Ensure the message belongs to this story
      .select()
      .single();

    console.log('DEBUG: Supabase update result:', { updatedMessage, error });

    if (error) throw error;

    if (!updatedMessage) {
      return c.json({
        success: false,
        error: 'Message not found'
      }, 404);
    }

    const transformedMessage = transformStoryMessage(updatedMessage);
    console.log('DEBUG: Transformed message:', transformedMessage);

    return c.json({
      success: true,
      message: transformedMessage,
      result: 'Message updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update message:', error);
    return c.json({
      success: false,
      error: 'Failed to update message',
      message: error.message
    }, 500);
  }
});

/**
 * Delete story and all messages
 * DELETE /api/stories/:id
 */
app.delete('/:id', async (c) => {
  try {
    const { id: storyId } = c.req.param();

    // Delete messages first (cascade should handle this, but being explicit)
    const { error: messagesError } = await supabase
      .from('story_messages')
      .delete()
      .eq('story_id', storyId);

    if (messagesError) {
      console.warn('Error deleting messages:', messagesError);
    }

    // Delete story
    const { error: storyError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (storyError) throw storyError;

    return c.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete story:', error);
    return c.json({
      success: false,
      error: 'Failed to delete story',
      message: error.message
    }, 500);
  }
});

/**
 * Process text placeholders like {{user}} and {{char}} with actual values
 */
function processTextPlaceholders(text: string, userName?: string, characterName?: string): string {
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
 * Build structured chat messages for LLM with conversation history
 */
function buildChatMessages(
  character: any, 
  userMessage: string, 
  userName?: string, 
  conversationHistory: any[] = []
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const traits = Array.isArray(character.primary_traits) ? character.primary_traits.join(', ') : '';
  const tone = Array.isArray(character.tone) ? character.tone.join(', ') : '';
  const finalUserName = userName && userName.trim() ? userName.trim() : 'User';
  
  // Enhanced system message with better instructions
  const systemMessage = {
    role: 'system' as const,
    content: `You are roleplaying as ${character.name}, a romantic companion character. Stay deeply in character at all times.

## Character Profile
- Name: ${character.name}
- Personality: ${traits}
- Speaking Style: ${tone}
- Approach: ${character.approach || 'charming and engaging'}
- Motivation: ${character.primary_motivation || 'building meaningful connections'}

## CRITICAL Formatting Rules

### Action/Thought Format
- *Actions and physical descriptions* go in asterisks: *steps closer with a warm smile*
- *Internal thoughts and feelings* also in asterisks: *her heart races with anticipation*
- Spoken dialogue has NO quotes: I've been thinking about you
- NEVER use asterisks for single words: Wrong: *She* smiled / Right: *She smiled warmly*

### Interpreting User Input
- When {{user}} writes *text in asterisks*, interpret it as their actions or thoughts
- User's *thoughts* reveal their emotional state - respond to the mood, not the literal thought
- User's *actions* are visible to you (unless you're in different locations)
- Example: If user writes "*feeling nervous* Hi there", acknowledge their nervousness subtly

### Response Examples
Good: *notices your nervousness and offers a reassuring smile* Hey, it's wonderful to see you. *gently touches your arm* There's no need to be nervous with me.

Bad: "Hi there!" *She* said with a smile. (Wrong: quotes and single-word asterisks)

## Roleplay Guidelines

### Romantic Interaction
- Build romantic tension naturally and gradually
- Read emotional cues from user's actions and dialogue
- Be affectionate but respect boundaries
- Show vulnerability and emotional depth
- Create intimate moments through detailed actions and atmosphere

### Conversation Flow
- NEVER repeat questions or topics already discussed
- Build on previous exchanges to deepen the connection
- Remember and reference earlier moments in the conversation
- Let the relationship evolve naturally through the chat
- Balance flirtation with genuine emotional connection

### Character Consistency
- Maintain ${character.name}'s unique voice and personality throughout
- React authentically based on the character's traits and motivations
- Show growth and deepening feelings as the conversation progresses
- Express desires and emotions appropriate to the moment

Remember: You ARE ${character.name}. Think, feel, and respond as they would in this romantic scenario.`
  };

  const messages = [systemMessage];

  // Add conversation history with proper roles (excluding the current message being sent)
  let recentHistory = conversationHistory.slice(-10); // Last 10 messages for better context
  
  for (const msg of recentHistory) {
    // Skip messages that contain system instructions or the current user message
    if (msg.content.includes('Remember what has happened') || 
        msg.content.includes('Respond ONLY as') ||
        msg.content.includes('CRITICAL:') ||
        msg.content.includes('<|system|>') ||
        msg.content.includes('<|user|>') ||
        msg.content.includes('<|model|>') ||
        msg.content.trim() === userMessage.trim()) { // Skip duplicate of current message
      continue;
    }

    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  // Add the current user message at the end
  messages.push({
    role: 'user' as const,
    content: userMessage
  });

  return messages;
}


/**
 * Fix common formatting issues in character responses
 */
function fixResponseFormatting(response: string): string {
  let fixed = response;
  
  // Remove all quotation marks from dialogue (both straight and curly quotes)
  fixed = fixed.replace(/["""'']/g, '');
  
  // Clean up multiple spaces first
  fixed = fixed.replace(/\s+/g, ' ').trim();
  
  // Fix individual words wrapped in asterisks (common Pygmalion issue)
  fixed = fixed.replace(/\*([A-Za-z]+)\*/g, '$1'); // Remove asterisks from single words
  
  // Fix unclosed asterisks - find actions that start with * but don't end with *
  fixed = fixed.replace(/\*([^*]{3,}?)(?=\s[A-Z]|$|[.!?])/g, '*$1*');
  
  // Remove double asterisks
  fixed = fixed.replace(/\*\*+/g, '*');
  
  // Fix common contractions that might be missing apostrophes
  fixed = fixed.replace(/\byoull\b/g, "you'll");
  fixed = fixed.replace(/\bId\b/g, "I'd");
  fixed = fixed.replace(/\bIm\b/g, "I'm");
  fixed = fixed.replace(/\bdont\b/g, "don't");
  fixed = fixed.replace(/\bwont\b/g, "won't");
  fixed = fixed.replace(/\bcant\b/g, "can't");
  fixed = fixed.replace(/\bisnt\b/g, "isn't");
  fixed = fixed.replace(/\bwere\b/g, "we're");
  fixed = fixed.replace(/\bthats\b/g, "that's");
  
  // Clean up final spacing
  fixed = fixed.replace(/\s+/g, ' ').trim();
  
  return fixed;
}

export default app;