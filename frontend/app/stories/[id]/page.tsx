'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../utils/api-config';

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

interface ChatSession {
  id: string;
  name: string;
  setting_id: string;
  character_id: string;
  characters: Character;
  settings: Setting;
  createdAt: string;
  lastActivity: string;
  messages?: any[];
}

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const [story, setStory] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/chat-sessions/${storyId}`));
        if (response.ok) {
          const data = await response.json();
          setStory(data.session);
        } else if (response.status === 404) {
          setError('Story not found');
        } else {
          setError('Failed to load story');
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
      const response = await fetch(getApiUrl(`/api/chat-sessions/${storyId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/library?type=stories');
      } else {
        alert('Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="story-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading your story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="story-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">❌</div>
            <h3>Story Not Found</h3>
            <p>{error || 'This story could not be found.'}</p>
            <Link href="/library?type=stories" className="btn btn-primary">
              Back to Story Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-container">
      {/* Header */}
      <div className="story-header">
        <div className="header-content">
          <div className="title-section">
            <Link href="/library?type=stories" className="back-link">
              ← Story Library
            </Link>
            <h1>📖 {story.name}</h1>
            <p className="story-subtitle">View story details and continue your adventure</p>
          </div>
          <div className="header-actions">
            <Link 
              href={`/chat/${story.id}`}
              className="btn btn-primary"
            >
              🎭 Resume Story
            </Link>
            <button 
              className="btn btn-danger"
              onClick={deleteStory}
              disabled={isDeleting}
            >
              {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Story'}
            </button>
          </div>
        </div>
      </div>

      {/* Story Details */}
      <div className="story-content">
        <div className="story-info-grid">
          
          {/* Character Card */}
          <div className="card story-card">
            <div className="card-header">
              <h2>💕 Character</h2>
            </div>
            <div className="character-info">
              <div className="character-image">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${story.characters?.name || 'character'}`}
                  alt={story.characters?.name || 'Character'}
                />
              </div>
              <div className="character-details">
                <h3>{story.characters?.name || 'Unknown Character'}</h3>
                <p className="character-archetype">{story.characters?.archetype}</p>
                <p className="character-role">{story.characters?.chatbotRole}</p>
                
                {story.characters?.description && (
                  <div className="character-description">
                    <h4>Description</h4>
                    <p>{story.characters.description}</p>
                  </div>
                )}
                
                {story.characters?.primaryTraits && story.characters.primaryTraits.length > 0 && (
                  <div className="character-traits">
                    <h4>Primary Traits</h4>
                    <div className="trait-tags">
                      {story.characters.primaryTraits.map((trait: string, index: number) => (
                        <span key={index} className="trait-tag">{trait}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {story.characters?.greeting && (
                  <div className="character-greeting">
                    <h4>Greeting</h4>
                    <p className="greeting-text">"{story.characters.greeting}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Setting Card */}
          <div className="card story-card">
            <div className="card-header">
              <h2>🏰 Setting</h2>
            </div>
            <div className="setting-info">
              <h3>{story.settings?.name || 'General Setting'}</h3>
              {story.settings?.theme && (
                <p className="setting-theme">Theme: {story.settings.theme}</p>
              )}
              
              {story.settings?.description && (
                <div className="setting-description">
                  <h4>Description</h4>
                  <p>{story.settings.description}</p>
                </div>
              )}
              
              {story.settings?.plot && (
                <div className="setting-plot">
                  <h4>Plot</h4>
                  <p>{story.settings.plot}</p>
                </div>
              )}
            </div>
          </div>

          {/* Story Stats */}
          <div className="card story-card">
            <div className="card-header">
              <h2>📊 Story Stats</h2>
            </div>
            <div className="story-stats">
              <div className="stat-item">
                <span className="stat-label">Created:</span>
                <span className="stat-value">{formatDate(story.createdAt)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Activity:</span>
                <span className="stat-value">{formatDate(story.lastActivity)}</span>
              </div>
              {story.messages && (
                <div className="stat-item">
                  <span className="stat-label">Messages:</span>
                  <span className="stat-value">{story.messages.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="story-actions">
          <Link 
            href={`/chat/${story.id}`}
            className="btn btn-primary btn-large"
          >
            🎭 Resume Your Story
          </Link>
          <Link 
            href="/library?type=stories"
            className="btn btn-outline"
          >
            📚 Back to Library
          </Link>
        </div>
      </div>
    </div>
  );
}