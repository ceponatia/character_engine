'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getApiUrl } from '../../utils/api-config';
import { getCharacterAvatar, formatDate, truncateText } from '../../utils/helpers';

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
  imageUrl?: string;
  avatarImage?: string;
  
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
    fetchCharacter();
  }, [characterId]);

  const fetchCharacter = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/characters/${characterId}`));
      const data = await response.json();
      
      if (response.ok) {
        setCharacter(data.character);
      } else {
        setError('Character not found');
      }
    } catch (err) {
      setError('Error loading character');
      console.error('Error fetching character:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-3xl font-bold text-slate-100 mb-4">Character Not Found</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <Link href="/characters" className="btn btn-primary">
            ← Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <Link href="/characters" className="btn btn-outline text-sm mb-6 inline-block">
            ← Back to Characters
          </Link>
          
          {/* Character Header */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <img
                src={getCharacterAvatar(character)}
                alt={character.name}
                className="w-48 h-48 object-cover rounded-2xl shadow-xl border-2 border-rose-500/30"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getCharacterAvatar(character);
                }}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {character.name}
              </h1>
              <p className="text-xl text-slate-300 mb-4">
                {character.archetype} • {character.chatbotRole}
              </p>
              {character.description && (
                <p className="text-slate-400 mb-6 leading-relaxed">{character.description}</p>
              )}
              <div className="flex flex-wrap gap-4">
                <Link href="/story-config" className="btn-romantic-primary">
                  🎭 Create Story
                </Link>
                <Link href={`/character-builder?edit=${character.id}`} className="btn-romantic-secondary">
                  ✏️ Edit Character
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Character Details Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Identity Section */}
          <div className="card-romantic p-6">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              ✨ Identity
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Role</label>
                <span className="text-slate-200">{character.chatbotRole}</span>
              </div>
              {character.sourceMaterial && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Source</label>
                  <span className="text-slate-200">{character.sourceMaterial}</span>
                </div>
              )}
              {character.conceptualAge && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Age</label>
                  <span className="text-slate-200">{character.conceptualAge}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Created</label>
                <span className="text-slate-200">{formatDate(character.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="card-romantic p-6">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              🎨 Appearance
            </h2>
            <div className="space-y-4">
              {character.attire && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Attire</label>
                  <span className="text-slate-200">{character.attire}</span>
                </div>
              )}
              {character.features && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Features</label>
                  <span className="text-slate-200">{character.features}</span>
                </div>
              )}
              {(character.colors || []).length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-400">Color Palette</label>
                  <div className="flex flex-wrap gap-2">
                    {(character.colors || []).map((color, index) => (
                      <span key={index} className="bg-gradient-to-r from-purple-600/20 to-violet-600/20 text-purple-300 px-3 py-1 rounded-lg text-sm border border-purple-500/30">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personality Section */}
          <div className="card">
            <h2 className="section-title">💫 Personality</h2>
            <div className="detail-group">
              {(character.primaryTraits || []).length > 0 && (
                <div className="detail-item">
                  <label>Primary Traits</label>
                  <div className="trait-tags">
                    {(character.primaryTraits || []).map((trait, index) => (
                      <span key={index} className="trait-tag primary-trait">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(character.secondaryTraits || []).length > 0 && (
                <div className="detail-item">
                  <label>Secondary Traits</label>
                  <div className="trait-tags">
                    {(character.secondaryTraits || []).map((trait, index) => (
                      <span key={index} className="trait-tag secondary-trait">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(character.quirks || []).length > 0 && (
                <div className="detail-item">
                  <label>Quirks</label>
                  <div className="trait-tags">
                    {(character.quirks || []).map((quirk, index) => (
                      <span key={index} className="trait-tag quirk-tag">
                        {quirk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.interruptionTolerance && (
                <div className="detail-item">
                  <label>Interruption Tolerance</label>
                  <span className="detail-value">{character.interruptionTolerance}</span>
                </div>
              )}
            </div>
          </div>

          {/* Voice & Communication */}
          <div className="card">
            <h2 className="section-title">🎭 Voice & Communication</h2>
            <div className="detail-group">
              {(character.tone || []).length > 0 && (
                <div className="detail-item">
                  <label>Tone</label>
                  <div className="trait-tags">
                    {(character.tone || []).map((tone, index) => (
                      <span key={index} className="trait-tag tone-tag">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.pacing && (
                <div className="detail-item">
                  <label>Pacing</label>
                  <span className="detail-value">{character.pacing}</span>
                </div>
              )}
              {character.vocabulary && (
                <div className="detail-item">
                  <label>Vocabulary</label>
                  <span className="detail-value">{character.vocabulary}</span>
                </div>
              )}
              {character.inflection && (
                <div className="detail-item">
                  <label>Inflection</label>
                  <span className="detail-value">{character.inflection}</span>
                </div>
              )}
            </div>
          </div>

          {/* Goals & Motivations */}
          <div className="card">
            <h2 className="section-title">🎯 Goals & Motivations</h2>
            <div className="detail-group">
              {character.primaryMotivation && (
                <div className="detail-item">
                  <label>Primary Motivation</label>
                  <span className="detail-value">{character.primaryMotivation}</span>
                </div>
              )}
              {character.coreGoal && (
                <div className="detail-item">
                  <label>Core Goal</label>
                  <span className="detail-value">{character.coreGoal}</span>
                </div>
              )}
              {(character.secondaryGoals || []).length > 0 && (
                <div className="detail-item">
                  <label>Secondary Goals</label>
                  <div className="trait-tags">
                    {(character.secondaryGoals || []).map((goal, index) => (
                      <span key={index} className="trait-tag goal-tag">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Abilities & Approach */}
          <div className="card">
            <h2 className="section-title">⚡ Abilities & Approach</h2>
            <div className="detail-group">
              {(character.coreAbilities || []).length > 0 && (
                <div className="detail-item">
                  <label>Core Abilities</label>
                  <div className="trait-tags">
                    {(character.coreAbilities || []).map((ability, index) => (
                      <span key={index} className="trait-tag ability-tag">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.approach && (
                <div className="detail-item">
                  <label>Approach</label>
                  <span className="detail-value">{character.approach}</span>
                </div>
              )}
              {character.demeanor && (
                <div className="detail-item">
                  <label>Demeanor</label>
                  <span className="detail-value">{character.demeanor}</span>
                </div>
              )}
              {character.patience && (
                <div className="detail-item">
                  <label>Patience</label>
                  <span className="detail-value">{character.patience}</span>
                </div>
              )}
              {character.adaptability && (
                <div className="detail-item">
                  <label>Adaptability</label>
                  <span className="detail-value">{character.adaptability}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signature Phrases */}
        {(character.greeting || character.affirmation || character.comfort) && (
          <div className="card signature-phrases-card">
            <h2 className="section-title">💬 Signature Phrases</h2>
            <div className="signature-phrases">
              {character.greeting && (
                <div className="signature-phrase">
                  <label>Greeting</label>
                  <blockquote>"{character.greeting}"</blockquote>
                </div>
              )}
              {character.affirmation && (
                <div className="signature-phrase">
                  <label>Affirmation</label>
                  <blockquote>"{character.affirmation}"</blockquote>
                </div>
              )}
              {character.comfort && (
                <div className="signature-phrase">
                  <label>Comfort</label>
                  <blockquote>"{character.comfort}"</blockquote>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boundaries */}
        {((character.forbiddenTopics || character.forbidden_topics || []).length > 0 || 
          character.interactionPolicy || character.interaction_policy || 
          character.conflictResolution || character.conflict_resolution) && (
          <div className="card">
            <h2 className="section-title">🛡️ Boundaries & Guidelines</h2>
            <div className="detail-group">
              {(character.forbiddenTopics || character.forbidden_topics || []).length > 0 && (
                <div className="detail-item">
                  <label>Forbidden Topics</label>
                  <div className="trait-tags">
                    {(character.forbiddenTopics || character.forbidden_topics || []).map((topic, index) => (
                      <span key={index} className="trait-tag forbidden-tag">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(character.interactionPolicy || character.interaction_policy) && (
                <div className="detail-item">
                  <label>Interaction Policy</label>
                  <span className="detail-value">{character.interactionPolicy || character.interaction_policy}</span>
                </div>
              )}
              {(character.conflictResolution || character.conflict_resolution) && (
                <div className="detail-item">
                  <label>Conflict Resolution</label>
                  <span className="detail-value">{character.conflictResolution || character.conflict_resolution}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="character-actions">
          <Link href="/story-config" className="btn btn-primary btn-large">
            🎭 Create Story with {truncateText(character.name, 20)}
          </Link>
          <Link href={`/character-builder?edit=${character.id}`} className="btn btn-secondary">
            ✏️ Edit Character
          </Link>
          <Link href="/characters" className="btn btn-outline">
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}