'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getApiUrl } from '../utils/api-config';
import { truncateCardTitle, truncateCardDescription } from '../utils/helpers';
import LibraryCard from '../components/UI/LibraryCard';
import { SelectionOverlay } from '../components/UI/StableCard';

export interface LibraryItem {
  id: string;
  name: string;
  [key: string]: any; // Allow additional fields
}

export interface LibraryConfig {
  // Basic Configuration
  title: string;
  subtitle: string;
  icon: string;
  
  // API Configuration
  apiEndpoint: string;
  
  // Display Configuration
  displayFields: {
    primary: string; // Main title field
    secondary?: string; // Subtitle field
    description?: string; // Description field
    image?: string; // Image field
    metadata?: string[]; // Additional metadata fields to show
  };
  
  // Image Configuration
  imageConfig?: {
    fallbackType: 'avatar' | 'gradient' | 'none';
    avatarSeed?: (item: LibraryItem) => string; // For generated avatars
    gradientClass?: string; // For gradient backgrounds
  };
  
  // Actions Configuration
  actions: {
    create?: {
      label: string;
      href: string;
    };
    view?: {
      href: (id: string) => string;
    };
    edit?: {
      href: (id: string) => string;
    };
    custom?: Array<{
      label: string;
      href: (id: string) => string;
      className?: string;
    }>;
  };
  
  // Features Configuration
  features?: {
    search?: boolean;
    filter?: {
      field: string;
      options: Array<{ value: string; label: string }>;
    };
    bulkSelect?: boolean;
    relationships?: {
      field: string; // Field that contains relationship data
      display: (relationships: any) => string;
    };
  };
  
  // Styling
  emptyState?: {
    icon: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

interface LibraryTemplateProps {
  config: LibraryConfig;
}

export default function LibraryTemplate({ config }: LibraryTemplateProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Fetch data
  useEffect(() => {
    fetchItems();
  }, [config.apiEndpoint]);

  // Scroll to top functionality
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

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(getApiUrl(config.apiEndpoint));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.title.toLowerCase()}`);
      }
      
      const data = await response.json();
      // Handle different response formats
      const itemsArray = Array.isArray(data) ? data : 
                        data.data || data.items || data.sessions || data.characters || data.settings || data.locations || data[Object.keys(data)[0]] || [];
      
      // Ensure we always set an array
      setItems(Array.isArray(itemsArray) ? itemsArray : []);
    } catch (err) {
      console.error(`Error fetching ${config.title}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search items
  const filteredItems = useMemo(() => {
    // Ensure items is always an array
    if (!Array.isArray(items)) {
      console.warn('Items is not an array:', items);
      return [];
    }
    
    return items.filter(item => {
      // Search filter
      const searchMatch = !searchTerm || 
        getNestedValue(item, config.displayFields.primary)?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (config.displayFields.secondary && getNestedValue(item, config.displayFields.secondary)?.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (config.displayFields.description && getNestedValue(item, config.displayFields.description)?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Type filter
      const filterMatch = !filterValue || !config.features?.filter || 
        item[config.features.filter.field] === filterValue;
      
      return searchMatch && filterMatch;
    });
  }, [items, searchTerm, filterValue, config]);

  // Get image for item
  const getItemImage = (item: LibraryItem) => {
    const imageField = config.displayFields.image;
    if (imageField && getNestedValue(item, imageField)) {
      return getNestedValue(item, imageField);
    }
    return null; // Let getDefaultImage handle fallbacks
  };

  // Get default image for item when no image is available
  const getDefaultImage = (item: LibraryItem) => {
    if (!config.imageConfig) {
      return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(item.name || item.id)}&backgroundColor=1e293b,334155,475569&scale=110`;
    }
    
    switch (config.imageConfig.fallbackType) {
      case 'avatar':
        const seed = config.imageConfig.avatarSeed?.(item) || item.name || item.id;
        return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e293b,334155,475569&scale=110`;
      case 'gradient':
        // For gradient types, use a generated image instead of pure CSS
        return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name || item.id)}&backgroundColor=1e293b,374151,0f172a`;
      case 'none':
      default:
        return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(item.name || item.id)}&backgroundColor=1e293b,334155,475569&scale=110`;
    }
  };

  // Handle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(getApiUrl(`${config.apiEndpoint}/${id}`), { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh the list
      await fetchItems();
      
      // Reset state
      setSelectedIds(new Set());
      setDeleteMode(false);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting items:', err);
      alert('Failed to delete some items. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading {config.title.toLowerCase()}...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-romantic-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-100 mb-4">{config.icon} {config.title}</h1>
            <div className="card-romantic p-8 max-w-md mx-auto">
              <div className="text-red-400 text-lg mb-4">⚠️ Error</div>
              <p className="text-slate-300 mb-4">{error}</p>
              <button 
                onClick={fetchItems}
                className="btn-romantic-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
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
                {config.icon} {config.title}
              </h1>
              <p className="text-slate-400">{config.subtitle}</p>
            </div>
          </div>

          {/* Welcome/Instructions Section */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Welcome to Your {config.title} Gallery
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                {config.subtitle}
              </p>
              <div className="mt-2 h-6 flex justify-center">
                <span className={`text-rose-400 font-medium transition-opacity duration-200 ${
                  deleteMode ? 'opacity-100' : 'opacity-0'
                }`}>
                  Select {config.title.toLowerCase()} to delete by clicking on their cards.
                </span>
              </div>
            </div>
          </div>

          {/* Search Controls and Action Buttons - Combined on same line */}
          <div className="mb-6 flex gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              {config.features?.search && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${config.title.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-romantic w-64"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    🔍
                  </span>
                </div>
              )}
              
              {config.features?.filter && (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="input-romantic w-48 pr-8"
                >
                  <option value="">All Tags</option>
                  {config.features.filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-4">
              {config.actions.create && (
                <Link href={config.actions.create.href} className="btn-romantic-primary">
                  {config.actions.create.label}
                </Link>
              )}
              {config.features?.bulkSelect && (
                !deleteMode ? (
                  <button
                    onClick={() => {
                      setDeleteMode(true);
                      setSelectedIds(new Set());
                    }}
                    className="btn-romantic-outline"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setDeleteMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="btn-romantic-outline"
                  >
                    Cancel
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card-romantic p-6 mb-8 border-red-500/50">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              onClick={fetchItems}
              className="btn-romantic-outline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">{config.emptyState?.icon || '📭'}</div>
            <h3 className="text-3xl font-bold text-slate-100 mb-4">
              {config.emptyState?.message || `No ${config.title.toLowerCase()} found`}
            </h3>
            <p className="text-slate-400 mb-8 text-lg">
              {searchTerm ? 'Try adjusting your search terms' : `Create your first ${config.title.toLowerCase().slice(0, -1)} to get started`}
            </p>
            {config.emptyState?.actionHref && (
              <Link href={config.emptyState.actionHref} className="btn-romantic-primary text-lg px-8 py-4">
                {config.emptyState.actionLabel}
              </Link>
            )}
          </div>
        )}

        {/* Content Grid Section */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Expanded Grid Container */}
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-4 gap-6 p-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const image = getItemImage(item);
                  
                  // Prepare tags from metadata
                  const itemTags = config.displayFields.metadata 
                    ? config.displayFields.metadata
                        .map(field => getNestedValue(item, field))
                        .filter(Boolean)
                        .slice(0, 3)
                    : [];

                  return (
                    <div key={item.id} className="relative">
                      <LibraryCard
                        image={image || getDefaultImage(item)}
                        title={getNestedValue(item, config.displayFields.primary) || ''}
                        subtitle={config.displayFields.secondary ? getNestedValue(item, config.displayFields.secondary) : undefined}
                        tags={itemTags}
                        createdAt={item.createdAt}
                        isInteractive={deleteMode}
                        isSelected={selectedIds.has(item.id)}
                        onClick={() => deleteMode ? toggleSelection(item.id) : undefined}
                        href={config.actions.view ? config.actions.view.href(item.id) : undefined}
                        overlays={[
                          <SelectionOverlay 
                            key="selection" 
                            isSelected={deleteMode && selectedIds.has(item.id)} 
                          />
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete Action Buttons */}
            {deleteMode && selectedIds.size > 0 && (
              <div className="mt-6 flex justify-end w-full max-w-6xl">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Confirm Delete ({selectedIds.size})
                </button>
              </div>
            )}
          </div>
        )}

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

        {/* Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                <p className="text-slate-300 mb-6">
                  Are you sure you want to delete {selectedIds.size} {config.title.toLowerCase()}{selectedIds.size > 1 ? '' : ''}? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}