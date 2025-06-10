import { LibraryConfig } from './LibraryTemplate';

export const charactersConfig: LibraryConfig = {
  title: 'Characters',
  subtitle: 'Manage your AI companions and their personalities',
  icon: '👥',
  apiEndpoint: '/api/characters',
  
  displayFields: {
    primary: 'name',
    secondary: 'archetype',
    description: 'description',
    image: 'imageUrl',
  },
  
  imageConfig: {
    fallbackType: 'avatar',
    avatarSeed: (item) => item.name || item.id,
  },
  
  actions: {
    create: {
      label: '✨ Create Character',
      href: '/character-builder',
    },
    view: {
      href: (id) => `/characters/${id}`,
    },
    edit: {
      href: (id) => `/character-builder?edit=${id}`,
    },
  },
  
  features: {
    search: true,
    bulkSelect: true,
    filter: {
      field: 'tags',
      options: [
        { value: 'romantic', label: 'Romantic' },
        { value: 'adventurous', label: 'Adventurous' },
        { value: 'mysterious', label: 'Mysterious' },
        { value: 'playful', label: 'Playful' },
        { value: 'serious', label: 'Serious' },
        { value: 'original', label: 'Original' },
      ],
    },
  },
  
  emptyState: {
    icon: '👤',
    message: 'No characters created yet',
    actionLabel: '✨ Create Your First Character',
    actionHref: '/character-builder',
  },
};

export const settingsConfig: LibraryConfig = {
  title: 'Settings',
  subtitle: 'Browse and manage story settings and environments',
  icon: '🌍',
  apiEndpoint: '/api/settings',
  
  displayFields: {
    primary: 'name',
    secondary: 'theme',
    description: 'description',
    image: 'imageUrl',
    metadata: ['settingType', 'mood', 'timeOfDay'],
  },
  
  imageConfig: {
    fallbackType: 'gradient',
    gradientClass: 'bg-gradient-to-br from-purple-600 to-blue-600',
  },
  
  actions: {
    create: {
      label: '🌟 Create Setting',
      href: '/setting-builder',
    },
    view: {
      href: (id) => `/settings/${id}`,
    },
    edit: {
      href: (id) => `/setting-builder?edit=${id}`,
    },
    custom: [{
      label: 'Start Story',
      href: (id) => `/story-config?setting=${id}`,
      className: 'btn-romantic-secondary text-sm',
    }],
  },
  
  features: {
    search: true,
    bulkSelect: true,
    filter: {
      field: 'settingType',
      options: [
        { value: 'general', label: 'General' },
        { value: 'fantasy', label: 'Fantasy' },
        { value: 'modern', label: 'Modern' },
        { value: 'sci-fi', label: 'Sci-Fi' },
        { value: 'historical', label: 'Historical' },
      ],
    },
  },
  
  emptyState: {
    icon: '🏞️',
    message: 'No settings available',
    actionLabel: '🌟 Create Setting',
    actionHref: '/setting-builder',
  },
};

export const locationsConfig: LibraryConfig = {
  title: 'Locations',
  subtitle: 'Explore and manage specific locations within settings',
  icon: '📍',
  apiEndpoint: '/api/locations',
  
  displayFields: {
    primary: 'name',
    secondary: 'atmosphere',
    description: 'description',
    metadata: ['details'],
  },
  
  imageConfig: {
    fallbackType: 'gradient',
    gradientClass: 'bg-gradient-to-br from-green-600 to-teal-600',
  },
  
  actions: {
    create: {
      label: '📍 Create Location',
      href: '/location-builder',
    },
    view: {
      href: (id) => `/locations/${id}`,
    },
    edit: {
      href: (id) => `/location-builder?edit=${id}`,
    },
  },
  
  features: {
    search: true,
    bulkSelect: true,
    relationships: {
      field: 'setting_locations',
      display: (rels) => {
        if (!rels || rels.length === 0) return '';
        const count = rels.length;
        return `Used in ${count} setting${count !== 1 ? 's' : ''}`;
      },
    },
  },
  
  emptyState: {
    icon: '🗺️',
    message: 'No locations created yet',
    actionLabel: '📍 Create Location',
    actionHref: '/location-builder',
  },
};

export const storiesConfig: LibraryConfig = {
  title: 'Stories',
  subtitle: 'Continue your ongoing conversations and adventures',
  icon: '📚',
  apiEndpoint: '/api/chat-sessions',
  
  displayFields: {
    primary: 'name',
    secondary: 'character_name', // Will be populated by custom logic
    description: 'setting_name',  // Will be populated by custom logic
  },
  
  imageConfig: {
    fallbackType: 'gradient',
    gradientClass: 'bg-gradient-to-br from-rose-600 to-purple-600',
  },
  
  actions: {
    view: {
      href: (id) => `/stories/${id}`,
    },
    custom: [
      {
        label: 'Resume Chat',
        href: (id) => `/chat/${id}`,
        className: 'btn-romantic-primary text-sm',
      },
    ],
  },
  
  features: {
    search: true,
    bulkSelect: true,
    filter: {
      field: 'tags',
      options: [
        { value: 'romance', label: 'Romance' },
        { value: 'adventure', label: 'Adventure' },
        { value: 'fantasy', label: 'Fantasy' },
        { value: 'slice-of-life', label: 'Slice of Life' },
        { value: 'drama', label: 'Drama' },
        { value: 'comedy', label: 'Comedy' },
      ],
    },
  },
  
  emptyState: {
    icon: '📖',
    message: 'No stories started yet',
    actionLabel: '✨ Start Your First Story',
    actionHref: '/story-config',
  },
};