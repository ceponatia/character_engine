'use client';

import { useState, useEffect } from 'react';
import { parseCommaSeparatedTags, formatTagsToCommaSeparated } from '../../utils/tag-parsing';

interface TagInputProps {
  label: string;
  value: string | string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxTags?: number;
  suggestions?: string[];
}

export default function TagInput({
  label,
  value,
  onChange,
  placeholder = "Enter tags separated by commas",
  className = "",
  disabled = false,
  maxTags,
  suggestions = []
}: TagInputProps) {
  // Convert input value to array format
  const currentTags = Array.isArray(value) ? value : parseCommaSeparatedTags(value || '');
  
  // Local state for the input field
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Initialize input value from props
  useEffect(() => {
    setInputValue(formatTagsToCommaSeparated(currentTags));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Parse and update tags in real-time
    const newTags = parseCommaSeparatedTags(newValue);
    
    // Apply max tags limit if specified
    const limitedTags = maxTags ? newTags.slice(0, maxTags) : newTags;
    
    onChange(limitedTags);
  };

  const handleInputBlur = () => {
    setShowSuggestions(false);
    // Clean up the display format on blur
    const cleanedDisplay = formatTagsToCommaSeparated(currentTags);
    setInputValue(cleanedDisplay);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const addSuggestion = (suggestion: string) => {
    const newTags = [...currentTags];
    if (!newTags.includes(suggestion)) {
      newTags.push(suggestion);
      const limitedTags = maxTags ? newTags.slice(0, maxTags) : newTags;
      onChange(limitedTags);
      setInputValue(formatTagsToCommaSeparated(limitedTags));
    }
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
    setInputValue(formatTagsToCommaSeparated(newTags));
  };

  // Filter suggestions to only show ones not already selected
  const availableSuggestions = suggestions.filter(
    suggestion => !currentTags.some(tag => 
      tag.toLowerCase() === suggestion.toLowerCase()
    )
  );

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
        {maxTags && (
          <span className="text-slate-400 text-xs ml-2">
            ({currentTags.length}/{maxTags})
          </span>
        )}
      </label>
      
      {/* Tag display area */}
      {currentTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
          {currentTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-rose-600/20 text-rose-300 border border-rose-600/30"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-rose-400 hover:text-rose-200 transition-colors"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg transition-all duration-200 placeholder:text-slate-400 hover:shadow-lg hover:shadow-rose-500/20 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:shadow-xl focus:shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg">
            <div className="max-h-40 overflow-y-auto">
              {availableSuggestions.slice(0, 8).map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}