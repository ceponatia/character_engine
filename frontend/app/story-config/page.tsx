'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../utils/api-config';

interface Character {
  id: string;
  name: string;
  archetype: string;
  description: string;
  defaultIntroMessage?: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  theme?: string[] | string;
  mood?: string[] | string;
  settingType?: string;
  imageUrl?: string;
}

interface CharacterConfig {
  character: Character;
  introMessage: string;
}

export default function StoryConfig() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterConfig[]>([]);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingStory, setIsCreatingStory] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Fetch characters and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charactersRes, settingsRes] = await Promise.all([
          fetch(getApiUrl('/api/characters')),
          fetch(getApiUrl('/api/settings'))
        ]);

        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          setCharacters(charactersData.characters || []);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData.settings || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const addCharacter = (character: Character) => {
    if (selectedCharacters.find(sc => sc.character.id === character.id)) {
      return; // Already selected
    }

    setSelectedCharacters(prev => [...prev, {
      character,
      introMessage: character.defaultIntroMessage || ''
    }]);
  };

  const removeCharacter = (characterId: string) => {
    setSelectedCharacters(prev => prev.filter(sc => sc.character.id !== characterId));
  };

  const updateIntroMessage = (characterId: string, message: string) => {
    setSelectedCharacters(prev => prev.map(sc => 
      sc.character.id === characterId 
        ? { ...sc, introMessage: message }
        : sc
    ));
  };

  const canBeginChat = () => {
    return selectedSetting && 
           selectedCharacters.length > 0 && 
           selectedCharacters.some(sc => sc.introMessage.trim().length > 0);
  };

  const beginChat = async () => {
    if (!canBeginChat()) return;
    
    setIsCreatingStory(true);
    try {
      // Create chat session
      const response = await fetch(getApiUrl('/api/chat-sessions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingId: selectedSetting!.id,
          characters: selectedCharacters.map(sc => ({
            characterId: sc.character.id,
            introMessage: sc.introMessage
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add a small delay to ensure database transaction commits
        setTimeout(() => {
          router.push(`/chat/${data.session.id}`);
        }, 500); // 500ms delay
      } else {
        const errorData = await response.json();
        alert(`Failed to create story: ${errorData.message || 'Unknown error'}`);
        setIsCreatingStory(false);
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
      alert('Failed to create story. Please try again.');
      setIsCreatingStory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="story-config-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading characters and settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-config-container">
      <div className="story-config-header">
        <h1>✨ Configure Your Story</h1>
        <p>Select characters, choose a setting, and customize intro messages</p>
        <Link href="/" className="btn btn-outline">
          ← Back to Home
        </Link>
      </div>

      <div className="story-config-content">
        {/* Setting Selection */}
        <div className="config-section">
          <div className="section-header">
            <h2>🏰 Choose Setting</h2>
            <div className="section-actions">
              <Link href="/settings" className="btn btn-outline btn-small">
                Browse All Settings
              </Link>
              <Link href="/setting-builder" className="btn btn-primary btn-small">
                Create New Setting
              </Link>
            </div>
          </div>

          <div className="setting-selection">
            <div className="form-group">
              <label htmlFor="settingSelect">Select a Setting *</label>
              <select
                id="settingSelect"
                className="form-select"
                value={selectedSetting?.id || ''}
                onChange={(e) => {
                  const setting = settings.find(s => s.id === e.target.value);
                  setSelectedSetting(setting || null);
                }}
              >
                <option value="">Choose a setting...</option>
                {settings.map((setting) => (
                  <option key={setting.id} value={setting.id}>
                    {setting.name} - {Array.isArray(setting.theme) ? setting.theme.join(', ') : setting.theme || setting.settingType || 'General'}
                  </option>
                ))}
              </select>
            </div>

            {selectedSetting && (
              <div className="selected-setting-preview">
                <div className="setting-preview-card">
                  <div className="setting-image">
                    {selectedSetting.imageUrl ? (
                      <img src={selectedSetting.imageUrl} alt={selectedSetting.name} />
                    ) : (
                      <div className="placeholder-image">🏰</div>
                    )}
                  </div>
                  <div className="setting-info">
                    <h3>{truncateText(selectedSetting.name, 30)}</h3>
                    <p>{truncateText(selectedSetting.description, 100)}</p>
                    {selectedSetting.theme && (
                      <span className="setting-tag">Theme: {truncateText(Array.isArray(selectedSetting.theme) ? selectedSetting.theme.join(', ') : selectedSetting.theme, 20)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {settings.length === 0 && (
              <div className="empty-state">
                <div className="icon">🏰</div>
                <p>No settings available</p>
                <Link href="/setting-builder" className="btn btn-primary">
                  Create Your First Setting
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Character Selection */}
        <div className="config-section">
          <div className="section-header">
            <h2>💕 Select Characters</h2>
            <div className="section-actions">
              <Link href="/characters" className="btn btn-outline btn-small">
                Browse All Characters
              </Link>
              <Link href="/character-builder" className="btn btn-primary btn-small">
                Create New Character
              </Link>
            </div>
          </div>

          {/* Available Characters */}
          {characters.length > 0 && (
            <div className="available-characters">
              <h3>Available Characters</h3>
              <div className="characters-grid">
                {characters
                  .filter(char => !selectedCharacters.find(sc => sc.character.id === char.id))
                  .slice(0, 6)
                  .map((character) => (
                  <div 
                    key={character.id} 
                    className="character-card selectable"
                    onClick={() => addCharacter(character)}
                  >
                    <div className="character-image">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`}
                        alt={character.name}
                      />
                      <div className="character-overlay">
                        <span>+ Add</span>
                      </div>
                    </div>
                    <div className="character-info">
                      <h3>{truncateText(character.name, 20)}</h3>
                      <p>{truncateText(character.archetype, 25)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Characters with Intro Messages */}
          {selectedCharacters.length > 0 && (
            <div className="selected-characters">
              <h3>Selected Characters ({selectedCharacters.length})</h3>
              {selectedCharacters.map((charConfig) => (
                <div key={charConfig.character.id} className="character-config">
                  <div className="character-summary">
                    <div className="character-image">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${charConfig.character.name}`}
                        alt={charConfig.character.name}
                      />
                    </div>
                    <div className="character-info">
                      <h4>{truncateText(charConfig.character.name, 20)}</h4>
                      <p>{truncateText(charConfig.character.archetype, 25)}</p>
                    </div>
                    <button 
                      className="btn btn-outline btn-small"
                      onClick={() => removeCharacter(charConfig.character.id)}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="intro-message-config">
                    <label>Intro Message (optional)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder={`What does ${charConfig.character.name} say when the story begins?`}
                      value={charConfig.introMessage}
                      onChange={(e) => updateIntroMessage(charConfig.character.id, e.target.value)}
                    />
                    <p className="field-note">
                      {charConfig.introMessage.trim() ? 
                        `${charConfig.character.name} will speak when the story begins` :
                        `${charConfig.character.name} will remain silent until spoken to`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCharacters.length === 0 && (
            <div className="empty-state">
              <div className="icon">💭</div>
              <p>No characters selected</p>
              <p className="text-sm">Choose characters from the list above</p>
            </div>
          )}
        </div>

        {/* Begin Chat */}
        <div className="config-actions">
          {!canBeginChat() && (
            <div className="validation-message">
              {!selectedSetting && "Please select a setting"}
              {selectedSetting && selectedCharacters.length === 0 && "Please select at least one character"}
              {selectedSetting && selectedCharacters.length > 0 && 
               !selectedCharacters.some(sc => sc.introMessage.trim()) && 
               "At least one character needs an intro message"}
            </div>
          )}
          
          <button 
            className="btn btn-primary btn-large"
            onClick={beginChat}
            disabled={!canBeginChat() || isCreatingStory}
          >
            {isCreatingStory ? '⏳ Creating Story...' : '✨ Begin Story'}
          </button>
        </div>
      </div>
    </div>
  );
}