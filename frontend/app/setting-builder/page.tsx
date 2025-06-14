'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../utils/api-config';
import { getSettingImage, getLocationImage } from '../utils/helpers';
import { parseJsonField } from '../utils/field-parsing';
import { SettingImageUpload, LocationImageUpload } from '../components/UI/EnhancedImageUpload';
import { uploadImage, uploadBatchImages } from '../utils/image-upload';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import TagInput from '../components/UI/TagInput';
import { processTagInput, formatTagsToCommaSeparated } from '../utils/tag-parsing';
import { BackButton } from '../components/UI/ActionButtons';

// Custom dropdown component that matches TagInput styling
function LocationTypeDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { value: 'room', label: 'Room' },
    { value: 'building', label: 'Building' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'landmark', label: 'Landmark' },
    { value: 'vehicle', label: 'Vehicle' }
  ];
  
  const selectedOption = options.find(opt => opt.value === value) || options[0];
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Location Type
      </label>
      
      {/* Button that looks like input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-romantic w-full text-left flex items-center justify-between"
      >
        <span>{selectedOption.label}</span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {/* Custom dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown options */}
          <div className="absolute w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
            <div className="max-h-40 overflow-y-auto">
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface Location {
  id?: string;
  name: string;
  description: string;
  details?: string;
  locationType?: string;
  ambiance?: string[];
  lighting?: string[];
  imageUrl?: string;
}

interface Setting {
  id?: string;
  name: string;
  description: string;
  plot?: string;
  settingType?: string;
  timeOfDay?: string;
  mood?: string[];
  theme?: string[];
  imageUrl?: string;
  locations: Location[];
}

function SettingBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const [setting, setSetting] = useState<Setting>({
    name: '',
    description: '',
    plot: '',
    settingType: 'general',
    timeOfDay: '',
    mood: [],
    theme: [],
    imageUrl: '',
    locations: [{ name: '', description: '', ambiance: [], lighting: [] }]
  });
  
  const [existingLocations, setExistingLocations] = useState<Location[]>([]);
  const [showLocationBrowser, setShowLocationBrowser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [locationImages, setLocationImages] = useState<{[key: number]: File | null}>({});
  const [locationImagePreviews, setLocationImagePreviews] = useState<{[key: number]: string}>({});
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Load setting data if in edit mode
  useEffect(() => {
    if (editId) {
      fetchSettingForEdit(editId);
    }
    fetchExistingLocations();
  }, [editId]);

  const fetchSettingForEdit = async (settingId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/settings/${settingId}`));
      if (response.ok) {
        const data = await response.json();
        const settingData = data.setting;
        
        // Pre-fill form with existing data
        setSetting({
          id: settingData.id,
          name: settingData.name || '',
          description: settingData.description || '',
          plot: settingData.plot || '',
          settingType: settingData.setting_type || 'general',
          timeOfDay: settingData.time_of_day || '',
          mood: processTagInput(parseJsonField(settingData.mood) || ''),
          theme: processTagInput(parseJsonField(settingData.theme) || ''),
          imageUrl: settingData.image_url || '',
          locations: settingData.locations?.map((loc: any) => ({
            id: loc.id,
            name: loc.name || '',
            description: loc.description || '',
            details: loc.details || '',
            locationType: loc.location_type || 'room',
            ambiance: processTagInput(parseJsonField(loc.ambiance) || ''),
            lighting: processTagInput(parseJsonField(loc.lighting) || ''),
            imageUrl: loc.image_url || ''
          })) || [{ name: '', description: '', ambiance: [], lighting: [] }]
        });
        
        // Set image preview if exists - use helper to construct proper URL
        if (settingData.image_url) {
          setImagePreview(getSettingImage({ imageUrl: settingData.image_url, name: settingData.name, settingType: settingData.setting_type }));
        }
        
        // Set location image previews if they exist
        const newLocationPreviews: {[key: number]: string} = {};
        settingData.locations?.forEach((loc: any, index: number) => {
          if (loc.image_url) {
            newLocationPreviews[index] = getLocationImage({ 
              imageUrl: loc.image_url, 
              name: loc.name, 
              locationType: loc.location_type 
            }, index);
          }
        });
        setLocationImagePreviews(newLocationPreviews);
      } else {
        alert('Failed to load setting for editing');
        router.push('/library?type=settings');
      }
    } catch (error) {
      console.error('Error loading setting:', error);
      alert('Failed to load setting for editing');
      router.push('/library?type=settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingLocations = async () => {
    try {
      const response = await fetch(getApiUrl('/api/locations'));
      if (response.ok) {
        const data = await response.json();
        setExistingLocations(data.data || []); // Fix: API returns data.data, not data.locations
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const addLocation = () => {
    setSetting(prev => ({
      ...prev,
      locations: [...prev.locations, { name: '', description: '', ambiance: [], lighting: [] }]
    }));
    // Navigate to the new location
    setCurrentLocationIndex(setting.locations.length);
  };

  const removeLocation = (index: number) => {
    if (setting.locations.length <= 1) return; // Don't allow removing the last location
    
    setSetting(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
    
    // Adjust current index if needed
    if (currentLocationIndex >= setting.locations.length - 1) {
      setCurrentLocationIndex(Math.max(0, setting.locations.length - 2));
    } else if (currentLocationIndex > index) {
      setCurrentLocationIndex(currentLocationIndex - 1);
    }
  };

  const navigateToLocation = (index: number) => {
    setCurrentLocationIndex(index);
  };

  const canNavigateBack = currentLocationIndex > 0;
  const canNavigateForward = currentLocationIndex < setting.locations.length - 1;
  const showNavigation = setting.locations.length > 1;

  const updateLocation = (index: number, updates: Partial<Location>) => {
    setSetting(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, ...updates } : loc
      )
    }));
  };

  const handleImageChange = (file: File | null) => {
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

  const handleLocationImageChange = (index: number, file: File | null) => {
    if (file) {
      setLocationImages(prev => ({ ...prev, [index]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLocationImagePreviews(prev => ({ 
          ...prev, 
          [index]: e.target?.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLocationImage = (index: number) => {
    setLocationImages(prev => {
      const newImages = { ...prev };
      delete newImages[index];
      return newImages;
    });
    setLocationImagePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[index];
      return newPreviews;
    });
    updateLocation(index, { imageUrl: '' });
  };

  const getDefaultLocationImageUrl = (locationType: string, locationName: string, index: number) => {
    const seed = encodeURIComponent(`${locationName}-${locationType}-${index}`);
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=1e293b,374151,0f172a`;
  };

  const getDefaultImageUrl = () => {
    if (setting.name) {
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(setting.name)}&backgroundColor=1e293b,374151,0f172a`;
    }
    return '';
  };

  const saveSetting = async () => {
    // Validate required fields
    const errors: {[key: string]: boolean} = {};
    
    if (!setting.name.trim()) {
      errors.name = true;
    }
    if (!setting.description.trim()) {
      errors.description = true;
    }
    if (!setting.plot?.trim()) {
      errors.plot = true;
    }
    
    // Check location fields - require at least one location with name and description
    if (!setting.locations || setting.locations.length === 0) {
      errors[`no_locations`] = true;
    } else {
      const firstLocation = setting.locations[0];
      if (!firstLocation?.name?.trim()) {
        errors[`location_name_0`] = true;
      }
      if (!firstLocation?.description?.trim()) {
        errors[`location_description_0`] = true;
      }
    }
    
    // For additional locations, if they have any content, both fields are required
    if (setting.locations && setting.locations.length > 0) {
      setting.locations.forEach((location, index) => {
        if (index > 0 && (location.name.trim() || location.description.trim())) {
          if (!location.name.trim()) {
            errors[`location_name_${index}`] = true;
          }
          if (!location.description.trim()) {
            errors[`location_description_${index}`] = true;
          }
        }
      });
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Create specific error message
      const missingFields = [];
      if (errors.name) missingFields.push('Setting Name');
      if (errors.description) missingFields.push('Setting Description');  
      if (errors.plot) missingFields.push('Scenario Plot');
      if (errors.no_locations) missingFields.push('At least one Location');
      if (errors.location_name_0) missingFields.push('Location Name');
      if (errors.location_description_0) missingFields.push('Location Description');
      
      const message = `Please fill out the following required fields:\n\n• ${missingFields.join('\n• ')}`;
      setValidationMessage(message);
      setShowValidationModal(true);
      
      // Navigate to first error field for better UX
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey.includes('location_') || firstErrorKey === 'no_locations') {
        // If it's a location error, make sure user is viewing the locations section
        if (firstErrorKey !== 'no_locations') {
          const locationIndex = parseInt(firstErrorKey.split('_')[2]) || 0;
          setCurrentLocationIndex(locationIndex);
        }
        // For no_locations error, the UI will show the "Add First Location" button
      }
      
      return;
    }
    
    // Clear validation errors if all fields are valid
    setValidationErrors({});

    setIsSaving(true);
    try {
      // Upload setting image using new utility with proper preservation logic
      const settingImageResult = await uploadImage(selectedImage, {
        type: 'setting',
        preserveExisting: true,
        existingImageUrl: setting.imageUrl
      });
      
      if (!settingImageResult.success && settingImageResult.error) {
        alert(`Failed to upload setting image: ${settingImageResult.error}`);
        setIsSaving(false);
        return;
      }
      
      const finalSettingImageUrl = settingImageResult.imageUrl || setting.imageUrl || '';

      // Prepare setting data for API
      const settingData = {
        name: setting.name,
        description: setting.description,
        plot: setting.plot,
        setting_type: setting.settingType,
        time_of_day: setting.timeOfDay,
        mood: setting.mood, // Send as array for database storage
        theme: setting.theme, // Send as array for database storage
        image_url: finalSettingImageUrl
      };

      let response;
      if (isEditMode && setting.id) {
        // Update existing setting
        response = await fetch(getApiUrl(`/api/settings/${setting.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingData)
        });
      } else {
        // Create new setting
        response = await fetch(getApiUrl('/api/settings'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingData)
        });
      }

      if (response.ok) {
        const data = await response.json();
        const savedSettingId = data.setting.id;
        
        // If editing, first clear existing location relationships
        if (isEditMode && setting.id) {
          await fetch(getApiUrl(`/api/setting-locations/by-setting/${setting.id}`), {
            method: 'DELETE'
          });
        }
        
        // Upload all location images using batch utility
        const existingLocationUrls: { [key: number]: string } = {};
        setting.locations.forEach((location, index) => {
          if (location.imageUrl) {
            existingLocationUrls[index] = location.imageUrl;
          }
        });
        
        const locationImageUrls = await uploadBatchImages(locationImages, {
          type: 'location',
          preserveExisting: true,
          existingUrls: existingLocationUrls,
          nameSeed: (index) => setting.locations[index]?.name || `location-${index}`
        });
        
        // Handle locations separately - update/create as needed and link to setting
        for (let i = 0; i < setting.locations.length; i++) {
          const location = setting.locations[i];
          if (location.name.trim()) {
            const locationImageUrl = locationImageUrls[i] || location.imageUrl || '';
            
            const locationData = {
              name: location.name,
              description: location.description,
              location_type: location.locationType || 'room',
              ambiance: location.ambiance || [], // Send as array for database storage
              lighting: location.lighting || [], // Send as array for database storage
              image_url: locationImageUrl,
              details: location.details && typeof location.details === 'string' ? JSON.parse(location.details) : (location.details || {
                lighting: location.lighting || [],
                mood_enhancers: []
              })
            };

            let locationId;
            if (location.id) {
              // Update existing location
              const updateResponse = await fetch(getApiUrl(`/api/locations/${location.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
              });
              if (updateResponse.ok) {
                const updateData = await updateResponse.json();
                locationId = updateData.location.id;
              } else {
                console.error(`Failed to update location ${location.name}:`, await updateResponse.text());
                alert(`Failed to update location "${location.name}". Please try again.`);
                setIsSaving(false);
                return;
              }
            } else {
              // Create new location
              const createResponse = await fetch(getApiUrl('/api/locations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
              });
              if (createResponse.ok) {
                const createData = await createResponse.json();
                locationId = createData.location.id;
              } else {
                console.error(`Failed to create location ${location.name}:`, await createResponse.text());
                alert(`Failed to create location "${location.name}". Please try again.`);
                setIsSaving(false);
                return;
              }
            }

            // Link location to setting using junction table
            if (locationId) {
              const linkData = {
                setting_id: savedSettingId,
                location_id: locationId,
                order_index: i,
                role_in_setting: i === 0 ? 'main' : 'secondary'
              };

              const linkResponse = await fetch(getApiUrl('/api/setting-locations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(linkData)
              });
              
              if (!linkResponse.ok) {
                console.error(`Failed to link location ${location.name} to setting:`, await linkResponse.text());
                alert(`Failed to link location "${location.name}" to setting. The location was created but may not appear in the setting.`);
              }
            } else {
              console.error(`No location ID returned for location: ${location.name}`);
              alert(`Failed to process location "${location.name}". Please try again.`);
            }
          }
        }

        router.push('/library?type=settings');
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'save'} setting`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} setting:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'save'} setting`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading setting...</p>
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
          <div className="flex items-center space-x-4 mb-6">
            <BackButton />
            <span className="text-slate-500">•</span>
            <Link href="/library?type=settings" className="text-rose-400 hover:text-rose-300 transition-colors">
              ← Back to Settings
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">
            🏰 {isEditMode ? 'Edit Setting' : 'Create New Setting'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isEditMode ? 'Modify your existing setting and locations' : 'Design a scenario with multiple locations for your characters to explore'}
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Large screen: side-by-side layout, smaller screens: vertical */}
          <div className="flex flex-col 2xl:flex-row gap-8">
            {/* Setting Details */}
            <div className="flex-1 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">🎭 Setting Details</h2>
            
            <div className="space-y-6 flex-grow">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Setting Name *
                </label>
                <input
                  id="name"
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-700/50 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg focus:ring-2 focus:shadow-xl ${
                    validationErrors.name 
                      ? 'border-2 border-orange-500 bg-orange-500/10 hover:shadow-orange-500/20 focus:ring-orange-500 focus:border-orange-500 focus:shadow-orange-500/30' 
                      : 'border border-slate-600 hover:shadow-rose-500/20 focus:ring-rose-500 focus:border-rose-500 focus:shadow-rose-500/30'
                  }`}
                  placeholder="e.g., Moonlit Academy, Downtown Coffee Shop"
                  value={setting.name}
                  onChange={(e) => {
                    setSetting(prev => ({ ...prev, name: e.target.value }));
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: false }));
                    }
                  }}
                />
              </div>

              <SettingImageUpload
                label="Setting Image"
                value={selectedImage}
                existingImageUrl={setting.imageUrl}
                onImageChange={handleImageChange}
                entityName={setting.name}
                showFallbackInfo={true}
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  className={`w-full px-4 py-3 bg-slate-700/50 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg focus:ring-2 focus:shadow-xl ${
                    validationErrors.description 
                      ? 'border-2 border-orange-500 bg-orange-500/10 hover:shadow-orange-500/20 focus:ring-orange-500 focus:border-orange-500 focus:shadow-orange-500/30' 
                      : 'border border-slate-600 hover:shadow-rose-500/20 focus:ring-rose-500 focus:border-rose-500 focus:shadow-rose-500/30'
                  }`}
                  rows={3}
                  placeholder="Brief description of the setting's atmosphere and purpose"
                  value={setting.description}
                  onChange={(e) => {
                    setSetting(prev => ({ ...prev, description: e.target.value }));
                    if (validationErrors.description) {
                      setValidationErrors(prev => ({ ...prev, description: false }));
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="plot" className="block text-sm font-medium text-slate-300 mb-2">
                  Scenario Plot *
                </label>
                <textarea
                  id="plot"
                  className={`w-full px-4 py-3 bg-slate-700/50 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg focus:ring-2 focus:shadow-xl ${
                    validationErrors.plot 
                      ? 'border-2 border-orange-500 bg-orange-500/10 hover:shadow-orange-500/20 focus:ring-orange-500 focus:border-orange-500 focus:shadow-orange-500/30' 
                      : 'border border-slate-600 hover:shadow-rose-500/20 focus:ring-rose-500 focus:border-rose-500 focus:shadow-rose-500/30'
                  }`}
                  rows={4}
                  placeholder="Describe the overall plot, story, or scenario that takes place in this setting..."
                  value={setting.plot}
                  onChange={(e) => {
                    setSetting(prev => ({ ...prev, plot: e.target.value }));
                    if (validationErrors.plot) {
                      setValidationErrors(prev => ({ ...prev, plot: false }));
                    }
                  }}
                />
              </div>

              </div>
              
              {/* Setting tag fields at bottom */}
              <div className="mt-auto pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative z-[9999]">
                    <label htmlFor="settingType" className="block text-sm font-medium text-slate-300 mb-2">
                      Setting Type
                    </label>
                    <select
                      id="settingType"
                      className="input-romantic w-full"
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

                  <div className="relative z-[9999]">
                    <TagInput
                      label="Theme"
                      value={setting.theme || []}
                      onChange={(tags) => setSetting(prev => ({ ...prev, theme: tags }))}
                      placeholder="e.g., romantic, adventure, mystery"
                      maxTags={5}
                      suggestions={['romantic', 'adventure', 'mystery', 'horror', 'comedy', 'drama', 'fantasy', 'sci-fi', 'historical', 'modern']}
                    />
                  </div>

                  <div className="relative z-[9999]">
                    <TagInput
                      label="Mood"
                      value={setting.mood || []}
                      onChange={(tags) => setSetting(prev => ({ ...prev, mood: tags }))}
                      placeholder="e.g., cozy, mysterious, energetic"
                      maxTags={5}
                      suggestions={['cozy', 'mysterious', 'energetic', 'peaceful', 'tense', 'exciting', 'melancholic', 'uplifting', 'dark', 'bright']}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="flex-1 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">📍 Locations</h2>
            
            <div className="space-y-6 flex-grow">
              {/* Check if we have any locations */}
              {setting.locations && setting.locations.length > 0 && setting.locations[currentLocationIndex] ? (
                <>
                  {/* Current Location Form */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Location Name *</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 bg-slate-700/50 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg focus:ring-2 focus:shadow-xl ${
                        validationErrors[`location_name_${currentLocationIndex}`] 
                          ? 'border-2 border-orange-500 bg-orange-500/10 hover:shadow-orange-500/20 focus:ring-orange-500 focus:border-orange-500 focus:shadow-orange-500/30' 
                          : 'border border-slate-600 hover:shadow-rose-500/20 focus:ring-rose-500 focus:border-rose-500 focus:shadow-rose-500/30'
                      }`}
                      placeholder="e.g., Library Main Hall, Dormitory Room 204"
                      value={setting.locations[currentLocationIndex]?.name || ''}
                      onChange={(e) => {
                        updateLocation(currentLocationIndex, { name: e.target.value });
                        const errorKey = `location_name_${currentLocationIndex}`;
                        if (validationErrors[errorKey]) {
                          setValidationErrors(prev => ({ ...prev, [errorKey]: false }));
                        }
                      }}
                    />
                  </div>

                  <LocationImageUpload
                    label="Location Image"
                    value={locationImages[currentLocationIndex]}
                    existingImageUrl={setting.locations[currentLocationIndex]?.imageUrl}
                    onImageChange={(file) => handleLocationImageChange(currentLocationIndex, file)}
                    entityName={setting.locations[currentLocationIndex]?.name}
                    showFallbackInfo={true}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                    <textarea
                      className={`w-full px-4 py-3 bg-slate-700/50 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg focus:ring-2 focus:shadow-xl ${
                        validationErrors[`location_description_${currentLocationIndex}`] 
                          ? 'border-2 border-orange-500 bg-orange-500/10 hover:shadow-orange-500/20 focus:ring-orange-500 focus:border-orange-500 focus:shadow-orange-500/30' 
                          : 'border border-slate-600 hover:shadow-rose-500/20 focus:ring-rose-500 focus:border-rose-500 focus:shadow-rose-500/30'
                      }`}
                      rows={3}
                      placeholder="Describe this location in detail - what it looks like, feels like, sounds like..."
                      value={setting.locations[currentLocationIndex]?.description || ''}
                      onChange={(e) => {
                        updateLocation(currentLocationIndex, { description: e.target.value });
                        const errorKey = `location_description_${currentLocationIndex}`;
                        if (validationErrors[errorKey]) {
                          setValidationErrors(prev => ({ ...prev, [errorKey]: false }));
                        }
                      }}
                    />
                  </div>

                  {/* Location Navigation - now above tag fields */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Location</label>
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {showNavigation && (
                          <>
                            <button
                              onClick={() => navigateToLocation(currentLocationIndex - 1)}
                              disabled={!canNavigateBack}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                canNavigateBack 
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-105' 
                                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              ←
                            </button>
                          </>
                        )}
                        
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-slate-200">
                            Location {currentLocationIndex + 1} of {setting.locations.length}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {setting.locations[currentLocationIndex]?.name || 'Unnamed Location'}
                          </p>
                        </div>

                        {showNavigation && (
                          <>
                            <button
                              onClick={() => navigateToLocation(currentLocationIndex + 1)}
                              disabled={!canNavigateForward}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                canNavigateForward 
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-105' 
                                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              →
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          className="px-3 py-1 bg-slate-600 border border-slate-500 text-slate-300 rounded-lg hover:bg-slate-500 transition-colors text-sm"
                          onClick={addLocation}
                        >
                          + Add Location
                        </button>
                        <button 
                          className="px-3 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
                          onClick={() => setShowLocationBrowser(true)}
                        >
                          Browse
                        </button>
                        {setting.locations.length > 1 && (
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            onClick={() => removeLocation(currentLocationIndex)}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Indicator Dots */}
                  {showNavigation && (
                    <div className="flex justify-center space-x-2">
                      {setting.locations.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => navigateToLocation(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            index === currentLocationIndex
                              ? 'bg-rose-500 scale-125'
                              : 'bg-slate-600 hover:bg-slate-500'
                          }`}
                          aria-label={`Go to location ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                </>
              ) : (
                /* No Locations State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📍</div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No Locations Added</h3>
                    <p className="text-slate-400 mb-6">
                      Settings need at least one location. Add your first location to get started.
                    </p>
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-pink-700 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30"
                      onClick={addLocation}
                    >
                      + Add First Location
                    </button>
                  </div>
                </div>
              )}
              </div>
              
              {/* Location tag fields at bottom */}
              {setting.locations[currentLocationIndex] && (
                <div className="mt-auto pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative z-[9999]">
                      <LocationTypeDropdown
                        value={setting.locations[currentLocationIndex]?.locationType || 'room'}
                        onChange={(value) => updateLocation(currentLocationIndex, { locationType: value })}
                      />
                    </div>

                    <div className="relative z-[9999]">
                      <TagInput
                        label="Ambiance"
                        value={setting.locations[currentLocationIndex]?.ambiance || []}
                        onChange={(tags) => updateLocation(currentLocationIndex, { ambiance: tags })}
                        placeholder="e.g., peaceful, bustling, eerie"
                        maxTags={3}
                        suggestions={['peaceful', 'bustling', 'eerie', 'quiet', 'lively', 'haunting', 'serene', 'chaotic', 'intimate', 'grand']}
                      />
                    </div>

                    <div className="relative z-[9999]">
                      <TagInput
                        label="Lighting"
                        value={setting.locations[currentLocationIndex]?.lighting || []}
                        onChange={(tags) => updateLocation(currentLocationIndex, { lighting: tags })}
                        placeholder="e.g., dim candlelight, bright fluorescent"
                        maxTags={3}
                        suggestions={['dim', 'bright', 'candlelight', 'fluorescent', 'natural', 'warm', 'cool', 'dramatic', 'soft', 'harsh']}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            <button 
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              onClick={() => router.push('/library?type=settings')}
            >
              Cancel
            </button>
            <button 
              className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-pink-700 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={saveSetting}
              disabled={isSaving}
            >
              {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Setting' : 'Save Setting')}
            </button>
          </div>
        </div>
      </div>

      {/* Location Browser Modal */}
      {showLocationBrowser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">Choose Existing Location</h2>
              <button 
                className="text-slate-400 hover:text-slate-200 text-2xl"
                onClick={() => setShowLocationBrowser(false)}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {existingLocations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingLocations.map((location) => (
                    <div 
                      key={location.id} 
                      className="border border-slate-600 rounded-lg p-4 hover:border-rose-500 cursor-pointer transition-colors"
                      onClick={() => {
                        // Populate current location form with selected location data
                        updateLocation(currentLocationIndex, {
                          id: location.id,
                          name: location.name,
                          description: location.description,
                          details: location.details,
                          locationType: location.locationType || 'room',
                          ambiance: location.ambiance || [],
                          lighting: location.lighting || [],
                          imageUrl: location.imageUrl || ''
                        });
                        
                        // Set image preview if location has an image
                        if (location.imageUrl) {
                          setLocationImagePreviews(prev => ({
                            ...prev,
                            [currentLocationIndex]: location.imageUrl
                          }));
                        }
                        
                        setShowLocationBrowser(false);
                      }}
                    >
                      <h3 className="text-slate-200 font-medium">{location.name}</h3>
                      <p className="text-slate-400 text-sm">{location.locationType}</p>
                      <p className="text-slate-300 text-sm mt-2">{location.description}</p>
                      {location.ambiance && (
                        <p className="text-slate-400 text-xs mt-1">Ambiance: {location.ambiance}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">No existing locations found. Create your first location above!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Required Fields Missing"
        message={validationMessage || "Please fill out all required fields marked with an asterisk (*) before saving."}
        icon="📝"
        type="warning"
        cancelLabel="OK"
        showConfirmButton={false}
      />
    </div>
  );
}

export default function SettingBuilder() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading setting builder...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SettingBuilderContent />
    </Suspense>
  );
}