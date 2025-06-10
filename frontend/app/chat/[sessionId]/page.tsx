'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getApiUrl } from '../../utils/api-config';

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

interface ChatSession {
  id: string;
  name: string;
  setting_id: string;
  character_id: string;
  characters: Character; // Single character object from Supabase join
  settings: Setting; // Setting object from Supabase join
  createdAt: string;
  lastActivity: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'character';
  characterName?: string;
  characterId?: string;
}

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data with retry logic
  useEffect(() => {
    const fetchSession = async (retryCount = 0) => {
      try {
        const response = await fetch(getApiUrl(`/api/chat-sessions/${sessionId}`));
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          
          // Set default character (single character per session now)
          if (data.session.characters && data.session.characters.id) {
            setSelectedCharacter(data.session.characters.id);
          } else if (data.session.character_id) {
            setSelectedCharacter(data.session.character_id);
          }
          
          // Load existing messages or create intro messages
          if (data.session.messages && data.session.messages.length > 0) {
            setMessages(data.session.messages);
          } else {
            // Messages are already created by the backend when the session is created
            setMessages([]);
          }
          
          // Successfully loaded session, stop loading
          setIsLoading(false);
        } else if (response.status === 404) {
          // If session not found and this is a recent creation, retry after delay
          if (retryCount < 3) {
            setTimeout(() => {
              fetchSession(retryCount + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
          setError('Chat session not found');
          setIsLoading(false);
        } else {
          setError('Failed to load chat session');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        // Retry on network errors
        if (retryCount < 2) {
          setTimeout(() => {
            fetchSession(retryCount + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        setError('Failed to load chat session');
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Set connected status (no WebSocket needed for REST)
  useEffect(() => {
    if (session) {
      setIsConnected(true); // Always connected with REST API
    }
  }, [session]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedCharacter || !session) return;
    
    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    
    const messageText = inputMessage;
    setInputMessage('');
    setIsCharacterTyping(true);
    
    try {
      // Send message via REST API
      const response = await fetch(getApiUrl(`/api/chat-sessions/${sessionId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageText,
          role: 'user'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to UI
        if (data.aiResponse) {
          const aiMessage: ChatMessage = {
            id: data.aiResponse.id || Date.now().toString(),
            text: data.aiResponse.content,
            sender: 'character',
            characterName: session.characters?.name || 'Character',
            characterId: session.characters?.id
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        console.error('Failed to send message');
        // Show error message
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'character',
          characterName: session.characters?.name || 'Character',
          characterId: session.characters?.id
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'character',
        characterName: session.characters?.name || 'Character',
        characterId: session.characters?.id
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCharacterTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="chat-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading your story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="chat-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">❌</div>
            <h3>Story Not Found</h3>
            <p>{error || 'This chat session could not be found.'}</p>
            <Link href="/" className="btn btn-primary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="card flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1">
                💬 {session.name}
              </h1>
              <p className="text-slate-400 text-sm mb-2">
                🏰 {session.settings?.name || 'General Setting'}
              </p>
              <p className="text-slate-400 flex items-center gap-2 text-sm">
                <span className={isConnected ? 'status-online' : 'status-offline'}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/"
                className="btn btn-outline text-sm"
              >
                ← Home
              </Link>
              <Link 
                href="/story-config"
                className="btn btn-secondary text-sm"
              >
                🎭 New Story
              </Link>
            </div>
          </div>
          
          {/* Character Selection removed - single character per session */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💭</div>
              <p className="text-slate-400 text-lg">
                Your story is ready to begin...
              </p>
              <p className="text-slate-500 text-sm" style={{marginTop: '0.5rem'}}>
                Share your thoughts and let the adventure unfold
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'}}
                >
                  <div className={`chat-message ${msg.sender}`}>
                    {msg.sender === 'character' && msg.characterName && (
                      <div className="text-xs text-slate-400 mb-1">{msg.characterName}</div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCharacterTyping && (
                <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                  <div className="chat-message character" style={{opacity: 0.7}}>
                    <div className="text-xs text-slate-400 mb-1">
                      {session.characters?.name || 'Character'}
                    </div>
                    <span className="typing-indicator">💭 thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Continue your story..."
            className="form-input chat-input"
            disabled={isCharacterTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isCharacterTyping}
            className="btn btn-primary"
            style={{opacity: (!inputMessage.trim() || isCharacterTyping) ? 0.5 : 1}}
          >
            💬 Send
          </button>
        </div>
      </div>
    </div>
  );
}