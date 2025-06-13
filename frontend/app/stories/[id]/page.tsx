'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiDelete } from '../../utils/api';
import { getCharacterAvatar, formatRelativeTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ErrorCard from '../../components/UI/ErrorCard';

interface Character {
  id: string;
  name: string;
  archetype: string;
  chatbotRole: string;
  description: string;
  primaryTraits: string[];
  colors: string[];
  tone: string[];
  greeting: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  theme?: string;
  plot?: string;
}

interface Story {
  id: string;
  name: string;
  settingId: string;
  characterId: string;
  character: Character;
  setting: Setting;
  createdAt: string;
  lastActivity: string;
  messages?: any[];
}

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        console.log('Fetching story with ID:', storyId);
        const response = await apiGet(`/api/stories/${storyId}`);
        console.log('API Response:', response);
        if (response.success && response.story) {
          console.log('Story data:', response.story);
          setStory(response.story);
        } else {
          console.log('API Error:', response.error);
          setError(response.error || 'Story not found');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        setError('Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  const deleteStory = async () => {
    if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiDelete(`/api/stories/${storyId}`);
      if (response.success) {
        router.push('/library?type=stories');
      } else {
        alert('Failed to delete story: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <LoadingSpinner size="lg" text="Loading your story..." />
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <ErrorCard 
              title="Story Not Found"
              message={error || 'This story could not be found.'}
              action={
                <Link href="/library?type=stories" className="btn-romantic-primary">
                  Back to Story Library
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/library?type=stories" className="inline-flex items-center text-rose-400 hover:text-rose-300 transition-colors mb-6">
            ← Back to Story Library
          </Link>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                📖 {story.name}
              </h1>
              <p className="text-slate-400">View story details and continue your adventure</p>
            </div>
            
            <div className="flex gap-4">
              <Link 
                href={`/stories/${story.id}/chat`}
                className="btn-romantic-primary"
              >
                🎭 Resume Story
              </Link>
              <button 
                className="btn-romantic-outline border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                onClick={deleteStory}
                disabled={isDeleting}
              >
                {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Story'}
              </button>
            </div>
          </div>
        </div>

        {/* Story Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Character Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                💕 Character
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 flex-shrink-0">
                  <img 
                    src={getCharacterAvatar(story.character || {})}
                    alt={story.character?.name || 'Character'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-medium text-slate-100 truncate">
                    {story.character?.name || 'Unknown Character'}
                  </h3>
                  <p className="text-sm text-rose-400">{story.character?.archetype}</p>
                  <p className="text-sm text-slate-400">{story.character?.chatbotRole}</p>
                </div>
              </div>
                
              {story.character?.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                  <p className="text-sm text-slate-400">{story.character.description}</p>
                </div>
              )}
                
              {story.character?.primaryTraits && story.character.primaryTraits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Primary Traits</h4>
                  <div className="flex flex-wrap gap-1">
                    {story.character.primaryTraits.map((trait: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded-full border border-purple-500/30">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
                
              {story.character?.greeting && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Greeting</h4>
                  <p className="text-sm text-slate-400 italic">"{story.character.greeting}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Setting Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                🏰 Setting
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-slate-100">
                  {story.setting?.name || 'General Setting'}
                </h3>
                {story.setting?.theme && (
                  <p className="text-sm text-rose-400">Theme: {story.setting.theme}</p>
                )}
              </div>
              
              {story.setting?.description && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                  <p className="text-sm text-slate-400">{story.setting.description}</p>
                </div>
              )}
              
              {story.setting?.plot && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Plot</h4>
                  <p className="text-sm text-slate-400">{story.setting.plot}</p>
                </div>
              )}
            </div>
          </div>

          {/* Story Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                📊 Story Stats
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm font-medium text-slate-300">Created:</span>
                <span className="text-sm text-slate-400">{formatRelativeTime(story.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm font-medium text-slate-300">Last Activity:</span>
                <span className="text-sm text-slate-400">{formatRelativeTime(story.lastActivity)}</span>
              </div>
              {story.messages && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-300">Messages:</span>
                  <span className="text-sm text-slate-400">{story.messages.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link 
            href={`/stories/${story.id}/chat`}
            className="btn-romantic-primary text-lg px-8 py-4"
          >
            🎭 Resume Your Story
          </Link>
          <Link 
            href="/library?type=stories"
            className="btn-romantic-outline text-lg px-8 py-4"
          >
            📚 Back to Library
          </Link>
        </div>
      </div>
    </div>
  );
}