'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Character {
  id: string;
  name: string;
  archetype: string;
  chatbotRole: string;
  description?: string;
  createdAt: string;
  primaryTraits: string[];
  colors: string[];
  tone: string[];
  avatarImage?: string;
  imageUrl?: string;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/characters');
      const data = await response.json();
      
      if (response.ok) {
        setCharacters(data.characters || []);
      } else {
        setError('Failed to fetch characters');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvatarSource = (character: Character) => {
    // Priority: uploaded avatar > imageUrl > generated avatar
    if (character.avatarImage) {
      return character.avatarImage;
    }
    if (character.imageUrl) {
      return character.imageUrl;
    }
    // Fallback to generated avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}&backgroundColor=1e293b&clothesColor=be123c`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link href="/" className="btn btn-outline text-sm mb-4 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">
                Your Characters
              </h1>
              <p className="text-slate-400">
                Your created companions await
              </p>
            </div>
            <Link
              href="/character-builder"
              className="btn btn-primary"
            >
              Create New Character
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card mb-8" style={{borderColor: '#ef4444'}}>
            <p style={{color: '#f87171'}} className="mb-3">{error}</p>
            <button
              onClick={fetchCharacters}
              className="btn btn-outline text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && characters.length === 0 && (
          <div className="empty-state">
            <div className="icon">💭</div>
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              Your Gallery Awaits
            </h3>
            <p className="text-slate-400 mb-8 text-lg">
              Create your first character and bring them to life
            </p>
            <Link
              href="/character-builder"
              className="btn btn-primary text-lg px-8 py-4"
            >
              Create Your First Character
            </Link>
          </div>
        )}

        {/* Characters Grid */}
        {characters.length > 0 && (
          <div className="characters-grid">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="block"
              >
                <div className="character-card">
                  <div className="character-image">
                    <img
                      src={getAvatarSource(character)}
                      alt={character.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback to generated avatar if uploaded image fails
                        target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}&backgroundColor=1e293b&clothesColor=be123c`;
                      }}
                    />
                    <div className="character-overlay">
                      <h3 className="character-name">
                        {character.name}
                      </h3>
                      <p className="character-archetype">
                        {character.archetype}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}