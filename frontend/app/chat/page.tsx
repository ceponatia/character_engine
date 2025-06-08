'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

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

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'character';
  characterName?: string;
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedSetting, setSelectedSetting] = useState<string>('default');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch characters on component mount
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/characters');
        const data = await response.json();
        setCharacters(data.characters || []);
        // Default to first character (Luna)
        if (data.characters && data.characters.length > 0) {
          setSelectedCharacter(data.characters[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    const socketInstance = io('http://localhost:3001');
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('chat_response', (data) => {
      setIsCharacterTyping(false);
      const characterName = characters.find(c => c.id === data.characterId)?.name || 'Character';
      setMessages(prev => [...prev, {
        id: data.messageId || Date.now().toString(),
        text: data.message,
        sender: 'character',
        characterName
      }]);
    });

    socketInstance.on('character_typing', (data) => {
      setIsCharacterTyping(data.isTyping);
    });

    socketInstance.on('chat_error', (error) => {
      console.error('Chat error:', error);
      setIsCharacterTyping(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [characters]);

  const sendMessage = () => {
    if (!socket || !inputMessage.trim() || !selectedCharacter) return;
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user'
    }]);
    
    // Send to server with proper format
    socket.emit('chat_message', {
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

  return (
    <div className="chat-container">
      <div className="card flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                💬 Chat
              </h1>
              <p className="text-slate-400 flex items-center gap-2">
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
              <Link 
                href="/characters"
                className="btn btn-secondary text-sm"
              >
                💕 Characters
              </Link>
            </div>
          </div>
          
          {/* Character and Setting Selection */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                💭 Select Character
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="form-select w-full"
                disabled={isLoading || characters.length === 0}
              >
                {characters.length === 0 ? (
                  <option value="">No characters available</option>
                ) : (
                  characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} - {character.archetype}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                🏰 Select Setting
              </label>
              <select
                value={selectedSetting}
                onChange={(e) => setSelectedSetting(e.target.value)}
                className="form-select w-full"
              >
                <option value="default">🌙 Default Setting</option>
                <option value="library">📚 Mystical Library</option>
                <option value="garden">🌹 Enchanted Garden</option>
                <option value="tower">🗼 Stargazing Tower</option>
                <option value="custom">✨ Custom Setting</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💭</div>
              <p className="text-slate-400 text-lg">
                {selectedCharacter ? 
                  `Begin your conversation with ${characters.find(c => c.id === selectedCharacter)?.name || 'your character'}...` :
                  'Select a character to begin your chat...'
                }
              </p>
              <p className="text-slate-500 text-sm" style={{marginTop: '0.5rem'}}>
                {selectedCharacter ? 'Share your thoughts and feelings' : 'Choose from the dropdown above'}
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
                      {characters.find(c => c.id === selectedCharacter)?.name || 'Character'}
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
            placeholder="Share your thoughts..."
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