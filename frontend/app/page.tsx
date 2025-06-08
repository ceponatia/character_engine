'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  archetype: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
}

interface ChatSession {
  id: string;
  name: string;
  lastActivity: string;
  characters: {
    characterId: string;
    character: {
      name: string;
      archetype: string;
    };
    introMessage: string;
  }[];
  setting: {
    name: string;
    theme: string;
    settingType: string;
  };
}

export default function Home() {
  const [recentCharacters, setRecentCharacters] = useState<Character[]>([]);
  const [recentSettings, setRecentSettings] = useState<Setting[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent characters
        const charactersRes = await fetch('http://localhost:3001/api/characters?limit=4');
        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          setRecentCharacters(charactersData.characters || []);
        }

        // Fetch recent settings
        const settingsRes = await fetch('http://localhost:3001/api/settings?limit=4');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setRecentSettings(settingsData.settings || []);
        }

        // Fetch active chat sessions
        const sessionsRes = await fetch('http://localhost:3001/api/chat-sessions?limit=6');
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setActiveSessions(sessionsData.sessions || []);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="landing-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading your chatbot world...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">
          ✨ Welcome to Your Romantic Chatbot World
        </h1>
        <p className="hero-subtitle">
          Create characters, design settings, and embark on magical conversations
        </p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/story-config" className="action-card primary">
          <div className="action-icon">🎭</div>
          <h3>Start New Story</h3>
          <p>Configure characters and settings for a new adventure</p>
        </Link>

        <Link href="/chat" className="action-card secondary">
          <div className="action-icon">💬</div>
          <h3>Quick Chat</h3>
          <p>Jump into a simple chat with your characters</p>
        </Link>

        <Link href="/character-builder" className="action-card secondary">
          <div className="action-icon">✨</div>
          <h3>Create Character</h3>
          <p>Build a new character with personality and traits</p>
        </Link>

        <Link href="/setting-builder" className="action-card secondary">
          <div className="action-icon">🏰</div>
          <h3>Design Setting</h3>
          <p>Create immersive locations and scenarios</p>
        </Link>
      </div>

      {/* Dashboard Sections */}
      <div className="dashboard-sections">
        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>🌟 Continue Your Stories</h2>
              <Link href="/sessions" className="btn btn-outline btn-small">
                View All Sessions
              </Link>
            </div>
            <div className="sessions-grid">
              {activeSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <h3>{session.name}</h3>
                  <p>Characters: {session.characters.map(c => c.character.name).join(', ')}</p>
                  <p>Setting: {session.setting.name}</p>
                  <p className="last-activity">Last active: {session.lastActivity}</p>
                  <Link href={`/chat/${session.id}`} className="btn btn-primary btn-small">
                    Continue Story
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Characters */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>💕 Your Characters</h2>
            <Link href="/characters" className="btn btn-outline btn-small">
              View All Characters
            </Link>
          </div>
          
          {recentCharacters.length > 0 ? (
            <div className="characters-preview">
              {recentCharacters.map((character) => (
                <Link 
                  key={character.id} 
                  href={`/characters/${character.id}`}
                  className="character-preview-card"
                >
                  <div className="character-image">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`}
                      alt={character.name}
                    />
                  </div>
                  <div className="character-info">
                    <h3>{character.name}</h3>
                    <p>{character.archetype}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">💭</div>
              <p>No characters created yet</p>
              <Link href="/character-builder" className="btn btn-primary">
                Create Your First Character
              </Link>
            </div>
          )}
        </div>

        {/* Recent Settings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🏰 Your Settings</h2>
            <Link href="/settings" className="btn btn-outline btn-small">
              View All Settings
            </Link>
          </div>
          
          {recentSettings.length > 0 ? (
            <div className="settings-preview">
              {recentSettings.map((setting) => (
                <div 
                  key={setting.id} 
                  className="setting-preview-card"
                  onClick={() => {
                    // TODO: Start new story with this setting
                    window.location.href = `/story-config?setting=${setting.id}`;
                  }}
                >
                  <div className="setting-image">
                    <div className="placeholder-image">🏰</div>
                  </div>
                  <div className="setting-info">
                    <h3>{setting.name}</h3>
                    <p>{setting.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🏰</div>
              <p>No settings created yet</p>
              <Link href="/setting-builder" className="btn btn-primary">
                Create Your First Setting
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="navigation-footer">
        <div className="nav-links">
          <Link href="/characters" className="nav-link">
            <span className="nav-icon">💕</span>
            <span className="nav-label">Characters</span>
          </Link>
          <Link href="/settings" className="nav-link">
            <span className="nav-icon">🏰</span>
            <span className="nav-label">Settings</span>
          </Link>
          <Link href="/locations" className="nav-link">
            <span className="nav-icon">📍</span>
            <span className="nav-label">Locations</span>
          </Link>
        </div>
      </div>
    </div>
  );
}