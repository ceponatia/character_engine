'use client';

interface ErrorCardProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
}

const typeStyles = {
  error: {
    container: 'bg-red-900/20 border-red-500/30 text-red-100',
    icon: '🚨',
    title: 'text-red-300',
    button: 'bg-red-600 hover:bg-red-700 text-white'
  },
  warning: {
    container: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
    icon: '⚠️',
    title: 'text-yellow-300',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
  },
  info: {
    container: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
    icon: 'ℹ️',
    title: 'text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  }
};

export default function ErrorCard({
  title,
  message,
  type = 'error',
  onRetry,
  onDismiss,
  className = '',
  showIcon = true
}: ErrorCardProps) {
  const styles = typeStyles[type];

  return (
    <div className={`
      ${styles.container}
      border rounded-lg p-6 max-w-md mx-auto
      backdrop-blur-sm shadow-lg
      ${className}
    `}>
      <div className="flex items-start gap-4">
        {showIcon && (
          <span className="text-2xl flex-shrink-0 mt-1">
            {styles.icon}
          </span>
        )}
        
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold text-lg mb-2 ${styles.title}`}>
              {title}
            </h3>
          )}
          
          <p className="text-sm leading-relaxed mb-4">
            {message}
          </p>
          
          <div className="flex gap-2 flex-wrap">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`
                  ${styles.button}
                  px-4 py-2 rounded text-sm font-medium
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
                `}
              >
                Try Again
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="
                  bg-slate-600 hover:bg-slate-700 text-slate-200
                  px-4 py-2 rounded text-sm font-medium
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800
                "
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pre-configured error states for common scenarios
export const ErrorStates = {
  NetworkError: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorCard
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      type="error"
    />
  ),
  
  LoadingError: ({ message, onRetry }: { message?: string; onRetry?: () => void }) => (
    <ErrorCard
      title="Loading Failed"
      message={message || "Failed to load data. Please try again."}
      onRetry={onRetry}
      type="error"
    />
  ),
  
  NotFound: ({ itemType = "item" }: { itemType?: string }) => (
    <ErrorCard
      title="Not Found"
      message={`The ${itemType} you're looking for doesn't exist or may have been deleted.`}
      type="warning"
    />
  ),
  
  Unauthorized: () => (
    <ErrorCard
      title="Access Denied"
      message="You don't have permission to access this resource."
      type="warning"
    />
  ),
  
  ValidationError: ({ message }: { message: string }) => (
    <ErrorCard
      title="Validation Error"
      message={message}
      type="warning"
      showIcon={false}
    />
  )
};