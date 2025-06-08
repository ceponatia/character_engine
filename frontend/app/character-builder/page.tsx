'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Sidebar from './Sidebar';

interface CharacterFormData {
  // Identity
  name: string;
  sourceMaterial: string;
  archetype: string;
  chatbotRole: string;
  conceptualAge: string;
  
  // Visual Avatar
  description: string;
  attire: string;
  colors: string[];
  features: string;
  avatarImage?: string;
  
  // Vocal Style
  tone: string[];
  pacing: string;
  inflection: string;
  vocabulary: string;
  
  // Personality
  primaryTraits: string[];
  secondaryTraits: string[];
  quirks: string[];
  interruptionTolerance: 'high' | 'medium' | 'low';
  
  // Operational Directives
  primaryMotivation: string;
  coreGoal: string;
  secondaryGoals: string[];
  
  // Interaction Model
  coreAbilities: string[];
  approach: string;
  patience: string;
  demeanor: string;
  adaptability: string;
  
  // Signature Phrases
  greeting: string;
  affirmation: string;
  comfort: string;
  
  // Boundaries
  forbiddenTopics: string[];
  interactionPolicy: string;
  conflictResolution: string;
}

const archetypes = [
  'Nurturing Caregiver',
  'Playful Companion',
  'Wise Mentor',
  'Romantic Partner',
  'Mysterious Enigma',
  'Energetic Enthusiast',
  'Calm Philosopher',
  'Protective Guardian',
  'Creative Artist',
  'Loyal Friend'
];

const chatbotRoles = [
  'Romantic Interest',
  'Best Friend',
  'Mentor/Guide',
  'Adventure Companion',
  'Emotional Support',
  'Creative Partner',
  'Life Coach',
  'Study Buddy',
  'Gaming Partner',
  'Confidant'
];

const personalityTraits = [
  'Empathetic', 'Playful', 'Intelligent', 'Nurturing', 'Adventurous',
  'Calm', 'Energetic', 'Mysterious', 'Loyal', 'Creative', 'Protective',
  'Humorous', 'Wise', 'Passionate', 'Patient', 'Spontaneous', 'Gentle',
  'Confident', 'Curious', 'Supportive', 'Independent', 'Romantic',
  'Analytical', 'Optimistic', 'Intuitive'
];

const tones = [
  'Warm', 'Playful', 'Sultry', 'Gentle', 'Confident', 'Mysterious',
  'Enthusiastic', 'Calm', 'Caring', 'Teasing', 'Serious', 'Bubbly',
  'Sophisticated', 'Casual', 'Encouraging'
];

export default function CharacterBuilder() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CharacterFormData>();
  const [activeSection, setActiveSection] = useState('identity');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const onSubmit = async (data: CharacterFormData) => {
    const characterData = {
      characterBio: {
        name: data.name,
        identity: {
          sourceMaterial: data.sourceMaterial,
          archetype: data.archetype,
          chatbotRole: data.chatbotRole,
          conceptualAge: data.conceptualAge
        },
        presentation: {
          visualAvatar: {
            description: data.description,
            attire: data.attire,
            colors: selectedColors,
            features: data.features,
            avatarImage: data.avatarImage
          },
          vocalStyle: {
            tone: selectedTones,
            pacing: data.pacing,
            inflection: data.inflection,
            vocabulary: data.vocabulary
          }
        },
        personality: {
          primaryTraits: selectedTraits.slice(0, 3),
          secondaryTraits: selectedTraits.slice(3, 6),
          quirks: data.quirks ? data.quirks.split('\n').filter(q => q.trim()) : [],
          interruptionTolerance: data.interruptionTolerance
        },
        operationalDirectives: {
          primaryMotivation: data.primaryMotivation,
          coreGoal: data.coreGoal,
          secondaryGoals: data.secondaryGoals ? data.secondaryGoals.split('\n').filter(g => g.trim()) : []
        },
        interactionModel: {
          coreAbilities: data.coreAbilities ? data.coreAbilities.split('\n').filter(a => a.trim()) : [],
          style: {
            approach: data.approach,
            patience: data.patience,
            demeanor: data.demeanor,
            adaptability: data.adaptability
          },
          signaturePhrases: {
            greeting: data.greeting,
            affirmation: data.affirmation,
            comfort: data.comfort
          }
        },
        boundaries: {
          forbiddenTopics: data.forbiddenTopics ? data.forbiddenTopics.split('\n').filter(t => t.trim()) : [],
          interactionPolicy: data.interactionPolicy,
          conflictResolution: data.conflictResolution
        }
      }
    };
    
    try {
      const response = await fetch('http://localhost:3001/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Character "${result.character.name}" created successfully!`);
        console.log('Character Created:', result.character);
        // Redirect to characters page
        window.location.href = '/characters';
      } else {
        alert(`Error creating character: ${result.error}`);
        console.error('Character creation failed:', result);
      }
    } catch (error) {
      alert('Failed to save character. Please check if the backend server is running.');
      console.error('Network error:', error);
    }
  };

  const toggleArrayItem = (item: string, array: string[], setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be smaller than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setValue('avatarImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setValue('avatarImage', undefined);
  };

  const sections = [
    { id: 'identity', label: 'Identity', icon: '🆔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'voice', label: 'Voice & Style', icon: '🎵' },
    { id: 'personality', label: 'Personality', icon: '💫' },
    { id: 'goals', label: 'Goals & Motivation', icon: '🎯' },
    { id: 'interaction', label: 'Interaction Style', icon: '🤝' },
    { id: 'boundaries', label: 'Boundaries', icon: '🛡️' }
  ];

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <Link href="/characters" className="btn btn-outline">
            ← Back to Characters
          </Link>
          <h1 className="page-title">
            ✨ Character Builder
          </h1>
          <p className="page-subtitle">
            Craft your perfect companion with personality, appearance, and interaction style
          </p>
        </div>

        <div className="character-builder-layout">
          <Sidebar
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            avatarPreview={avatarPreview}
            onImageUpload={handleImageUpload}
            onRemoveAvatar={removeAvatar}
          />

          <div className="main-content">
            <form onSubmit={handleSubmit(onSubmit)} className="card">
              
              {/* Identity Section */}
              {activeSection === 'identity' && (
                <div className="form-section">
                  <h2 className="section-title">
                    🆔 Character Identity
                  </h2>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Character Name *
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      className="form-input"
                      placeholder="e.g., Emma, Luna, Alex"
                    />
                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Source Material
                    </label>
                    <input
                      {...register('sourceMaterial')}
                      className="input-romantic w-full"
                      placeholder="e.g., Original creation, Inspired by anime, Based on book character"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Character Archetype *
                    </label>
                    <select
                      {...register('archetype', { required: 'Archetype is required' })}
                      className="input-romantic w-full"
                    >
                      <option value="">Select an archetype...</option>
                      {archetypes.map(archetype => (
                        <option key={archetype} value={archetype}>{archetype}</option>
                      ))}
                    </select>
                    {errors.archetype && <p className="text-red-500 text-sm mt-1">{errors.archetype.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chatbot Role *
                    </label>
                    <select
                      {...register('chatbotRole', { required: 'Role is required' })}
                      className="input-romantic w-full"
                    >
                      <option value="">Select primary role...</option>
                      {chatbotRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {errors.chatbotRole && <p className="text-red-500 text-sm mt-1">{errors.chatbotRole.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Conceptual Age
                    </label>
                    <input
                      {...register('conceptualAge')}
                      className="input-romantic w-full"
                      placeholder="e.g., Young adult (22-25), Mature (30s), Ageless wisdom"
                    />
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">🎨 Visual Appearance</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Physical Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="input-romantic w-full"
                      placeholder="Describe physical appearance, height, build, hair, eyes, distinctive features..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Typical Attire
                    </label>
                    <input
                      {...register('attire')}
                      className="input-romantic w-full"
                      placeholder="e.g., Casual sundresses, business attire, gothic style, athletic wear"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color Palette
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Blue', 'Red', 'Green', 'Purple', 'Pink', 'Black', 'White', 'Gold', 'Silver', 'Brown', 'Orange', 'Yellow'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => toggleArrayItem(color, selectedColors, setSelectedColors)}
                          className={`toggle-romantic ${
                            selectedColors.includes(color) ? 'selected' : ''
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Selected: {selectedColors.join(', ') || 'None'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Distinctive Features
                    </label>
                    <input
                      {...register('features')}
                      className="input-romantic w-full"
                      placeholder="e.g., Dimples when smiling, graceful movements, expressive eyes, unique accessories"
                    />
                  </div>
                </div>
              )}

              {/* Voice & Style Section */}
              {activeSection === 'voice' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">🎵 Voice & Communication Style</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vocal Tones
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {tones.map(tone => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => toggleArrayItem(tone, selectedTones, setSelectedTones)}
                          className={`toggle-romantic ${
                            selectedTones.includes(tone) ? 'selected' : ''
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">Selected: {selectedTones.join(', ') || 'None'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Speech Pacing
                    </label>
                    <select
                      {...register('pacing')}
                      className="input-romantic w-full"
                    >
                      <option value="">Select pacing...</option>
                      <option value="Rapid and energetic">Rapid and energetic</option>
                      <option value="Measured and thoughtful">Measured and thoughtful</option>
                      <option value="Slow and deliberate">Slow and deliberate</option>
                      <option value="Variable with emotion">Variable with emotion</option>
                      <option value="Casual and relaxed">Casual and relaxed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Emotional Inflection
                    </label>
                    <input
                      {...register('inflection')}
                      className="input-romantic w-full"
                      placeholder="e.g., Expressive with rising intonation, Subtle emotional undertones, Dramatic emphasis"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vocabulary Style
                    </label>
                    <input
                      {...register('vocabulary')}
                      className="input-romantic w-full"
                      placeholder="e.g., Sophisticated and articulate, Casual with slang, Poetic and metaphorical"
                    />
                  </div>
                </div>
              )}

              {/* Personality Section */}
              {activeSection === 'personality' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">💫 Personality Traits</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Personality Traits (Select up to 6: first 3 become primary traits)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {personalityTraits.map(trait => (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleArrayItem(trait, selectedTraits, setSelectedTraits)}
                          className={`toggle-romantic ${
                            selectedTraits.includes(trait) ? 'selected' : ''
                          }`}
                          disabled={!selectedTraits.includes(trait) && selectedTraits.length >= 6}
                        >
                          {trait}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Primary: {selectedTraits.slice(0, 3).join(', ') || 'None'}<br/>
                      Secondary: {selectedTraits.slice(3, 6).join(', ') || 'None'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interruption Tolerance
                    </label>
                    <select
                      {...register('interruptionTolerance')}
                      className="input-romantic w-full"
                    >
                      <option value="">Select tolerance level...</option>
                      <option value="high">High - Easily interrupted, adaptable to topic changes</option>
                      <option value="medium">Medium - Moderate interruption tolerance</option>
                      <option value="low">Low - Prefers to complete thoughts, dislikes interruptions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Unique Quirks/Behaviors
                    </label>
                    <textarea
                      {...register('quirks')}
                      rows={3}
                      className="input-romantic w-full"
                      placeholder="e.g., Always fidgets with jewelry when nervous, Hums while thinking, Uses specific catchphrases..."
                    />
                  </div>
                </div>
              )}

              {/* Goals & Motivation Section */}
              {activeSection === 'goals' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">🎯 Goals & Motivation</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Primary Motivation
                    </label>
                    <input
                      {...register('primaryMotivation')}
                      className="input-romantic w-full"
                      placeholder="e.g., To provide emotional support, To create meaningful connections, To inspire growth"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Core Goal
                    </label>
                    <input
                      {...register('coreGoal')}
                      className="input-romantic w-full"
                      placeholder="e.g., Be a loving partner, Help user achieve their dreams, Provide wisdom and guidance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Secondary Goals (one per line)
                    </label>
                    <textarea
                      {...register('secondaryGoals')}
                      rows={4}
                      className="input-romantic w-full"
                      placeholder="e.g., Create moments of joy&#10;Encourage personal growth&#10;Share interesting conversations&#10;Be a reliable friend"
                    />
                  </div>
                </div>
              )}

              {/* Interaction Style Section */}
              {activeSection === 'interaction' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">🤝 Interaction Style</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Core Abilities (one per line)
                    </label>
                    <textarea
                      {...register('coreAbilities')}
                      rows={4}
                      className="input-romantic w-full"
                      placeholder="e.g., Active listening&#10;Emotional support&#10;Playful conversation&#10;Creative problem solving&#10;Romantic interaction"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Interaction Approach
                      </label>
                      <select
                        {...register('approach')}
                        className="input-romantic w-full"
                      >
                        <option value="">Select approach...</option>
                        <option value="Direct and honest">Direct and honest</option>
                        <option value="Gentle and nurturing">Gentle and nurturing</option>
                        <option value="Playful and teasing">Playful and teasing</option>
                        <option value="Supportive and encouraging">Supportive and encouraging</option>
                        <option value="Mysterious and intriguing">Mysterious and intriguing</option>
                        <option value="Intellectual and thoughtful">Intellectual and thoughtful</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Patience Level
                      </label>
                      <select
                        {...register('patience')}
                        className="input-romantic w-full"
                      >
                        <option value="">Select patience level...</option>
                        <option value="Very patient">Very patient - Never rushes</option>
                        <option value="Moderately patient">Moderately patient - Usually understanding</option>
                        <option value="Somewhat impatient">Somewhat impatient - Likes progress</option>
                        <option value="Task-focused">Task-focused - Results-oriented</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Overall Demeanor
                      </label>
                      <input
                        {...register('demeanor')}
                        className="input-romantic w-full"
                        placeholder="e.g., Warm and welcoming, Cool and composed, Energetic and bubbly"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Adaptability
                      </label>
                      <select
                        {...register('adaptability')}
                        className="input-romantic w-full"
                      >
                        <option value="">Select adaptability...</option>
                        <option value="Highly adaptable">Highly adaptable - Flows with any situation</option>
                        <option value="Moderately flexible">Moderately flexible - Adapts with some guidance</option>
                        <option value="Prefers routine">Prefers routine - Likes familiar patterns</option>
                        <option value="Set in ways">Set in ways - Strong preferences and habits</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Signature Phrases</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Typical Greeting
                        </label>
                        <input
                          {...register('greeting')}
                          className="input-romantic w-full"
                          placeholder="e.g., Hey there!, Good to see you, Hello beautiful"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Affirmation Style
                        </label>
                        <input
                          {...register('affirmation')}
                          className="input-romantic w-full"
                          placeholder="e.g., Absolutely!, That's wonderful, I agree completely"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Comfort Phrases
                        </label>
                        <input
                          {...register('comfort')}
                          className="input-romantic w-full"
                          placeholder="e.g., It's okay, I'm here for you, Everything will be alright"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boundaries Section */}
              {activeSection === 'boundaries' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-2">🛡️ Boundaries & Guidelines</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Forbidden Topics (one per line)
                    </label>
                    <textarea
                      {...register('forbiddenTopics')}
                      rows={4}
                      className="input-romantic w-full"
                      placeholder="e.g., Past relationships&#10;Family trauma&#10;Financial stress&#10;Work complaints"
                    />
                    <p className="text-sm text-slate-500 mt-1">Topics this character should avoid or redirect away from</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interaction Policy
                    </label>
                    <textarea
                      {...register('interactionPolicy')}
                      rows={4}
                      className="input-romantic w-full"
                      placeholder="e.g., Always maintain respectful dialogue, Prioritize user's emotional well-being, Keep conversations positive and constructive, Respect personal boundaries..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Conflict Resolution Approach
                    </label>
                    <select
                      {...register('conflictResolution')}
                      className="input-romantic w-full"
                    >
                      <option value="">Select conflict resolution style...</option>
                      <option value="Peaceful mediator">Peaceful mediator - Seeks compromise and understanding</option>
                      <option value="Direct communicator">Direct communicator - Addresses issues head-on</option>
                      <option value="Gentle redirector">Gentle redirector - Softly steers away from conflict</option>
                      <option value="Problem solver">Problem solver - Focuses on finding solutions</option>
                      <option value="Emotional supporter">Emotional supporter - Prioritizes feelings over facts</option>
                      <option value="Avoidant">Avoidant - Prefers to sidestep conflicts when possible</option>
                    </select>
                  </div>

                  <div className="bg-gradient-to-r from-burgundy-900/20 to-rose-900/20 border border-burgundy-500/30 p-6 rounded-xl">
                    <h4 className="font-semibold text-burgundy-300 mb-3 text-lg flex items-center gap-2">
                      🎉 Character Creation Complete!
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      You've crafted every detail of your perfect companion. Review your choices using the navigation sidebar, 
                      then click "✨ Create Character" to bring them to life.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Form Actions */}
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(sections[currentIndex - 1].id);
                    }
                  }}
                  className="btn-romantic-outline disabled:opacity-50"
                  disabled={activeSection === sections[0].id}
                >
                  ← Previous
                </button>
                
                <div className="flex space-x-4">
                  {activeSection === sections[sections.length - 1].id ? (
                    <button
                      type="submit"
                      className="btn-romantic-primary text-lg px-8 py-3"
                    >
                      ✨ Create Character
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection);
                        if (currentIndex < sections.length - 1) {
                          setActiveSection(sections[currentIndex + 1].id);
                        }
                      }}
                      className="btn-romantic-secondary"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}