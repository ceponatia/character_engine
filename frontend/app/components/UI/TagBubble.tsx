'use client';

import { ReactNode } from 'react';
import { truncateText } from '../../utils/helpers';

export interface TagBubbleProps {
  children: ReactNode;
  variant?: 'rose' | 'purple' | 'slate' | 'blue' | 'gradient-purple';
  size?: 'xs' | 'sm' | 'md';
  shape?: 'full' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  maxLength?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Unified tag bubble component for consistent styling across the application
 * Handles different color themes, sizes, and interactive functionality
 */
export default function TagBubble({ 
  children, 
  variant = 'slate', 
  size = 'sm', 
  shape = 'full',
  removable = false,
  onRemove,
  maxLength,
  className = '',
  onClick
}: TagBubbleProps) {
  
  // Process children to string for truncation if needed
  const content = maxLength && typeof children === 'string' 
    ? truncateText(children, maxLength)
    : children;

  // Build variant classes
  const variantClasses = {
    rose: 'bg-rose-600/20 text-rose-300 border border-rose-500/30',
    purple: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
    'gradient-purple': 'bg-gradient-to-r from-purple-600/20 to-violet-600/20 text-purple-300 border border-purple-500/30',
    slate: 'bg-slate-700/60 text-slate-300 border border-slate-600/50',
    blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  };

  // Build size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base'
  };

  // Build shape classes
  const shapeClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg'
  };

  // Build base classes
  const baseClasses = `
    inline-flex items-center gap-2
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${shapeClasses[shape]}
    transition-colors duration-200
    ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick from firing
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <span className={baseClasses} onClick={handleClick}>
      <span>{content}</span>
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className="ml-1 hover:bg-current hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}

// Convenience components for common use cases
export const ThemeTag = ({ children, ...props }: Omit<TagBubbleProps, 'variant'>) => (
  <TagBubble variant="rose" maxLength={20} {...props}>{children}</TagBubble>
);

export const CharacterTag = ({ children, ...props }: Omit<TagBubbleProps, 'variant'>) => (
  <TagBubble variant="purple" {...props}>{children}</TagBubble>
);

export const ColorTag = ({ children, ...props }: Omit<TagBubbleProps, 'variant' | 'shape'>) => (
  <TagBubble variant="gradient-purple" shape="lg" {...props}>{children}</TagBubble>
);

export const DefaultTag = ({ children, ...props }: Omit<TagBubbleProps, 'variant' | 'size'>) => (
  <TagBubble variant="slate" size="xs" {...props}>{children}</TagBubble>
);

// Trait-specific components for character pages
export const TraitTag = ({ 
  children, 
  type = 'default',
  ...props 
}: Omit<TagBubbleProps, 'variant'> & { type?: 'primary' | 'secondary' | 'quirk' | 'tone' | 'goal' | 'ability' | 'forbidden' | 'default' }) => {
  const variantMap = {
    primary: 'rose' as const,
    secondary: 'purple' as const,
    quirk: 'blue' as const,
    tone: 'rose' as const,
    goal: 'purple' as const,
    ability: 'blue' as const,
    forbidden: 'slate' as const,
    default: 'slate' as const
  };
  
  return (
    <TagBubble variant={variantMap[type]} size="sm" {...props}>
      {children}
    </TagBubble>
  );
};