'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  settingId: string;
  setting: Setting;
  characters: {
    characterId: string;
    character: Character;
    introMessage: string;
  }[];
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
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/chat-sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          
          // Set default character to first character
          if (data.session.characters.length > 0) {
            setSelectedCharacter(data.session.characters[0].characterId);
          }
          
          // Load existing messages or create intro messages
          if (data.session.messages && data.session.messages.length > 0) {
            setMessages(data.session.messages);
          } else {
            // Add intro messages as initial messages (for new sessions)
            const introMessages: ChatMessage[] = [];
            data.session.characters.forEach((charConfig: any, index: number) => {
              if (charConfig.introMessage && charConfig.introMessage.trim()) {
                introMessages.push({
                  id: `intro-${charConfig.characterId}-${index}`,
                  text: charConfig.introMessage,
                  sender: 'character',
                  characterName: charConfig.character.name,
                  characterId: charConfig.characterId
                });
              }
            });
            if (introMessages.length > 0) {
              setMessages(introMessages);
            }
          }
        } else if (response.status === 404) {
          setError('Chat session not found');
        } else {
          setError('Failed to load chat session');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load chat session');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Initialize WebSocket
  useEffect(() => {
    if (!session) return;

    const socketInstance = io('http://localhost:3001');
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join the session room
      socketInstance.emit('join_session', sessionId);
      console.log('Connected to server and joined session');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('chat_response', (data) => {
      setIsCharacterTyping(false);
      const character = session.characters.find(c => c.characterId === data.characterId);
      setMessages(prev => [...prev, {
        id: data.messageId || Date.now().toString(),
        text: data.message,
        sender: 'character',
        characterName: character?.character.name || 'Character',
        characterId: data.characterId
      }]);
    });

    socketInstance.on('character_typing', (data) => {
      setIsCharacterTyping(data.isTyping);
    });

    socketInstance.on('chat_error', (error) => {
      setIsCharacterTyping(false);
      // Only log meaningful errors
      if (error && error.error && error.error.trim()) {
        console.warn('Chat system error:', error.error);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session, sessionId]);

  const sendMessage = () => {
    if (!socket || !inputMessage.trim() || !selectedCharacter || !session) return;
    
    // Add user message to UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Send to server with session context
    socket.emit('chat_message', {
      sessionId: sessionId,
      characterId: selectedCharacter,
      message: inputMessage,
      userId: socket.id,
      streaming: false
    });
    
    setInputMessage('');
    setIsCharacterTyping(true);
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
                🏰 {session.setting.name}
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
          
          {/* Character Selection */}
          {session.characters.length > 1 && (
            <div className="character-selection">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                💭 Active Character
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="form-select"
                disabled={!isConnected}
              >
                {session.characters.map((charConfig) => (
                  <option key={charConfig.characterId} value={charConfig.characterId}>
                    {charConfig.character.name} - {charConfig.character.archetype}
                  </option>
                ))}
              </select>
            </div>
          )}
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
                      {session.characters.find(c => c.characterId === selectedCharacter)?.character.name || 'Character'}
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
            disabled={!isConnected || !selectedCharacter || isCharacterTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim() || !selectedCharacter || isCharacterTyping}
            className="btn btn-primary"
            style={{opacity: (!isConnected || !inputMessage.trim() || !selectedCharacter || isCharacterTyping) ? 0.5 : 1}}
          >
            💬 Send
          </button>
        </div>
      </div>
    </div>
  );
}