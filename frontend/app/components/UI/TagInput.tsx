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
  // Optional select dropdown for types/categories
  selectValue?: string;
  selectOptions?: Array<{ value: string; label: string }>;
  onSelectChange?: (value: string) => void;
  selectLabel?: string;
}

export default function TagInput({
  label,
  value,
  onChange,
  placeholder = "Enter tags separated by commas",
  className = "",
  disabled = false,
  maxTags,
  suggestions = [],
  selectValue,
  selectOptions,
  onSelectChange,
  selectLabel
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
    // Add a small delay to allow suggestion clicks to register
    setTimeout(() => {
      setShowSuggestions(false);
      // Clean up the display format on blur
      const cleanedDisplay = formatTagsToCommaSeparated(currentTags);
      setInputValue(cleanedDisplay);
    }, 150);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const addSuggestion = (suggestion: string) => {
    const newTags = [...currentTags];
    // Capitalize the suggestion before adding it
    const capitalizedSuggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase();
    if (!newTags.some(tag => tag.toLowerCase() === suggestion.toLowerCase())) {
      newTags.push(capitalizedSuggestion);
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
      
      {/* Optional select dropdown */}
      {selectOptions && selectOptions.length > 0 && (
        <div className="relative mb-3">
          {selectLabel && (
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {selectLabel}
            </label>
          )}
          <select
            value={selectValue || ''}
            onChange={(e) => onSelectChange?.(e.target.value)}
            disabled={disabled}
            className="input-romantic w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
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
          className="input-romantic w-full disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="absolute w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
            <div className="max-h-40 overflow-y-auto">
              {availableSuggestions.slice(0, 8).map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}