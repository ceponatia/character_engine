'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'rose' | 'purple' | 'slate' | 'white';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  rose: 'border-rose-500',
  purple: 'border-purple-500',
  slate: 'border-slate-400',
  white: 'border-white'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'rose', 
  className = '',
  text
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          border-2 border-t-transparent
          rounded-full 
          animate-spin
        `}
      />
      {text && (
        <p className={`text-slate-300 ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Pre-configured loading states for common use cases
export const LoadingStates = {
  CharacterLoading: () => (
    <LoadingSpinner 
      size="lg" 
      text="Loading characters..." 
      className="py-8"
    />
  ),
  
  SettingsLoading: () => (
    <LoadingSpinner 
      size="lg" 
      text="Loading settings..." 
      className="py-8"
    />
  ),
  
  ChatLoading: () => (
    <LoadingSpinner 
      size="md" 
      text="Connecting to chat..." 
      className="py-4"
    />
  ),
  
  PageLoading: () => (
    <LoadingSpinner 
      size="xl" 
      text="Loading..." 
      className="py-12"
    />
  ),
  
  ButtonLoading: () => (
    <LoadingSpinner 
      size="sm" 
      color="white"
    />
  )
};