'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../utils/api-config';
import { getLocationImage, formatDate } from '../../utils/helpers';

interface Location {
  id?: string;
  name: string;
  description: string;
  details?: string;
  locationType?: string;
  ambiance?: string;
  lighting?: string;
  imageUrl?: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  plot?: string;
  settingType?: string;
  timeOfDay?: string;
  mood?: string;
  theme?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  locations: Location[];
}

export default function SettingDetails() {
  const router = useRouter();
  const params = useParams();
  const settingId = params.id as string;
  
  const [setting, setSetting] = useState<Setting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (settingId) {
      fetchSetting();
    }
  }, [settingId]);

  const fetchSetting = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/settings/${settingId}`));
      if (response.ok) {
        const data = await response.json();
        const settingData = data.setting;
        
        setSetting({
          ...settingData,
          settingType: settingData.settingType || 'general',
          locations: settingData.locations || []
        });
      } else {
        console.error('Failed to fetch setting');
        router.push('/library?type=settings');
      }
    } catch (error) {
      console.error('Error fetching setting:', error);
      router.push('/library?type=settings');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSetting = async () => {
    if (!confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/settings/${settingId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/library?type=settings');
      } else {
        alert('Failed to delete setting');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      alert('Failed to delete setting');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDefaultImageUrl = () => {
    if (setting?.name) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(setting.name)}&backgroundColor=1e293b,374151,0f172a`;
    }
    return '';
  };


  const startNewStory = () => {
    window.location.href = `/story-config?setting=${settingId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex gap-4 mb-6">
              <Link href="/" className="btn-romantic-outline">
                ← Home
              </Link>
              <Link href="/library?type=settings" className="btn-romantic-outline">
                ← Back to Settings
              </Link>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-3xl font-bold text-slate-100 mb-4">Loading Setting...</h1>
              <p className="text-slate-300 text-lg">Please wait while we load the setting details</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex gap-4 mb-6">
              <Link href="/" className="btn-romantic-outline">
                ← Home
              </Link>
              <Link href="/library?type=settings" className="btn-romantic-outline">
                ← Back to Settings
              </Link>
            </div>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏰</div>
              <h1 className="text-3xl font-bold text-slate-100 mb-4">Setting Not Found</h1>
              <p className="text-slate-400 mb-8">The setting you're looking for could not be found</p>
              <Link href="/library?type=settings" className="btn-romantic-primary">
                ← Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-romantic-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <Link href="/" className="btn-romantic-outline">
              ← Home
            </Link>
            <Link href="/library?type=settings" className="btn-romantic-outline">
              ← Back to Settings
            </Link>
          </div>
          
          {/* Setting Header */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-2 border-rose-500/30">
                {setting.imageUrl ? (
                  <img 
                    src={setting.imageUrl} 
                    alt="Setting preview" 
                    className="w-full h-full object-cover"
                  />
                ) : setting.name ? (
                  <img 
                    src={getDefaultImageUrl()} 
                    alt="Default setting image" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900/80 flex items-center justify-center">
                    <span className="text-6xl">🏰</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {setting.name}
              </h1>
              <p className="text-xl text-slate-300 mb-4">
                {setting.settingType} Setting
              </p>
              {setting.description && (
                <p className="text-slate-400 mb-6 leading-relaxed">{setting.description}</p>
              )}
              <div className="flex flex-wrap gap-4">
                <button onClick={startNewStory} className="btn-romantic-primary">
                  🎭 Start Story
                </button>
                <Link href={`/setting-builder?edit=${setting.id}`} className="btn-romantic-secondary">
                  ✏️ Edit Setting
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Setting Details Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Setting Details Section */}
          <div className="card-romantic p-6">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              🏰 Setting Details
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Setting Name</label>
                <span className="text-slate-200">{setting.name}</span>
              </div>
              {setting.description && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Description</label>
                  <span className="text-slate-200">{setting.description}</span>
                </div>
              )}
              {setting.plot && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Scenario Plot</label>
                  <span className="text-slate-200">{setting.plot}</span>
                </div>
              )}
            </div>
          </div>

          {/* Setting Properties Section */}
          <div className="card-romantic p-6">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              ⚙️ Properties
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Setting Type</label>
                <span className="text-slate-200 capitalize">{setting.settingType}</span>
              </div>
              {setting.theme && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Theme</label>
                  <span className="text-slate-200">{setting.theme}</span>
                </div>
              )}
              {setting.mood && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Mood</label>
                  <span className="text-slate-200">{setting.mood}</span>
                </div>
              )}
              {setting.timeOfDay && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-400">Time of Day</label>
                  <span className="text-slate-200">{setting.timeOfDay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="card-romantic p-6">
            <h2 className="text-xl font-bold text-rose-400 mb-4 flex items-center gap-2">
              📅 Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Created</label>
                <span className="text-slate-200">{formatDate(setting.createdAt)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-400">Last Updated</label>
                <span className="text-slate-200">{formatDate(setting.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Locations Section */}
        {setting.locations && setting.locations.length > 0 && (
          <div className="card-romantic p-6 col-span-full">
            <h2 className="text-xl font-bold text-rose-400 mb-6 flex items-center gap-2">
              📍 Locations ({setting.locations.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {setting.locations.map((location, index) => (
                <div key={location.id || index} className="group cursor-pointer">
                  <div className="card-romantic p-0 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 relative h-48">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${getLocationImage(location, index)}')`
                      }}
                    />
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Text overlay in bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white text-lg font-bold drop-shadow-lg">{location.name}</h3>
                        {location.locationType && (
                          <span className="bg-rose-500/80 text-white px-2 py-1 rounded text-xs font-medium drop-shadow-md">
                            {location.locationType}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 text-sm drop-shadow-md mb-2">{location.description}</p>
                      {(location.ambiance || location.lighting) && (
                        <div className="flex gap-2 text-xs">
                          {location.ambiance && (
                            <span className="text-slate-300 drop-shadow-md">🌟 {location.ambiance}</span>
                          )}
                          {location.lighting && (
                            <span className="text-slate-300 drop-shadow-md">💡 {location.lighting}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Locations State */}
        {(!setting.locations || setting.locations.length === 0) && (
          <div className="card-romantic p-6 col-span-full">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No Locations Defined</h3>
              <p className="text-slate-400 mb-6">This setting doesn't have any specific locations configured.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-slate-700/50">
          <button 
            onClick={startNewStory}
            className="btn-romantic-primary"
          >
            🎭 Start New Story
          </button>
          <Link 
            href={`/setting-builder?edit=${setting.id}`}
            className="btn-romantic-secondary"
          >
            ✏️ Edit Setting
          </Link>
          <button 
            onClick={deleteSetting}
            disabled={isDeleting}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete Setting'}
          </button>
        </div>
      </div>
    </div>
  );
}