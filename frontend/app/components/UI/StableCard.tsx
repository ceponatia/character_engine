'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface StableCardProps {
  children: ReactNode;
  href?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  overlays?: ReactNode[];
}

/**
 * StableCard Component
 * 
 * A reusable card component that maintains DOM stability across state changes.
 * Prevents image flickering and layout shifts by keeping the same DOM structure
 * and conditionally rendering overlays instead of switching between Link and div wrappers.
 * 
 * @param children - Card content (images, text, etc.)
 * @param href - URL to navigate to when card is clicked (when not in interactive mode)
 * @param isInteractive - Whether the card is in interactive mode (e.g., delete mode, selection mode)
 * @param isSelected - Whether the card is currently selected (affects styling)
 * @param className - Additional CSS classes for the card container
 * @param onClick - Click handler for interactive mode
 * @param overlays - Array of overlay elements to render on top of the card
 */
export default function StableCard({
  children,
  href,
  isInteractive = false,
  isSelected = false,
  className = '',
  onClick,
  overlays = []
}: StableCardProps) {
  const baseCardClasses = "card-romantic p-0 overflow-hidden transition-all duration-300";
  const interactiveClasses = isSelected ? 
    'ring-2 ring-rose-400 shadow-xl scale-105' : 
    'hover:ring-2 hover:ring-rose-400/50 hover:shadow-xl hover:scale-105';
  
  const cardClasses = `${baseCardClasses} ${interactiveClasses} ${className}`;

  return (
    <div
      className={`block group cursor-pointer ${isInteractive ? 'pointer-events-auto' : ''}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <div className={cardClasses}>
        <div className="relative">
          {/* Navigation Link - only active when not in interactive mode */}
          {!isInteractive && href && (
            <Link href={href} className="absolute inset-0 z-10" />
          )}
          
          {/* Card Content */}
          {children}
          
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

/**
 * Common overlay components for reuse
 */
export const SelectionOverlay = ({ isSelected }: { isSelected: boolean }) => {
  if (!isSelected) return null;
  
  return (
    <div className="bg-rose-500/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-rose-500 rounded-full p-2">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
};

export const DeleteOverlay = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;
  
  return (
    <div className="bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-red-500 rounded-full p-2">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    </div>
  );
};

export const EditOverlay = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;
  
  return (
    <div className="bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-blue-500 rounded-full p-2">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    </div>
  );
};