import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/server-api';

export async function GET() {
  try {
    const apiUrl = getApiUrl();
    
    // Check if the NestJS API is healthy
    const response = await fetch(`${apiUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const isApiHealthy = response.ok;
    const apiData = isApiHealthy ? await response.text() : null;
    
    return NextResponse.json({
      status: 'healthy',
      nextjs: true,
      nestjsApi: {
        url: apiUrl,
        healthy: isApiHealthy,
        response: apiData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        nextjs: true,
        nestjsApi: {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
