'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Character {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  
  // Identity
  sourceMaterial?: string;
  archetype: string;
  chatbotRole: string;
  conceptualAge?: string;
  
  // Visual Avatar
  description?: string;
  attire?: string;
  colors: string[];
  features?: string;
  
  // Vocal Style
  tone: string[];
  pacing?: string;
  inflection?: string;
  vocabulary?: string;
  
  // Personality
  primaryTraits: string[];
  secondaryTraits: string[];
  quirks: string[];
  interruptionTolerance: string;
  
  // Operational Directives
  primaryMotivation?: string;
  coreGoal?: string;
  secondaryGoals: string[];
  
  // Interaction Model
  coreAbilities: string[];
  approach?: string;
  patience?: string;
  demeanor?: string;
  adaptability?: string;
  
  // Signature Phrases
  greeting?: string;
  affirmation?: string;
  comfort?: string;
  
  // Boundaries
  forbiddenTopics: string[];
  interactionPolicy?: string;
  conflictResolution?: string;
}

export default function CharacterProfilePage() {
  const params = useParams();
  const characterId = params.id as string;
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterId) {
      fetchCharacter();
    }
  }, [characterId]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      'white': '#ffffff',
      'black': '#000000',
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#10b981',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'yellow': '#f59e0b',
      'orange': '#f97316',
      'gold': '#d97706',
      'silver': '#6b7280',
      'brown': '#92400e'
    };
    return colorMap[color.toLowerCase()] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Character Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Link
            href="/characters"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/characters" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Characters
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {character.name}
              </h1>
              <div className="flex gap-3 mb-2">
                <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm font-medium rounded-full">
                  {character.archetype}
                </span>
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                  {character.chatbotRole}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Created {formatDate(character.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/characters/${character.id}/edit`}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Edit
              </Link>
              <Link
                href={`/characters/${character.id}/chat`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Start Chat
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Identity Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {character.sourceMaterial && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Source Material
                    </label>
                    <p className="text-gray-800 dark:text-white">{character.sourceMaterial}</p>
                  </div>
                )}
                {character.conceptualAge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Conceptual Age
                    </label>
                    <p className="text-gray-800 dark:text-white">{character.conceptualAge}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Appearance</h2>
              {character.description && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Physical Description
                  </label>
                  <p className="text-gray-800 dark:text-white">{character.description}</p>
                </div>
              )}
              {character.attire && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Typical Attire
                  </label>
                  <p className="text-gray-800 dark:text-white">{character.attire}</p>
                </div>
              )}
              {character.features && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Distinctive Features
                  </label>
                  <p className="text-gray-800 dark:text-white">{character.features}</p>
                </div>
              )}
              {character.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Color Palette
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {character.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: getColorStyle(color) }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personality Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Personality</h2>
              
              {character.primaryTraits.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Primary Traits
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {character.primaryTraits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {character.secondaryTraits.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Secondary Traits
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {character.secondaryTraits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {character.quirks.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Unique Quirks
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {character.quirks.map((quirk, index) => (
                      <li key={index} className="text-gray-800 dark:text-white text-sm">
                        {quirk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Interruption Tolerance
                </label>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  character.interruptionTolerance === 'high' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : character.interruptionTolerance === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}>
                  {character.interruptionTolerance}
                </span>
              </div>
            </div>

            {/* Goals & Motivation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Goals & Motivation</h2>
              
              {character.primaryMotivation && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Primary Motivation
                  </label>
                  <p className="text-gray-800 dark:text-white">{character.primaryMotivation}</p>
                </div>
              )}

              {character.coreGoal && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Core Goal
                  </label>
                  <p className="text-gray-800 dark:text-white">{character.coreGoal}</p>
                </div>
              )}

              {character.secondaryGoals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Secondary Goals
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {character.secondaryGoals.map((goal, index) => (
                      <li key={index} className="text-gray-800 dark:text-white text-sm">
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            
            {/* Voice & Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Voice & Style</h2>
              
              {character.tone.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Vocal Tones
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {character.tone.map((t, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {character.pacing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Speech Pacing
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm">{character.pacing}</p>
                </div>
              )}

              {character.vocabulary && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Vocabulary Style
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm">{character.vocabulary}</p>
                </div>
              )}
            </div>

            {/* Interaction Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Interaction</h2>
              
              {character.coreAbilities.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Core Abilities
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {character.coreAbilities.map((ability, index) => (
                      <li key={index} className="text-gray-800 dark:text-white text-sm">
                        {ability}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {character.approach && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Approach
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm">{character.approach}</p>
                </div>
              )}

              {character.demeanor && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Demeanor
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm">{character.demeanor}</p>
                </div>
              )}
            </div>

            {/* Signature Phrases */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Signature Phrases</h2>
              
              {character.greeting && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Greeting
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm italic">"{character.greeting}"</p>
                </div>
              )}

              {character.affirmation && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Affirmation
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm italic">"{character.affirmation}"</p>
                </div>
              )}

              {character.comfort && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Comfort
                  </label>
                  <p className="text-gray-800 dark:text-white text-sm italic">"{character.comfort}"</p>
                </div>
              )}
            </div>

            {/* Boundaries */}
            {(character.forbiddenTopics.length > 0 || character.interactionPolicy || character.conflictResolution) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Boundaries</h2>
                
                {character.forbiddenTopics.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Forbidden Topics
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {character.forbiddenTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {character.conflictResolution && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Conflict Resolution
                    </label>
                    <p className="text-gray-800 dark:text-white text-sm">{character.conflictResolution}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}