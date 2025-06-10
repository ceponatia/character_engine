'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { truncateCardTitle, truncateCardDescription } from '../../utils/helpers';

interface LibraryCardProps {
  image: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  createdAt?: string;
  likes?: number;
  views?: number;
  onClick?: () => void;
  isSelected?: boolean;
  isInteractive?: boolean;
  overlays?: ReactNode[];
  href?: string; // Navigation URL for non-interactive mode
}

/**
 * LibraryCard Component
 * 
 * A modern card layout inspired by contemporary AI platforms.
 * Features a large image area with metadata footer containing tags and stats.
 * 
 * @param image - Image URL for the card
 * @param title - Primary title text
 * @param subtitle - Secondary descriptive text
 * @param tags - Array of tag strings to display
 * @param createdAt - Creation date ISO string
 * @param likes - Number of likes/stars
 * @param views - Number of views
 * @param onClick - Click handler for interactive mode
 * @param isSelected - Whether the card is selected
 * @param isInteractive - Whether the card is in interactive mode
 * @param overlays - Array of overlay elements
 */
export default function LibraryCard({
  image,
  title,
  subtitle,
  tags = [],
  createdAt,
  likes = 0,
  views = 0,
  onClick,
  isSelected = false,
  isInteractive = false,
  overlays = [],
  href
}: LibraryCardProps) {
  
  const formatCreationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1d';
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    return `${Math.floor(diffInDays / 30)}mo`;
  };

  const getRandomLikes = () => Math.floor(Math.random() * 100) + 1;
  const getRandomViews = () => Math.floor(Math.random() * 1000) + 100;

  // Use StableCard's hover logic - show hover when not selected, selected styling when selected
  const baseCardClasses = "card-romantic p-0 overflow-hidden transition-all duration-300 cursor-pointer h-[320px]";
  const interactiveClasses = isSelected ? 
    'ring-2 ring-rose-400 shadow-xl scale-105' : 
    'hover:ring-2 hover:ring-rose-400/50 hover:shadow-xl hover:scale-105';
  
  const cardClasses = `${baseCardClasses} ${interactiveClasses}`;

  return (
    <div className="relative">
      <div className={cardClasses} onClick={isInteractive ? onClick : undefined}>
        <div className="relative">
          {/* Navigation Link - only active when not in interactive mode */}
          {!isInteractive && href && (
            <Link href={href} className="absolute inset-0 z-10" />
          )}
          
          {/* Character Image - takes up most of the card */}
          <div className="h-[200px] w-full overflow-hidden relative">
            <img 
              src={image}
              alt={title}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(title)}&backgroundColor=1e293b,334155,475569&scale=110`;
              }}
            />
          </div>

          {/* Card Content - bottom section */}
          <div className="p-3 flex flex-col h-[120px] bg-slate-800/90 backdrop-blur-sm">
          {/* Character Name and Type */}
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-100 mb-1 truncate">
              {truncateCardTitle(title)}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2 flex-1">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-slate-700/60 text-slate-300 text-xs rounded-full border border-slate-600/50">
                {tag}
              </span>
            ))}
            {/* Placeholder tags when no tags provided */}
            {tags.length === 0 && (
              <>
                <span className="px-2 py-1 bg-rose-600/20 text-rose-300 text-xs rounded-full border border-rose-500/30">
                  AI-Chat
                </span>
                <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                  Original
                </span>
              </>
            )}
          </div>

          {/* Bottom Stats Row */}
          <div className="flex items-center justify-between text-xs text-slate-400 mt-auto">
            <div className="flex items-center gap-3">
              {/* Creation Date */}
              <span className="flex items-center gap-1">
                📅 {createdAt ? formatCreationDate(createdAt) : '1d'}
              </span>
              
              {/* Likes */}
              <span className="flex items-center gap-1">
                ⭐ {likes || getRandomLikes()}
              </span>
              
              {/* Views */}
              <span className="flex items-center gap-1">
                👁️ {views || getRandomViews()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Overlays */}
        {overlays.map((overlay, index) => (
          <div key={index} className={`absolute inset-0 z-${20 + index}`}>
            {overlay}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}