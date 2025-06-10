/**
 * UI State Hooks - Reusable hooks for common UI state patterns
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing carousel/scroll position
 */
export function useScrollCarousel<T>(items: T[], visibleCount: number = 3) {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const scrollLeft = useCallback(() => {
    setScrollPosition(prev => Math.max(0, prev - 1));
  }, []);
  
  const scrollRight = useCallback(() => {
    const maxScroll = Math.max(0, items.length - visibleCount);
    setScrollPosition(prev => Math.min(maxScroll, prev + 1));
  }, [items.length, visibleCount]);
  
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < items.length - visibleCount;
  const visibleItems = items.slice(scrollPosition, scrollPosition + visibleCount);
  
  // Reset scroll position when items change
  useEffect(() => {
    setScrollPosition(0);
  }, [items.length]);
  
  return {
    scrollPosition,
    scrollLeft,
    scrollRight,
    canScrollLeft,
    canScrollRight,
    visibleItems,
    setScrollPosition
  };
}

/**
 * Hook for managing selection state (multi-select)
 */
export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);
  
  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      selectNone();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, selectNone]);
  
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const isAllSelected = selectedIds.size === items.length && items.length > 0;
  const isNoneSelected = selectedIds.size === 0;
  const selectedItems = items.filter(item => selectedIds.has(item.id));
  
  return {
    selectedIds,
    selectedItems,
    toggleSelection,
    selectAll,
    selectNone,
    toggleSelectAll,
    isSelected,
    isAllSelected,
    isNoneSelected,
    selectedCount: selectedIds.size,
    setSelectedIds
  };
}

/**
 * Hook for managing toggle states
 */
export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse, setValue };
}

/**
 * Hook for managing local storage state
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  
  return { value: storedValue, setValue, removeValue };
}

/**
 * Hook for managing modal/dialog state
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeModal]);
  
  return { isOpen, openModal, closeModal, toggleModal };
}

/**
 * Hook for managing pagination state
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;
  
  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);
  
  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    startIndex: startIndex + 1, // 1-based for display
    endIndex: Math.min(endIndex, items.length),
    totalItems: items.length
  };
}

/**
 * Hook for managing form state with validation
 */
export function useFormState<T extends Record<string, any>>(
  initialState: T,
  validators?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const markTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);
  
  const validate = useCallback(() => {
    if (!validators) return true;
    
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    
    Object.keys(validators).forEach(field => {
      const validator = validators[field as keyof T];
      if (validator) {
        const error = validator(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validators]);
  
  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);
  
  const hasErrors = Object.values(errors).some(error => error !== undefined);
  
  return {
    values,
    errors,
    touched,
    setValue,
    markTouched,
    validate,
    reset,
    hasErrors,
    setValues,
    setErrors
  };
}