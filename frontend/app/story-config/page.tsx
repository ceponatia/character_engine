'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../utils/api-config';
import { getCharacterAvatar, getSettingImage, truncateText, parseThemeField } from '../utils/helpers';
import { ThemeTag } from '../components/UI/TagBubble';
import { BackButton } from '../components/UI/ActionButtons';

interface Character {
  id: string;
  name: string;
  archetype: string;
  description: string;
  defaultIntroMessage?: string;
  imageUrl?: string;
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
      // Create story
      const response = await fetch(getApiUrl('/api/stories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingId: selectedSetting!.id,
          characters: selectedCharacters.map(sc => ({
            characterId: sc.character.id,
            introMessage: sc.introMessage
          })),
          userName: 'User' // Default user name until we implement accounts
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add a small delay to ensure database transaction commits
        setTimeout(() => {
          router.push(`/stories/${data.story.id}/chat`);
        }, 500); // 500ms delay
      } else {
        const errorData = await response.json();
        alert(`Failed to create story: ${errorData.message || 'Unknown error'}`);
        setIsCreatingStory(false);
      }
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
      setIsCreatingStory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-romantic-gradient flex items-center justify-center">
        <div className="card-romantic p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Loading Story Configuration</h3>
          <p className="text-slate-400">Fetching characters and settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <div className="mb-4">
                <BackButton />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                ✨ Configure Your Story
              </h1>
              <p className="text-slate-400">
                Select characters, choose a setting, and customize intro messages
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Setting Selection */}
          <div className="card-romantic p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                🏰 Choose Setting
              </h2>
              <div className="flex gap-3">
                <Link href="/settings" className="btn-romantic-outline">
                  Browse All Settings
                </Link>
                <Link href="/setting-builder" className="btn-romantic-primary">
                  Create New Setting
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="settingSelect" className="block text-sm font-medium text-slate-300 mb-2">
                  Select a Setting *
                </label>
                <select
                  id="settingSelect"
                  className="input-romantic w-full"
                  value={selectedSetting?.id || ''}
                  onChange={(e) => {
                    const setting = settings.find(s => s.id === e.target.value);
                    setSelectedSetting(setting || null);
                  }}
                >
                  <option value="">Choose a setting...</option>
                  {settings.map((setting) => (
                    <option key={setting.id} value={setting.id}>
                      {setting.name} - {
                        Array.isArray(setting.theme) 
                          ? setting.theme.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(', ')
                          : parseThemeField(setting.theme) || setting.settingType || 'General'
                      }
                    </option>
                  ))}
                </select>
              </div>

              {selectedSetting && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
                      <img 
                        src={getSettingImage(selectedSetting)} 
                        alt={selectedSetting.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-100 mb-2">
                        {truncateText(selectedSetting.name, 30)}
                      </h3>
                      <p className="text-slate-300 mb-3">
                        {truncateText(selectedSetting.description, 100)}
                      </p>
                      {selectedSetting.theme && (
                        <ThemeTag>
                          {Array.isArray(selectedSetting.theme) 
                            ? selectedSetting.theme.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(', ')
                            : parseThemeField(selectedSetting.theme)
                          }
                        </ThemeTag>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {settings.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🏰</div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">No settings available</h3>
                  <p className="text-slate-400 mb-6">Create your first setting to begin</p>
                  <Link href="/setting-builder" className="btn-romantic-primary">
                    Create Your First Setting
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Character Selection */}
          <div className="card-romantic p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                💕 Select Characters
              </h2>
              <div className="flex gap-3">
                <Link href="/characters" className="btn-romantic-outline">
                  Browse All Characters
                </Link>
                <Link href="/character-builder" className="btn-romantic-primary">
                  Create New Character
                </Link>
              </div>
            </div>

            {/* Available Characters */}
            {characters.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Available Characters</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {characters
                    .filter(char => !selectedCharacters.find(sc => sc.character.id === char.id))
                    .slice(0, 6)
                    .map((character) => (
                    <div 
                      key={character.id} 
                      className="relative group cursor-pointer bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-rose-500/50 hover:bg-slate-700/50 transition-all duration-200"
                      onClick={() => addCharacter(character)}
                    >
                      <div className="relative mb-3">
                        <img 
                          src={getCharacterAvatar(character)}
                          alt={character.name}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium">+ Add</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-slate-100 mb-1">
                        {truncateText(character.name, 15)}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {truncateText(character.archetype, 20)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Characters with Intro Messages */}
            {selectedCharacters.length > 0 && (
              <div className="space-y-4 mt-8">
                <h3 className="text-lg font-semibold text-slate-100">
                  Selected Characters ({selectedCharacters.length})
                </h3>
                <div className="space-y-4">
                  {selectedCharacters.map((charConfig) => (
                    <div key={charConfig.character.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={getCharacterAvatar(charConfig.character)}
                          alt={charConfig.character.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-slate-100">
                            {truncateText(charConfig.character.name, 20)}
                          </h4>
                          <p className="text-slate-400">
                            {truncateText(charConfig.character.archetype, 25)}
                          </p>
                        </div>
                        <button 
                          className="btn-romantic-outline"
                          onClick={() => removeCharacter(charConfig.character.id)}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Intro Message (optional)
                        </label>
                        <textarea
                          className="input-romantic w-full"
                          rows={3}
                          placeholder={`What does ${charConfig.character.name} say when the story begins?`}
                          value={charConfig.introMessage}
                          onChange={(e) => updateIntroMessage(charConfig.character.id, e.target.value)}
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          {charConfig.introMessage.trim() ? 
                            `${charConfig.character.name} will speak when the story begins` :
                            `${charConfig.character.name} will remain silent until spoken to`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCharacters.length === 0 && characters.length > 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💭</div>
                <h3 className="text-lg font-medium text-slate-100 mb-2">No characters selected</h3>
                <p className="text-slate-400">Choose characters from the list above</p>
              </div>
            )}

            {characters.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💭</div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">No characters available</h3>
                <p className="text-slate-400 mb-6">Create your first character to begin</p>
                <Link href="/character-builder" className="btn-romantic-primary">
                  Create Your First Character
                </Link>
              </div>
            )}
          </div>

          {/* Begin Chat */}
          <div className="text-center space-y-4">
            {!canBeginChat() && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-400 font-medium">
                  {!selectedSetting && "Please select a setting"}
                  {selectedSetting && selectedCharacters.length === 0 && "Please select at least one character"}
                  {selectedSetting && selectedCharacters.length > 0 && 
                   !selectedCharacters.some(sc => sc.introMessage.trim()) && 
                   "At least one character needs an intro message"}
                </p>
              </div>
            )}
            
            <button 
              className="btn-romantic-primary text-xl px-12 py-4"
              onClick={beginChat}
              disabled={!canBeginChat() || isCreatingStory}
            >
              {isCreatingStory ? '⏳ Creating Story...' : '✨ Begin Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}