'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getApiUrl } from './utils/api-config';
import { truncateText } from './utils/helpers';
import LibraryCard from './components/UI/LibraryCard';


interface Story {
  id: string;
  name: string;
  lastActivity: string;
  characterId: string;
  settingId: string;
  createdAt?: string;
  character: {
    name: string;
    archetype: string;
  };
  setting: {
    name: string;
    theme: string;
    settingType: string;
  };
}

export default function Home() {
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storiesSearchTerm, setStoriesSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch active stories
        const storiesRes = await fetch(getApiUrl('/api/stories?limit=8'));
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          setActiveStories(storiesData.stories || []);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        // Show button when footer is visible (starts entering viewport)
        setShowScrollTop(footerTop <= windowHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-slate-300 text-lg">Loading your chatbot world...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Begin Adventure Banner - positioned below header with margin */}
      <div className="max-w-6xl mx-auto mt-8 mb-16 px-8">
        <Link href="/story-config" className="group block relative h-64 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-rose-500 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-500/30">
          {/* RPG Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
            }}
          />
          
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
          
          {/* Text overlay in lower right */}
          <div className="absolute bottom-8 right-8 text-right">
            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              ⚔️ Begin an Adventure!
            </h2>
            <p className="text-slate-200 text-lg drop-shadow-md">
              Configure characters and settings for your next epic journey
            </p>
          </div>
        </Link>
      </div>

      {/* Dashboard Sections */}
      <div className="max-w-6xl mx-auto space-y-12 px-8">
        {/* Active Sessions */}
        {activeStories.length > 0 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-slate-100 text-2xl font-bold mb-6">🌟 Continue Your Stories</h2>
            </div>
            
            {/* Search and View All Button */}
            <div className="mb-6 flex gap-4 items-center justify-between">
              <input
                type="text"
                placeholder="Search stories by name or character..."
                value={storiesSearchTerm}
                onChange={(e) => setStoriesSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-3 bg-slate-800/50 border border-slate-600 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg hover:shadow-rose-500/20 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:shadow-xl focus:shadow-rose-500/30"
              />
              <Link 
                href="/library?type=stories" 
                className="px-4 py-2 rounded-lg font-medium text-sm border border-slate-600 text-slate-300 hover:border-rose-500 hover:text-rose-400 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 whitespace-nowrap"
              >
                View All Stories
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-6 p-4">
              {activeStories.filter(story =>
                story.name.toLowerCase().includes(storiesSearchTerm.toLowerCase()) ||
                story.character?.name.toLowerCase().includes(storiesSearchTerm.toLowerCase()) ||
                story.setting?.name.toLowerCase().includes(storiesSearchTerm.toLowerCase())
              ).map((story) => {
                // Generate story image based on setting type and theme
                const storyImage = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(story.name)}&backgroundColor=1e293b,be123c,9333ea`;
                
                return (
                  <LibraryCard
                    key={story.id}
                    image={storyImage}
                    title={story.name}
                    subtitle={`Character: ${story.character?.name || 'Unknown'}`}
                    tags={[story.setting?.settingType || 'Story', story.setting?.theme || 'Adventure']}
                    createdAt={story.createdAt || story.lastActivity}
                    href={`/stories/${story.id}/chat`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white hover:from-rose-700 hover:to-pink-700 hover:scale-110"
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}