'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getApiUrl, testBackendConnection, getBackendStatus } from '../utils/api-config';
import StableCard, { SelectionOverlay } from '../components/UI/StableCard';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import { LoadingStates } from '../components/UI/LoadingSpinner';
import { ErrorStates } from '../components/UI/ErrorCard';
import SafeImage from '../components/UI/SafeImage';
import { truncateText, getCharacterAvatar, formatRelativeTime } from '../utils/helpers';

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
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    url: string;
    port: string;
  } | null>(null);
  
  // Delete mode state
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      // Get current backend status
      const status = await getBackendStatus();
      setBackendStatus(status);
      
      if (!status.connected) {
        setError(`Backend not responding on ${status.url}`);
        setLoading(false);
        return;
      }
      
      const response = await fetch(getApiUrl('/api/characters'));
      const data = await response.json();
      
      if (response.ok) {
        setCharacters(data.characters || []);
        setError(null); // Clear any previous errors
      } else {
        setError('Failed to fetch characters');
      }
    } catch (err) {
      const status = backendStatus || await getBackendStatus();
      setError(`Error connecting to server (${status.url})`);
      console.error('Error fetching characters:', err);
    } finally {
      setLoading(false);
    }
  };




  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedCharacters(new Set());
    setShowConfirmDialog(false);
  };

  const toggleCharacterSelection = (characterId: string) => {
    const newSelected = new Set(selectedCharacters);
    if (newSelected.has(characterId)) {
      newSelected.delete(characterId);
    } else {
      newSelected.add(characterId);
    }
    setSelectedCharacters(newSelected);
  };

  const handleConfirmDelete = () => {
    setShowConfirmDialog(true);
  };

  const handleDeleteCharacters = async () => {
    try {
      const deletePromises = Array.from(selectedCharacters).map(async (characterId) => {
        const response = await fetch(getApiUrl(`/api/characters/${characterId}`), {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete character ${characterId}`);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Refresh characters list
      await fetchCharacters();
      
      // Reset delete mode
      setDeleteMode(false);
      setSelectedCharacters(new Set());
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error deleting characters:', err);
      setError('Failed to delete characters');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingStates.CharacterLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 mr-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <Link href="/" className="inline-flex items-center text-rose-400 hover:text-rose-300 transition-colors mb-4">
                ← Back to Home
              </Link>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Your Characters
              </h1>
              <p className="text-slate-400">
                Your created companions await
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/character-builder"
                className="btn-romantic-primary"
              >
                Create New Character
              </Link>
              {!deleteMode ? (
                <button
                  onClick={toggleDeleteMode}
                  className="btn-romantic-outline"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={toggleDeleteMode}
                  className="btn-romantic-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Placeholder Text Section */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Welcome to Your Character Gallery</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Manage your AI companions here. Create new characters, chat with existing ones, or organize your collection.
              </p>
              <div className="mt-2 h-6 flex justify-center">
                <span className={`text-rose-400 font-medium transition-opacity duration-200 ${
                  deleteMode ? 'opacity-100' : 'opacity-0'
                }`}>
                  Select characters to delete by clicking on their cards.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <ErrorStates.LoadingError 
              message={`${error}${backendStatus ? ` Frontend: ${typeof window !== 'undefined' ? window.location.origin : 'SSR'}, Backend: ${backendStatus.url} (${backendStatus.connected ? '✅ Connected' : '❌ Disconnected'})` : ''}`}
              onRetry={fetchCharacters}
            />
          </div>
        )}

        {/* Empty State */}
        {!error && characters.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">💭</div>
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              Your Gallery Awaits
            </h3>
            <p className="text-slate-400 mb-8 text-lg">
              Create your first character and bring them to life
            </p>
            <Link
              href="/character-builder"
              className="btn-romantic-primary text-lg px-8 py-4"
            >
              Create Your First Character
            </Link>
          </div>
        )}

        {/* Characters Grid Section */}
        {characters.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Scrollable Characters Container */}
            <div className="w-full max-w-6xl">
              <div 
                className="h-[480px] overflow-y-scroll scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#475569 #1e293b',
                  scrollbarGutter: 'stable'
                }}
              >
                <div className="grid grid-cols-4 gap-6 px-2 pt-2">
                  {characters.map((character) => (
                    <div key={character.id} className="relative">
                      <StableCard
                        href={`/characters/${character.id}`}
                        isInteractive={deleteMode}
                        isSelected={selectedCharacters.has(character.id)}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCharacterSelection(character.id);
                        }}
                        overlays={[
                          <SelectionOverlay 
                            key="selection" 
                            isSelected={deleteMode && selectedCharacters.has(character.id)} 
                          />
                        ]}
                      >
                        <SafeImage
                          src={character.imageUrl || character.avatarImage}
                          alt={character.name}
                          className="w-full h-48 object-cover"
                          fallbackType="character"
                          fallbackData={{ name: character.name }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {truncateText(character.name, 25)}
                            </h3>
                            <p className="text-sm text-slate-200 opacity-90">
                              {truncateText(character.archetype, 30)}
                            </p>
                          </div>
                        </div>
                      </StableCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delete Action Buttons */}
            {deleteMode && selectedCharacters.size > 0 && (
              <div className="mt-6 flex justify-end w-full max-w-6xl">
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Confirm Delete ({selectedCharacters.size})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationModal
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleDeleteCharacters}
          title="Confirm Delete"
          message={`Are you sure you want to delete ${selectedCharacters.size} character${selectedCharacters.size > 1 ? 's' : ''}? This action cannot be undone and will cause stories using these characters to no longer work.`}
          confirmLabel="Confirm Delete"
          type="error"
        />
      </div>
    </div>
  );
}