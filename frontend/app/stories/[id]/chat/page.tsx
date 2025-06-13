'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '../../../utils/api';
import { getApiUrl } from '../../../utils/api-config';
import { formatRelativeTime, getCharacterAvatar } from '../../../utils/helpers';
import { transformChatMessageForDisplay } from '../../../utils/placeholders';
import LoadingSpinner, { LoadingStates } from '../../../components/UI/LoadingSpinner';
import { BackButton } from '../../../components/UI/ActionButtons';
import ErrorCard, { ErrorStates } from '../../../components/UI/ErrorCard';
import AutoScrollContainer, { useAutoScroll } from '../../../components/UI/AutoScrollContainer';
import ChatMessage from '../../../components/UI/ChatMessage';

interface Character {
  id: string;
  name: string;
  archetype: string;
  chatbotRole: string;
  description: string;
  primaryTraits: string[];
  colors: string[];
  tone: string[];
}

interface Setting {
  id: string;
  name: string;
  description: string;
  theme?: string;
}

interface Story {
  id: string;
  name: string;
  setting_id: string;
  character_id: string;
  characters: Character; // Single character object from Supabase join
  settings: Setting; // Setting object from Supabase join
  createdAt: string;
  lastActivity: string;
}

interface StoryMessage {
  id: string;
  text: string;
  sender: 'user' | 'character';
  characterName?: string;
  characterId?: string;
}

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id as string;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { forceScrollToBottom } = useAutoScroll(scrollContainerRef);
  
  // Input focus functionality
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Configure chat page layout
  useEffect(() => {
    // Add classes to body for chat page styling
    document.body.classList.add('hide-footer', 'chat-page');
    
    // Cleanup: remove classes when component unmounts
    return () => {
      document.body.classList.remove('hide-footer', 'chat-page');
    };
  }, []);

  // Fetch story data with retry logic
  useEffect(() => {
    const fetchStory = async (retryCount = 0) => {
      try {
        const response = await apiGet(`/api/stories/${storyId}`);
        if (response.success && response.story) {
          setStory(response.story);
          
          // Set default character (single character per story now)
          if (response.story.character && response.story.character.id) {
            console.log('Setting selectedCharacter from story.character.id:', response.story.character.id);
            setSelectedCharacter(response.story.character.id);
          } else if (response.story.characterId) {
            console.log('Setting selectedCharacter from story.characterId:', response.story.characterId);
            setSelectedCharacter(response.story.characterId);
          } else {
            console.log('No character found in story:', { 
              character: response.story.character, 
              characterId: response.story.characterId 
            });
          }
          
          // Load existing messages or create intro messages
          if (response.story.messages && response.story.messages.length > 0) {
            // Transform API messages to frontend format with asterisk formatting
            const transformedMessages = response.story.messages.map((msg: any) => ({
              id: msg.id,
              text: transformChatMessageForDisplay(
                msg.content, // Transform content -> text with formatting
                'User',
                response.story.character?.name || 'Character',
                msg.sender === 'user' // Apply user styling if it's a user message
              ),
              sender: msg.sender,
              characterName: msg.characterName,
              characterId: msg.characterId
            }));
            setMessages(transformedMessages);
          } else {
            setMessages([]);
          }
          
          setIsLoading(false);
        } else {
          // If story not found and this is a recent creation, retry after delay
          if (retryCount < 3) {
            setTimeout(() => {
              fetchStory(retryCount + 1);
            }, 1000 * (retryCount + 1));
            return;
          }
          setError(response.error || 'Story not found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        // Retry on network errors
        if (retryCount < 2) {
          setTimeout(() => {
            fetchStory(retryCount + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        setError('Failed to load story');
        setIsLoading(false);
      }
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  // Set connected status (no WebSocket needed for REST)
  useEffect(() => {
    if (story) {
      setIsConnected(true); // Always connected with REST API
    }
  }, [story]);

  const sendMessage = async () => {
    console.log('sendMessage called:', { 
      inputMessage: inputMessage.trim(), 
      selectedCharacter, 
      story: !!story 
    });
    
    if (!inputMessage.trim() || !selectedCharacter || !story) {
      console.log('sendMessage blocked:', {
        hasMessage: !!inputMessage.trim(),
        hasCharacter: !!selectedCharacter,
        hasStory: !!story
      });
      return;
    }
    
    // Add user message to UI immediately with full transformation for display
    const processedText = transformChatMessageForDisplay(
      inputMessage, 
      'User', // Default user name
      story.character?.name || 'Character', // Character name for {{char}} replacement
      true // This is a user message
    );
    
    const userMessage: StoryMessage = {
      id: Date.now().toString(),
      text: processedText,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    
    const messageText = inputMessage;
    setInputMessage('');
    setIsCharacterTyping(true);
    
    // Force scroll to bottom after adding user message
    setTimeout(() => forceScrollToBottom('smooth'), 100);
    
    try {
      // Send message via REST API
      const response = await apiPost(`/api/stories/${storyId}/messages`, {
        content: messageText,
        role: 'user',
        userName: 'User' // Default user name until we implement accounts
      });
      
      if (response.success && response.data) {
        // Add AI response to UI with formatting transformation
        if (response.data.aiResponse) {
          const transformedContent = transformChatMessageForDisplay(
            response.data.aiResponse.content,
            'User',
            story.character?.name || 'Character',
            false // This is a character message
          );
          
          const aiMessage: StoryMessage = {
            id: response.data.aiResponse.id || Date.now().toString(),
            text: transformedContent,
            sender: 'character',
            characterName: story.character?.name || 'Character',
            characterId: story.character?.id
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        console.error('Failed to send message:', response.error);
        const transformedErrorText = transformChatMessageForDisplay(
          'Sorry, I encountered an error. Please try again.',
          'User',
          story.character?.name || 'Character',
          false // This is a character error message
        );
        
        const errorMessage: StoryMessage = {
          id: Date.now().toString(),
          text: transformedErrorText,
          sender: 'character',
          characterName: story.character?.name || 'Character',
          characterId: story.character?.id
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message with formatting
      const transformedErrorText = transformChatMessageForDisplay(
        'Sorry, I encountered an error. Please try again.',
        'User',
        story.character?.name || 'Character',
        false // This is a character error message
      );
      
      const errorMessage: StoryMessage = {
        id: Date.now().toString(),
        text: transformedErrorText,
        sender: 'character',
        characterName: story.character?.name || 'Character',
        characterId: story.character?.id
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCharacterTyping(false);
      // Refocus the input after sending the message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUpdateMessage = async (messageId: string, newContent: string) => {
    if (!story) return;

    try {
      const apiUrl = getApiUrl(`/api/stories/${storyId}/messages/${messageId}`);
      console.log('DEBUG: Attempting to update message:', { storyId, messageId, newContent, apiUrl });
      
      // Update the message in the database
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent
        })
      });

      console.log('DEBUG: Response received:', { status: response.status, ok: response.ok });

      if (response.ok) {
        // Parse the response to check for success
        const result = await response.json();
        console.log('DEBUG: Response data:', result);
        
        if (result.success) {
          // Update the local messages state with the edited content
          const processedText = transformChatMessageForDisplay(
            newContent,
            'User',
            story.character?.name || 'Character',
            false // This is a character message
          );

          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, text: processedText }
              : msg
          ));
        } else {
          throw new Error(result.error || 'Failed to update message');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('DEBUG: Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update message`);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <LoadingStates.PageLoading />
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <ErrorStates.NotFound itemType="story" />
            <div className="text-center mt-6">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium px-6 py-3 rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all duration-200"
              >
                ← Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="w-full max-w-md mx-auto px-4 pt-4 pb-2 h-full flex flex-col sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 bg-slate-900/30">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-4">
                {/* Character Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-500/50 bg-slate-800">
                  <img 
                    src={getCharacterAvatar(story.character || {})} 
                    alt={story.character?.name || 'Character'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 mb-1">
                    {story.name}
                  </h1>
                  <p className="text-slate-300 text-sm mb-1">
                    💬 Chatting with {story.character?.name || 'Character'}
                  </p>
                  <p className="text-slate-400 text-xs mb-2">
                    🏰 {story.settings?.name || 'General Setting'}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="text-slate-400">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <BackButton variant="small" />
                <Link 
                  href="/story-config"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  🎭 New Story
                </Link>
              </div>
            </div>
          </div>

          {/* Messages */}
          <AutoScrollContainer 
            ref={scrollContainerRef}
            className="flex-1 p-4 space-y-3"
            dependencies={[messages, isCharacterTyping]}
            scrollBehavior="smooth"
            enableAutoScroll={true}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-6xl mb-4 opacity-50">💭</div>
                <h3 className="text-slate-300 text-xl font-medium mb-2">
                  Your story is ready to begin...
                </h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Share your thoughts and let the adventure unfold with {story.character?.name || 'your character'}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isLatestCharacterMessage = msg.sender === 'character' && 
                    index === messages.length - 1;
                  
                  return (
                    <ChatMessage
                      key={msg.id}
                      id={msg.id}
                      text={msg.text}
                      sender={msg.sender}
                      characterName={msg.characterName}
                      characterId={msg.characterId}
                      isLatestCharacterMessage={isLatestCharacterMessage}
                      onUpdateMessage={handleUpdateMessage}
                      storyId={storyId}
                      userName="User"
                      realCharacterName={story.character?.name || 'Character'}
                    />
                  );
                })}
                {isCharacterTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] bg-slate-800/30 border border-slate-700/30 rounded-2xl px-4 py-3 opacity-70">
                      <div className="text-xs text-slate-400 mb-1 font-medium">
                        {story.character?.name || 'Character'}
                      </div>
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" color="slate" />
                        <span className="text-slate-400 text-sm">thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </AutoScrollContainer>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      console.log('Enter key pressed, calling sendMessage');
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Continue your story..."
                  className="w-full bg-slate-800/50 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 min-h-[50px] max-h-32 resize-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 placeholder:text-slate-400"
                  disabled={isCharacterTyping}
                  rows={1}
                  style={{ 
                    height: 'auto',
                    minHeight: '50px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>
              <button
                onClick={() => {
                  console.log('Send button clicked');
                  sendMessage();
                }}
                disabled={!inputMessage.trim() || isCharacterTyping}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  !inputMessage.trim() || isCharacterTyping
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 hover:scale-105 shadow-lg hover:shadow-rose-500/25'
                }`}
              >
                {isCharacterTyping ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <span>💬</span>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}