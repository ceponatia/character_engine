// Dynamic API Configuration
// Automatically detects frontend port and calculates backend port

export function getApiBaseUrl(): string {
  // Only run on client side
  if (typeof window === 'undefined') {
    // Server-side fallback
    return 'http://localhost:3002';
  }

  // Get current frontend port from window.location
  const currentPort = window.location.port;
  const currentHost = window.location.hostname;
  
  // Default backend port
  let backendPort = '3002';
  
  // Port mapping logic
  switch (currentPort) {
    case '3000':
      backendPort = '3002'; // Default: Frontend 3000 -> Backend 3002
      break;
    case '3001':
      backendPort = '3002'; // Alt: Frontend 3001 -> Backend 3002  
      break;
    case '3003':
      backendPort = '3002'; // Alt: Frontend 3003 -> Backend 3002
      break;
    case '3004':
      backendPort = '3002'; // Alt: Frontend 3004 -> Backend 3002
      break;
    default:
      // For any other port, assume backend is on 3002
      backendPort = '3002';
  }

  const apiUrl = `http://${currentHost}:${backendPort}`;
  
  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Frontend: ${window.location.origin} -> Backend: ${apiUrl}`);
  }
  
  return apiUrl;
}

// Convenience function for API endpoints
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Test backend connectivity
export async function testBackendConnection(): Promise<boolean> {
  try {
    const healthUrl = getApiUrl('/health');
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend connection test failed:', error);
    return false;
  }
}

// Get WebSocket URL (separate from REST API)
export function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3003'; // WebSocket server port
  }
  
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3003`; // Dedicated WebSocket port
}

// Get backend status info
export async function getBackendStatus(): Promise<{
  connected: boolean;
  url: string;
  port: string;
}> {
  const baseUrl = getApiBaseUrl();
  const connected = await testBackendConnection();
  const port = baseUrl.split(':').pop() || '3002';
  
  return {
    connected,
    url: baseUrl,
    port
  };
}