// Server-side API utilities that can access SST resources
// This file should only be imported and used in server-side code

import { Resource } from "sst";

// Server-side function to get API URL from SST Resource
export function getApiUrl(): string {
  try {
    // Use SST Resource when available
    const url = Resource["solana-blockmeter-api"].url;
    
    // Check if SST is in dev mode and resource is not available
    if (url === 'url-unavailable-in-dev.mode' || !url || url.includes('unavailable')) {
      console.warn('SST Resource not available in dev mode, using localhost');
      return 'http://localhost:3000';
    }
    
    return url;
  } catch (error) {
    // Fallback for local development
    console.warn('SST Resource not available, using localhost:', error);
    return 'http://localhost:3000';
  }
}

// Server-side function to make API calls
export async function fetchFromApi(endpoint: string, options?: RequestInit) {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}${endpoint}`;
  
  console.log('🔗 Fetching from:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error: unknown) {
    console.error('❌ API request failed:', {
      url: fullUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined,
    });
    throw error;
  }
}
