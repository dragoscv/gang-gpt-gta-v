import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

// For now, we'll use any as the type to avoid type issues
// In production, this would be replaced with the actual AppRouter type
export const trpc = createTRPCReact<any>();

// Helper function to get the base URL for API calls
function getBaseUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log('Environment NEXT_PUBLIC_BACKEND_URL:', backendUrl);
  if (typeof window !== 'undefined') {
    // browser should use the public environment variable
    const url = backendUrl || 'http://localhost:4828';
    console.log('Browser base URL:', url);
    return url;
  }

  // environment variable for server-side requests
  if (process.env.BACKEND_URL) {
    console.log('Server base URL:', process.env.BACKEND_URL);
    return process.env.BACKEND_URL;
  }

  // development fallback
  console.log('Fallback base URL: http://localhost:4828');
  return 'http://localhost:4828';
}

// For now, let's also export a simple API client for direct HTTP calls
// Make the getBaseUrl function directly available

// Simple API client for direct REST API calls
export const apiClient = {
  async post(endpoint: string, data: any, token?: string) {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || `API call failed: ${response.statusText}`);
    }

    return result;
  }, async get(endpoint: string, token?: string) {
    const baseUrl = getBaseUrl();
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log('Attempting API call to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || `API call failed: ${response.statusText}`);
    }

    return result;
  },

  // Add specialized method for stats endpoint
  async getStats() {
    const url = `${getBaseUrl()}/api/stats`;
    console.log('Fetching stats from:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stats API failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
