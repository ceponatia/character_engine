/**
 * Search & Filter Utilities - Reusable search and filtering logic
 */

/**
 * Create a search filter function for any object type
 */
export function createSearchFilter<T>(
  searchFields: (keyof T)[],
  searchTerm: string
): (item: T) => boolean {
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  if (!normalizedTerm) return () => true;
  
  return (item: T) => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedTerm);
      }
      if (Array.isArray(value)) {
        return value.some(v => 
          typeof v === 'string' && v.toLowerCase().includes(normalizedTerm)
        );
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).toLowerCase().includes(normalizedTerm);
      }
      return false;
    });
  };
}

/**
 * Create a type filter function
 */
export function createTypeFilter<T>(
  filterField: keyof T,
  filterValue: string
): (item: T) => boolean {
  if (!filterValue) return () => true;
  
  return (item: T) => {
    const value = item[filterField];
    if (typeof value === 'string') {
      return value.toLowerCase() === filterValue.toLowerCase();
    }
    return value === filterValue;
  };
}

/**
 * Combine multiple filter functions
 */
export function combineFilters<T>(...filters: ((item: T) => boolean)[]): (item: T) => boolean {
  return (item: T) => filters.every(filter => filter(item));
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sort items by relevance to search term
 */
export function sortByRelevance<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  return items.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    searchFields.forEach(field => {
      const valueA = String(a[field] || '').toLowerCase();
      const valueB = String(b[field] || '').toLowerCase();
      
      // Exact match gets highest score
      if (valueA === normalizedTerm) scoreA += 100;
      if (valueB === normalizedTerm) scoreB += 100;
      
      // Starts with search term gets high score
      if (valueA.startsWith(normalizedTerm)) scoreA += 50;
      if (valueB.startsWith(normalizedTerm)) scoreB += 50;
      
      // Contains search term gets medium score
      if (valueA.includes(normalizedTerm)) scoreA += 10;
      if (valueB.includes(normalizedTerm)) scoreB += 10;
    });
    
    return scoreB - scoreA;
  });
}

/**
 * Create filter options from array of items
 */
export function createFilterOptions<T>(
  items: T[],
  field: keyof T,
  labelFormatter?: (value: any) => string
): Array<{ value: string; label: string; count: number }> {
  const counts = new Map<string, number>();
  
  items.forEach(item => {
    const value = item[field];
    if (value) {
      const stringValue = String(value);
      counts.set(stringValue, (counts.get(stringValue) || 0) + 1);
    }
  });
  
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: labelFormatter ? labelFormatter(value) : value,
      count
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions<T>(
  items: T[],
  field: keyof T,
  partialInput: string,
  maxSuggestions: number = 5
): string[] {
  if (!partialInput.trim()) return [];
  
  const normalizedInput = partialInput.toLowerCase().trim();
  const suggestions = new Set<string>();
  
  items.forEach(item => {
    const value = String(item[field] || '');
    if (value.toLowerCase().includes(normalizedInput)) {
      suggestions.add(value);
    }
  });
  
  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Fuzzy search implementation for better matching
 */
export function fuzzySearch(text: string, pattern: string): boolean {
  if (!pattern) return true;
  if (!text) return false;
  
  const normalizedText = text.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();
  
  let patternIndex = 0;
  
  for (let i = 0; i < normalizedText.length && patternIndex < normalizedPattern.length; i++) {
    if (normalizedText[i] === normalizedPattern[patternIndex]) {
      patternIndex++;
    }
  }
  
  return patternIndex === normalizedPattern.length;
}

/**
 * Search with multiple terms (AND logic)
 */
export function multiTermSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  searchTerms: string[]
): T[] {
  const normalizedTerms = searchTerms
    .map(term => term.toLowerCase().trim())
    .filter(term => term.length > 0);
  
  if (normalizedTerms.length === 0) return items;
  
  return items.filter(item => {
    return normalizedTerms.every(term => {
      return searchFields.some(field => {
        const value = String(item[field] || '').toLowerCase();
        return value.includes(term);
      });
    });
  });
}