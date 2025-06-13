'use client';

import { useState, useRef, useEffect } from 'react';
import { transformChatMessageForDisplay } from '../../utils/placeholders';

interface ChatMessageProps {
  id: string;
  text: string;
  sender: 'user' | 'character';
  characterName?: string;
  characterId?: string;
  isLatestCharacterMessage?: boolean;
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>;
  storyId?: string;
  userName?: string;
  realCharacterName?: string;
}

export default function ChatMessage({
  id,
  text,
  sender,
  characterName,
  isLatestCharacterMessage = false,
  onUpdateMessage,
  storyId,
  userName = 'User',
  realCharacterName = 'Character'
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // For popup, use a more generous minimum height and scale with content
      const minHeight = 200; // Fixed minimum for good UX
      const maxHeight = window.innerHeight * 0.5; // Max 50% of viewport height
      
      // Use the larger of minimum height or content height, but cap at max height
      const newHeight = Math.min(Math.max(minHeight, textarea.scrollHeight), maxHeight);
      textarea.style.height = newHeight + 'px';
    }
  };

  // Auto-resize when editing text changes
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [editingText, isEditing]);

  const startEditing = () => {
    // Convert HTML formatting back to asterisk format for editing
    // This handles both <em> tags and <em class="..."> tags
    const rawText = text
      .replace(/<em[^>]*>/g, '*')
      .replace(/<\/em>/g, '*');
    setEditingText(rawText);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!onUpdateMessage || !editingText.trim()) return;

    setIsSaving(true);
    try {
      // Update the message via the parent component's handler
      await onUpdateMessage(id, editingText);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new lines
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] ${
        sender === 'user'
          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
          : 'bg-slate-800/50 text-slate-100 border border-slate-700/50'
      } rounded-2xl px-4 py-3 shadow-lg relative group`}>
        
        {sender === 'character' && characterName && (
          <div className="text-xs text-slate-400 mb-1 font-medium">
            {characterName}
          </div>
        )}
        
        {/* Original text - always visible */}
        <div 
          className="whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: text }}
        />
        
        {/* Edit popup modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-[600px] max-w-full max-h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-700">
                <h3 className="text-base font-semibold text-slate-100">Edit Message</h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  ref={textareaRef}
                  value={editingText}
                  onChange={(e) => {
                    setEditingText(e.target.value);
                    // Trigger resize on next frame to ensure value is updated
                    setTimeout(adjustTextareaHeight, 0);
                  }}
                  onKeyDown={handleKeyPress}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 min-h-[250px]"
                  placeholder="Edit message..."
                  autoFocus
                  style={{ 
                    overflow: 'auto'
                  }}
                />
              </div>
              
              <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1.5 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={isSaving || !editingText.trim()}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit button - only show on latest character message when not editing */}
        {!isEditing && sender === 'character' && isLatestCharacterMessage && onUpdateMessage && (
          <button
            onClick={startEditing}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200"
            title="Edit message"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}