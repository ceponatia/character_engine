'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ChatSession {
  id: string;
  name: string;
  settingId: string;
  setting: {
    name: string;
    theme?: string;
  };
  characters: {
    characterId: string;
    character: {
      name: string;
      archetype: string;
    };
  }[];
  createdAt: string;
  lastActivity: string;
  messageCount?: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat-sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error('Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.characters.some(c => 
      c.character.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="sessions-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading your stories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      {/* Header */}
      <div className="library-header">
        <div className="header-content">
          <div className="title-section">
            <Link href="/" className="back-link">
              ← Home
            </Link>
            <h1>📚 Your Stories</h1>
            <p>Continue your adventures or start something new</p>
          </div>
          <div className="header-actions">
            <Link href="/story-config" className="btn btn-primary">
              ✨ Start New Story
            </Link>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="library-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search stories by name, setting, or characters..."
            className="form-input search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="library-content">
        {filteredSessions.length > 0 ? (
          <div className="sessions-grid">
            {filteredSessions.map((session) => (
              <div key={session.id} className="session-card enhanced">
                <div className="session-header">
                  <h3>{session.name}</h3>
                  <div className="session-meta">
                    <span className="session-date">{formatDate(session.lastActivity)}</span>
                  </div>
                </div>
                
                <div className="session-details">
                  <div className="session-setting">
                    <span className="label">🏰 Setting:</span>
                    <span className="value">{session.setting.name}</span>
                  </div>
                  
                  <div className="session-characters">
                    <span className="label">💕 Characters:</span>
                    <div className="character-list">
                      {session.characters.map((charConfig, index) => (
                        <span key={charConfig.characterId} className="character-tag">
                          {charConfig.character.name}
                          {index < session.characters.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {session.messageCount !== undefined && (
                    <div className="session-progress">
                      <span className="label">💬 Messages:</span>
                      <span className="value">{session.messageCount}</span>
                    </div>
                  )}
                </div>
                
                <div className="session-actions">
                  <Link 
                    href={`/chat/${session.id}`}
                    className="btn btn-primary"
                  >
                    Continue Story
                  </Link>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => deleteSession(session.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">
              {searchTerm ? '🔍' : '📚'}
            </div>
            <h3>
              {searchTerm 
                ? 'No stories found' 
                : 'No stories created yet'
              }
            </h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Start your first adventure to see it here'
              }
            </p>
            {!searchTerm && (
              <Link href="/story-config" className="btn btn-primary">
                ✨ Create Your First Story
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {sessions.length > 0 && (
        <div className="library-stats">
          <p>
            Showing {filteredSessions.length} of {sessions.length} stories
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
}