'use client';

import { useEffect, useRef, useCallback, ReactNode, forwardRef } from 'react';

interface AutoScrollContainerProps {
  children: ReactNode;
  className?: string;
  dependencies?: any[]; // Array of dependencies to watch for changes
  scrollBehavior?: 'smooth' | 'instant';
  enableAutoScroll?: boolean;
  onScrollToBottom?: () => void;
}

/**
 * AutoScrollContainer - Automatically scrolls to bottom when content changes
 * 
 * Features:
 * - Auto-scrolls when new content is added (based on dependencies)
 * - Maintains scroll position if user has scrolled up manually
 * - Supports smooth or instant scrolling
 * - Optimized for chat interfaces with streaming messages
 * - Can be disabled/enabled dynamically
 */
const AutoScrollContainer = forwardRef<HTMLDivElement, AutoScrollContainerProps>(({
  children,
  className = '',
  dependencies = [],
  scrollBehavior = 'smooth',
  enableAutoScroll = true,
  onScrollToBottom
}, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
  const isUserScrolling = useRef(false);
  const shouldAutoScroll = useRef(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Check if the container is scrolled near the bottom
   * Returns true if within 100px of bottom (allows for small variations)
   */
  const isNearBottom = useCallback((): boolean => {
    const container = containerRef.current;
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  /**
   * Scroll to bottom of container
   */
  const scrollToBottom = useCallback((behavior: 'smooth' | 'instant' = scrollBehavior) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: behavior
    });

    // Call callback if provided
    onScrollToBottom?.();
  }, [scrollBehavior, onScrollToBottom]);

  /**
   * Handle scroll events to detect user-initiated scrolling
   */
  const handleScroll = useCallback(() => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Mark as user scrolling
    isUserScrolling.current = true;

    // Check if user scrolled back to bottom
    if (isNearBottom()) {
      shouldAutoScroll.current = true;
    } else {
      shouldAutoScroll.current = false;
    }

    // Reset user scrolling flag after a delay
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);
  }, [isNearBottom]);

  /**
   * Auto-scroll when dependencies change (new messages, etc.)
   */
  useEffect(() => {
    if (!enableAutoScroll) return;

    // Only auto-scroll if:
    // 1. User hasn't manually scrolled away from bottom
    // 2. We're not currently in a user-initiated scroll
    if (shouldAutoScroll.current && !isUserScrolling.current) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, dependencies);

  /**
   * Initialize scroll position and event listeners
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Start at bottom
    scrollToBottom('instant');

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, scrollToBottom]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Force scroll to bottom (for external use)
   */
  const forceScrollToBottom = useCallback((behavior?: 'smooth' | 'instant') => {
    shouldAutoScroll.current = true;
    scrollToBottom(behavior);
  }, [scrollToBottom]);

  // Expose methods via ref (for parent components)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).forceScrollToBottom = forceScrollToBottom;
      (containerRef.current as any).isNearBottom = isNearBottom;
    }
  }, [forceScrollToBottom, isNearBottom]);

  return (
    <div 
      ref={ref || internalRef}
      className={`overflow-y-auto ${className}`}
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none' // Prevents scroll anchoring issues
      }}
    >
      {children}
      {/* Invisible anchor element to help with scrolling */}
      <div style={{ height: '1px' }} />
    </div>
  );
});

AutoScrollContainer.displayName = 'AutoScrollContainer';
export default AutoScrollContainer;

/**
 * Hook for using auto-scroll functionality
 * Returns methods to control scrolling behavior
 */
export function useAutoScroll(containerRef: React.RefObject<HTMLDivElement>) {
  const forceScrollToBottom = useCallback((behavior: 'smooth' | 'instant' = 'smooth') => {
    const container = containerRef.current;
    if (container && (container as any).forceScrollToBottom) {
      (container as any).forceScrollToBottom(behavior);
    }
  }, [containerRef]);

  const isNearBottom = useCallback((): boolean => {
    const container = containerRef.current;
    if (container && (container as any).isNearBottom) {
      return (container as any).isNearBottom();
    }
    return true;
  }, [containerRef]);

  return {
    forceScrollToBottom,
    isNearBottom
  };
}