'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  id?: string;
  name: string;
  description: string;
  details?: string;
  locationType?: string;
  ambiance?: string;
  lighting?: string;
}

interface Setting {
  id?: string;
  name: string;
  description: string;
  plot?: string;
  settingType?: string;
  timeOfDay?: string;
  mood?: string;
  theme?: string;
  imageUrl?: string;
  locations: Location[];
}

export default function SettingBuilder() {
  const router = useRouter();
  const [setting, setSetting] = useState<Setting>({
    name: '',
    description: '',
    plot: '',
    settingType: 'general',
    timeOfDay: '',
    mood: '',
    theme: '',
    imageUrl: '',
    locations: [{ name: '', description: '' }]
  });
  
  const [existingLocations, setExistingLocations] = useState<Location[]>([]);
  const [showLocationBrowser, setShowLocationBrowser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Load existing locations for browser
  useEffect(() => {
    fetchExistingLocations();
  }, []);

  const fetchExistingLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locations');
      if (response.ok) {
        const data = await response.json();
        setExistingLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const addLocation = () => {
    setSetting(prev => ({
      ...prev,
      locations: [...prev.locations, { name: '', description: '' }]
    }));
  };

  const removeLocation = (index: number) => {
    setSetting(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const updateLocation = (index: number, updates: Partial<Location>) => {
    setSetting(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, ...updates } : loc
      )
    }));
  };

  const selectExistingLocation = (location: Location, index: number) => {
    updateLocation(index, location);
    setShowLocationBrowser(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setSetting(prev => ({ ...prev, imageUrl: '' }));
  };

  const getDefaultImageUrl = () => {
    if (setting.name) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(setting.name)}&backgroundColor=1e293b,374151,0f172a`;
    }
    return '';
  };

  const saveSetting = async () => {
    if (!setting.name.trim()) {
      alert('Please enter a setting name');
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = setting.imageUrl || '';
      
      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('type', 'setting');
        
        const imageResponse = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        } else {
          console.error('Failed to upload image');
          // Continue without image
        }
      }

      // First, create any new locations
      const locationIds: string[] = [];
      
      for (const location of setting.locations) {
        if (location.id) {
          // Existing location
          locationIds.push(location.id);
        } else if (location.name.trim()) {
          // New location - create it first
          const response = await fetch('http://localhost:3001/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
          });
          
          if (response.ok) {
            const data = await response.json();
            locationIds.push(data.location.id);
          }
        }
      }

      // Then create the setting with location associations
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setting,
          imageUrl,
          locationIds
        })
      });

      if (response.ok) {
        router.push('/settings');
      } else {
        alert('Failed to save setting');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Failed to save setting');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="setting-builder-container">
      <div className="setting-builder-header">
        <h1>Create New Setting</h1>
        <p>Design a scenario with multiple locations for your characters to explore</p>
      </div>

      <div className="setting-builder-content">
        {/* Setting Details */}
        <div className="setting-form-section">
          <h2>Setting Details</h2>
          
          <div className="form-group">
            <label htmlFor="name">Setting Name *</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g., Moonlit Academy, Downtown Coffee Shop"
              value={setting.name}
              onChange={(e) => setSetting(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              rows={3}
              placeholder="Brief description of the setting's atmosphere and purpose"
              value={setting.description}
              onChange={(e) => setSetting(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Image Upload Section */}
          <div className="form-group">
            <label>Setting Image</label>
            <div className="image-upload-section">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Setting preview" className="uploaded-image" />
                ) : setting.name ? (
                  <img src={getDefaultImageUrl()} alt="Default setting image" className="default-image" />
                ) : (
                  <div className="image-placeholder">
                    <span>🏰</span>
                    <p>No image selected</p>
                  </div>
                )}
              </div>
              
              <div className="image-upload-controls">
                <input
                  type="file"
                  id="settingImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <label htmlFor="settingImage" className="btn btn-outline">
                  📷 Choose Image
                </label>
                {(imagePreview || setting.imageUrl) && (
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <p className="image-help-text">
                Upload a custom image or use the auto-generated placeholder based on your setting name
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="plot">Scenario Plot</label>
            <textarea
              id="plot"
              className="form-textarea"
              rows={4}
              placeholder="Describe the overall plot, story, or scenario that takes place in this setting..."
              value={setting.plot}
              onChange={(e) => setSetting(prev => ({ ...prev, plot: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="settingType">Setting Type</label>
              <select
                id="settingType"
                className="form-select"
                value={setting.settingType}
                onChange={(e) => setSetting(prev => ({ ...prev, settingType: e.target.value }))}
              >
                <option value="general">General</option>
                <option value="fantasy">Fantasy</option>
                <option value="modern">Modern</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="historical">Historical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <input
                id="theme"
                type="text"
                className="form-input"
                placeholder="e.g., romantic, adventure, mystery"
                value={setting.theme}
                onChange={(e) => setSetting(prev => ({ ...prev, theme: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood">Mood</label>
              <input
                id="mood"
                type="text"
                className="form-input"
                placeholder="e.g., cozy, mysterious, energetic"
                value={setting.mood}
                onChange={(e) => setSetting(prev => ({ ...prev, mood: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="setting-form-section">
          <div className="locations-header">
            <h2>Locations</h2>
            <button 
              className="btn btn-outline"
              onClick={() => setShowLocationBrowser(true)}
            >
              Browse Existing Locations
            </button>
          </div>

          {setting.locations.map((location, index) => (
            <div key={index} className="location-input-group">
              <div className="location-header">
                <h3>Location {index + 1}</h3>
                {setting.locations.length > 1 && (
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => removeLocation(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Location Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Library Main Hall, Dormitory Room 204"
                  value={location.name}
                  onChange={(e) => updateLocation(index, { name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-textarea location-description"
                  rows={4}
                  placeholder="Describe this location in detail - what it looks like, feels like, sounds like..."
                  value={location.description}
                  onChange={(e) => updateLocation(index, { description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location Type</label>
                  <select
                    className="form-select"
                    value={location.locationType || 'room'}
                    onChange={(e) => updateLocation(index, { locationType: e.target.value })}
                  >
                    <option value="room">Room</option>
                    <option value="building">Building</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="landmark">Landmark</option>
                    <option value="vehicle">Vehicle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ambiance</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., peaceful, bustling, eerie"
                    value={location.ambiance || ''}
                    onChange={(e) => updateLocation(index, { ambiance: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Lighting</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., dim candlelight, bright fluorescent"
                    value={location.lighting || ''}
                    onChange={(e) => updateLocation(index, { lighting: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-outline add-location-btn" onClick={addLocation}>
            + Add Another Location
          </button>
        </div>

        {/* Actions */}
        <div className="setting-actions">
          <button 
            className="btn btn-outline"
            onClick={() => router.push('/settings')}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={saveSetting}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Setting'}
          </button>
        </div>
      </div>

      {/* Location Browser Modal */}
      {showLocationBrowser && (
        <div className="modal-overlay">
          <div className="modal-content location-browser-modal">
            <div className="modal-header">
              <h2>Choose Existing Location</h2>
              <button 
                className="modal-close"
                onClick={() => setShowLocationBrowser(false)}
              >
                ×
              </button>
            </div>

            <div className="location-browser-content">
              {existingLocations.length > 0 ? (
                <div className="locations-grid">
                  {existingLocations.map((location) => (
                    <div 
                      key={location.id} 
                      className="location-card"
                      onClick={() => {
                        // For now, just close the modal - we'd need to track which location input to update
                        setShowLocationBrowser(false);
                      }}
                    >
                      <h3>{location.name}</h3>
                      <p className="location-type">{location.locationType}</p>
                      <p className="location-description">{location.description}</p>
                      {location.ambiance && (
                        <p className="location-meta">Ambiance: {location.ambiance}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No existing locations found. Create your first location above!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}