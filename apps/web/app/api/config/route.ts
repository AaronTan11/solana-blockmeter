// API route that demonstrates server-side SST resource access
import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/server-api';

export async function GET() {
  try {
    const apiUrl = getApiUrl();
    
    return NextResponse.json({
      apiUrl,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting config:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
