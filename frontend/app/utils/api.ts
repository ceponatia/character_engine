/**
 * API Utilities - Standardized API handling and error management
 */

import { getApiUrl } from './api-config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Standardize API response format
 */
export function standardizeApiResponse<T>(response: any): ApiResponse<T> {
  // If already in standard format
  if (typeof response === 'object' && 'success' in response) {
    return response;
  }
  
  // Handle array responses
  if (Array.isArray(response)) {
    return { success: true, data: response as T };
  }
  
  // Handle object responses with data property
  if (response && typeof response === 'object') {
    const dataKey = Object.keys(response).find(key => 
      Array.isArray(response[key]) || (response[key] && typeof response[key] === 'object')
    );
    
    if (dataKey) {
      return { success: true, data: response[dataKey] };
    }
    
    return { success: true, data: response };
  }
  
  return { success: true, data: response };
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR'
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    return {
      message: errorObj.message || errorObj.error || 'An unknown error occurred',
      status: errorObj.status,
      code: errorObj.code
    };
  }
  
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Enhanced fetch function with standardized error handling
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return standardizeApiResponse<T>(data);
    
  } catch (error) {
    const apiError = handleApiError(error);
    return {
      success: false,
      error: apiError.message
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}

/**
 * Batch API requests
 */
export async function apiBatch<T = any>(
  requests: Array<{ endpoint: string; options?: RequestInit }>
): Promise<ApiResponse<T>[]> {
  const promises = requests.map(({ endpoint, options }) => apiFetch<T>(endpoint, options));
  return Promise.all(promises);
}

/**
 * Upload file helper
 */
export async function apiUpload<T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return standardizeApiResponse<T>(data);
    
  } catch (error) {
    const apiError = handleApiError(error);
    return {
      success: false,
      error: apiError.message
    };
  }
}

/**
 * Retry failed requests
 */
export async function apiWithRetry<T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T>;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await requestFn();
      if (result.success) {
        return result;
      }
      lastError = result;
    } catch (error) {
      lastError = {
        success: false,
        error: handleApiError(error).message
      };
    }
    
    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  
  return lastError!;
}

/**
 * Cache API responses
 */
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export async function apiWithCache<T = any>(
  endpoint: string,
  ttlMs: number = 5 * 60 * 1000, // 5 minutes default
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return { success: true, data: cached.data };
  }
  
  const result = await apiFetch<T>(endpoint, options);
  
  if (result.success && result.data) {
    apiCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  return result;
}

/**
 * Clear API cache
 */
export function clearApiCache(pattern?: string): void {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of apiCache.keys()) {
      if (regex.test(key)) {
        apiCache.delete(key);
      }
    }
  } else {
    apiCache.clear();
  }
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Type-safe API client class
 */
export class ApiClient {
  private baseEndpoint: string;
  
  constructor(baseEndpoint: string) {
    this.baseEndpoint = baseEndpoint.replace(/\/$/, ''); // Remove trailing slash
  }
  
  async list<T>(params?: Record<string, any>): Promise<ApiResponse<T[]>> {
    const queryString = params ? buildQueryString(params) : '';
    return apiGet<T[]>(`${this.baseEndpoint}${queryString}`);
  }
  
  async get<T>(id: string): Promise<ApiResponse<T>> {
    return apiGet<T>(`${this.baseEndpoint}/${id}`);
  }
  
  async create<T>(data: Partial<T>): Promise<ApiResponse<T>> {
    return apiPost<T>(this.baseEndpoint, data);
  }
  
  async update<T>(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return apiPut<T>(`${this.baseEndpoint}/${id}`, data);
  }
  
  async delete<T>(id: string): Promise<ApiResponse<T>> {
    return apiDelete<T>(`${this.baseEndpoint}/${id}`);
  }
  
  async bulkDelete(ids: string[]): Promise<ApiResponse<any>> {
    return apiPost(`${this.baseEndpoint}/bulk-delete`, { ids });
  }
}

// Pre-configured API clients
export const charactersApi = new ApiClient('/api/characters');
export const settingsApi = new ApiClient('/api/settings');
export const locationsApi = new ApiClient('/api/locations');
export const storiesApi = new ApiClient('/api/stories');