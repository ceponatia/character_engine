'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Socket } from 'socket.io-client';

interface Character {
  id: string;
  name: string;
  archetype: string;
  chatbotRole: string;
  description?: string;
  greeting?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  characterId: string;
}

export default function ChatPage() {
  const params = useParams();
  const characterId = params.id as string;
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Storage keys for persistence
  const STORAGE_KEY = `chat_history_${characterId}`;
  const USER_ID_KEY = 'chatbot_user_id';

  useEffect(() => {
    if (characterId && typeof window !== 'undefined') {
      fetchCharacter();
      loadChatHistory();
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [characterId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save chat history to localStorage whenever messages change
    if (messages.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const fetchCharacter = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/characters/${characterId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCharacter(data.character);
      } else {
        setError(data.error || 'Character not found');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching character:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const clearChatHistory = async () => {
    if (!character) return;

    const confirmClear = window.confirm(
      `This will clear your conversation with ${character.name} and reset their memory. Are you sure?`
    );

    if (!confirmClear) return;

    try {
      // Clear frontend messages
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);

      // Clear backend conversation history
      await fetch(`http://localhost:3001/api/characters/${characterId}/clear-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      console.log('✅ Chat history cleared successfully');
    } catch (err) {
      console.error('❌ Error clearing chat history:', err);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const initializeSocket = () => {
    // Only initialize socket on client side
    if (typeof window === 'undefined') return;
    
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:3001');
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('🔌 Connected to chat server');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Disconnected from chat server');
      });

      socket.on('chat_response', (data) => {
        setIsTyping(false);
        
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          content: data.message || '',
          role: 'assistant',
          timestamp: new Date(),
          characterId: characterId
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      });

      socket.on('chat_error', (error) => {
        setIsTyping(false);
        console.error('Chat error:', error);
        alert(`Chat error: ${error.error || 'Unknown error'}`);
      });

      socket.on('character_typing', (data) => {
        if (data.characterId === characterId) {
          setIsTyping(data.isTyping);
        }
      });
    });
  };

  // Process template variables in user input
  const processTemplateVariables = (message: string): string => {
    let processedMessage = message;
    
    // Get current context for template replacement
    const userName = 'user'; // Default until user profiles are implemented
    const currentTime = new Date();
    const timeOfDay = getTimeOfDay(currentTime);
    const location = 'here'; // Default location
    
    // Replace template variables
    processedMessage = processedMessage.replace(/\{\{user\}\}/gi, userName);
    processedMessage = processedMessage.replace(/\{\{character_name\}\}/gi, character?.name || 'Character');
    processedMessage = processedMessage.replace(/\{\{location\}\}/gi, location);
    processedMessage = processedMessage.replace(/\{\{time_of_day\}\}/gi, timeOfDay);
    
    // Log template replacement for debugging
    if (message !== processedMessage) {
      console.log('🔧 Template variables processed:', { original: message, processed: processedMessage });
    }
    
    return processedMessage;
  };

  // Helper function to determine time of day
  const getTimeOfDay = (date: Date): string => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !socketRef.current || !character) return;

    // Process template variables in the user input
    const processedContent = processTemplateVariables(inputMessage.trim());

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: processedContent, // Use processed content for display
      role: 'user',
      timestamp: new Date(),
      characterId: characterId
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Send processed message to backend
    socketRef.current.emit('chat_message', {
      characterId: characterId,
      message: processedContent, // Send processed content to backend
      userId: userId,
      streaming: false
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-rose-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Character Not Found</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <Link href="/characters" className="btn btn-primary">
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        
        {/* Header */}
        <div className="card mb-4 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href={`/characters/${characterId}`} className="text-rose-400 hover:text-rose-300">
                ← Back to Profile
              </Link>
              <div className="w-px h-6 bg-slate-600"></div>
              <h1 className="text-xl font-bold text-white">Chat with {character.name}</h1>
              <span className="text-sm text-slate-400">({character.archetype})</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-slate-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Clear History Button */}
              <button
                onClick={clearChatHistory}
                className="btn-secondary text-sm px-3 py-1.5"
                title="Clear conversation history and reset AI memory"
              >
                🗑️ Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 card p-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">💫</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Start your conversation with {character.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {character.description || `A ${character.archetype} ready to chat with you.`}
                </p>
                {character.greeting && (
                  <div className="max-w-md mx-auto bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <p className="text-slate-300 italic">"{character.greeting}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <div className="text-sm mb-1">
                    {message.content}
                  </div>
                  <div className={`text-xs ${
                    message.role === 'user' ? 'text-rose-200' : 'text-slate-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-300 rounded-lg p-3 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{character.name} is typing</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${character.name}...`}
                className="flex-1 form-input"
                disabled={!isConnected || isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !isConnected || isTyping}
                className="btn btn-primary px-6"
              >
                Send
              </button>
            </div>
            
            {/* Template Variables Hint */}
            <div className="mt-2 text-xs text-slate-500">
              💡 Use <code className="bg-slate-800 px-1 rounded">{{user}}</code>, <code className="bg-slate-800 px-1 rounded">{{character_name}}</code>, <code className="bg-slate-800 px-1 rounded">{{location}}</code>, <code className="bg-slate-800 px-1 rounded">{{time_of_day}}</code> for dynamic text
            </div>
            
            {!isConnected && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ Disconnected from server. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}