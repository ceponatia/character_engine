'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Setting {
  id: string;
  name: string;
  description: string;
  plot?: string;
  settingType?: string;
  theme?: string;
  mood?: string;
  timeOfDay?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsLibrary() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSetting = async (settingId: string) => {
    if (!confirm('Are you sure you want to delete this setting? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/settings/${settingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSettings(prev => prev.filter(setting => setting.id !== settingId));
      } else {
        alert('Failed to delete setting');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      alert('Failed to delete setting');
    }
  };

  const startNewStory = (settingId: string) => {
    window.location.href = `/story-config?setting=${settingId}`;
  };

  const filteredSettings = settings.filter(setting => {
    const matchesSearch = setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (setting.theme && setting.theme.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || setting.settingType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="settings-library-container">
        <div className="card">
          <div className="empty-state">
            <div className="icon">⏳</div>
            <p>Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-library-container">
      {/* Header */}
      <div className="library-header">
        <div className="header-content">
          <div className="title-section">
            <Link href="/" className="back-link">
              ← Home
            </Link>
            <h1>🏰 Settings Library</h1>
            <p>Browse and manage your story settings</p>
          </div>
          <div className="header-actions">
            <Link href="/setting-builder" className="btn btn-primary">
              ✨ Create New Setting
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="library-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search settings by name, description, or theme..."
            className="form-input search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-section">
          <label htmlFor="typeFilter">Filter by Type:</label>
          <select
            id="typeFilter"
            className="form-select filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="fantasy">Fantasy</option>
            <option value="modern">Modern</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="historical">Historical</option>
          </select>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="library-content">
        {filteredSettings.length > 0 ? (
          <div className="settings-grid">
            {filteredSettings.map((setting) => (
              <div key={setting.id} className="setting-card">
                <div className="setting-image">
                  {setting.imageUrl ? (
                    <img src={setting.imageUrl} alt={setting.name} />
                  ) : (
                    <div className="placeholder-image">🏰</div>
                  )}
                </div>
                
                <div className="setting-content">
                  <div className="setting-header">
                    <h3>{setting.name}</h3>
                    {setting.settingType && (
                      <span className="setting-type-tag">{setting.settingType}</span>
                    )}
                  </div>
                  
                  <p className="setting-description">{setting.description}</p>
                  
                  {setting.theme && (
                    <p className="setting-meta">
                      <strong>Theme:</strong> {setting.theme}
                    </p>
                  )}
                  
                  {setting.mood && (
                    <p className="setting-meta">
                      <strong>Mood:</strong> {setting.mood}
                    </p>
                  )}
                  
                  <div className="setting-actions">
                    <button 
                      className="btn btn-primary btn-small"
                      onClick={() => startNewStory(setting.id)}
                    >
                      🎭 Start Story
                    </button>
                    <Link 
                      href={`/setting-builder?edit=${setting.id}`}
                      className="btn btn-outline btn-small"
                    >
                      ✏️ Edit
                    </Link>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => deleteSetting(setting.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">
              {searchTerm || filterType !== 'all' ? '🔍' : '🏰'}
            </div>
            <h3>
              {searchTerm || filterType !== 'all' 
                ? 'No settings found' 
                : 'No settings created yet'
              }
            </h3>
            <p>
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Create your first setting to start building your story world'
              }
            </p>
            {(!searchTerm && filterType === 'all') && (
              <Link href="/setting-builder" className="btn btn-primary">
                ✨ Create Your First Setting
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {settings.length > 0 && (
        <div className="library-stats">
          <p>
            Showing {filteredSettings.length} of {settings.length} settings
            {searchTerm && ` matching "${searchTerm}"`}
            {filterType !== 'all' && ` in ${filterType} category`}
          </p>
        </div>
      )}
    </div>
  );
}