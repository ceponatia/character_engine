'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  description: string;
  details?: string;
  locationType: string;
  ambiance?: string;
  lighting?: string;
  accessibility?: string;
  createdAt: string;
  updatedAt: string;
  settingLocations?: Array<{
    setting: {
      id: string;
      name: string;
      settingType: string;
    }
  }>;
}

export default function LocationBrowser() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      } else {
        console.error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (locationId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/locations/${locationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
        setShowDeleteConfirm(null);
        setSelectedLocation(null);
      } else {
        alert('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || location.locationType === filterType;
    return matchesSearch && matchesType;
  });

  const locationTypes = ['all', 'room', 'building', 'outdoor', 'landmark', 'vehicle'];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Location Library</h1>
          <p>Browse and manage your reusable locations</p>
        </div>
        
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/setting-builder')}
          >
            + Create Setting
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="filter-controls">
        <div className="search-group">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search locations by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="typeFilter">Filter by type:</label>
          <select
            id="typeFilter"
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {locationTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <span>{filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Locations Grid */}
      {filteredLocations.length > 0 ? (
        <div className="locations-browser-grid">
          {filteredLocations.map(location => (
            <div 
              key={location.id} 
              className="location-browser-card"
              onClick={() => setSelectedLocation(location)}
            >
              <div className="location-card-header">
                <h3>{location.name}</h3>
                <span className="location-type-badge">{location.locationType}</span>
              </div>
              
              <p className="location-card-description">
                {location.description}
              </p>
              
              <div className="location-card-meta">
                {location.ambiance && (
                  <div className="meta-item">
                    <span className="meta-label">Ambiance:</span>
                    <span className="meta-value">{location.ambiance}</span>
                  </div>
                )}
                {location.lighting && (
                  <div className="meta-item">
                    <span className="meta-label">Lighting:</span>
                    <span className="meta-value">{location.lighting}</span>
                  </div>
                )}
              </div>
              
              {location.settingLocations && location.settingLocations.length > 0 && (
                <div className="location-usage">
                  <span className="usage-label">Used in:</span>
                  <div className="usage-tags">
                    {location.settingLocations.slice(0, 2).map(sl => (
                      <span key={sl.setting.id} className="usage-tag">
                        {sl.setting.name}
                      </span>
                    ))}
                    {location.settingLocations.length > 2 && (
                      <span className="usage-tag">+{location.settingLocations.length - 2} more</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="location-card-actions">
                <button 
                  className="btn btn-outline btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Navigate to edit page
                    alert('Edit functionality coming soon!');
                  }}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(location.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🏗️</div>
          <h2>No locations found</h2>
          <p>
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first location by building a new setting'
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/setting-builder')}
          >
            Create Your First Setting
          </button>
        </div>
      )}

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="modal-content location-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedLocation.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedLocation(null)}
              >
                ×
              </button>
            </div>
            
            <div className="location-detail-content">
              <div className="detail-section">
                <div className="detail-meta-row">
                  <div className="detail-meta-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{selectedLocation.locationType}</span>
                  </div>
                  {selectedLocation.ambiance && (
                    <div className="detail-meta-item">
                      <span className="detail-label">Ambiance:</span>
                      <span className="detail-value">{selectedLocation.ambiance}</span>
                    </div>
                  )}
                  {selectedLocation.lighting && (
                    <div className="detail-meta-item">
                      <span className="detail-label">Lighting:</span>
                      <span className="detail-value">{selectedLocation.lighting}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p className="detail-description">{selectedLocation.description}</p>
              </div>

              {selectedLocation.details && (
                <div className="detail-section">
                  <h3>Additional Details</h3>
                  <p className="detail-description">{selectedLocation.details}</p>
                </div>
              )}

              {selectedLocation.settingLocations && selectedLocation.settingLocations.length > 0 && (
                <div className="detail-section">
                  <h3>Used in Settings</h3>
                  <div className="settings-list">
                    {selectedLocation.settingLocations.map(sl => (
                      <div key={sl.setting.id} className="setting-item">
                        <span className="setting-name">{sl.setting.name}</span>
                        <span className="setting-type">{sl.setting.settingType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    // TODO: Navigate to edit page
                    alert('Edit functionality coming soon!');
                  }}
                >
                  Edit Location
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(selectedLocation.id)}
                >
                  Delete Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>
            
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this location?</p>
              <p className="delete-warning">
                This will remove it from all settings that use it. This action cannot be undone.
              </p>
              
              <div className="delete-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteLocation(showDeleteConfirm)}
                >
                  Delete Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}