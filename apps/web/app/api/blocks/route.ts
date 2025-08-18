import { NextRequest, NextResponse } from 'next/server';
import { fetchFromApi } from '@/lib/server-api';

export async function POST(request: NextRequest) {
  try {
    const { blockNumber } = await request.json();
    
    // Validate block number
    if (!blockNumber) {
      return NextResponse.json(
        { error: 'Block number is required' },
        { status: 400 }
      );
    }

    const blockNum = parseInt(blockNumber);
    if (isNaN(blockNum) || blockNum < 0) {
      return NextResponse.json(
        { error: 'Invalid block number' },
        { status: 400 }
      );
    }

    // Fetch from NestJS API
    const blockData = await fetchFromApi(`/blocks/${blockNumber}`);
    
    return NextResponse.json(blockData);
  } catch (error: unknown) {
    console.error('Error fetching block data:', error);
    
    // Handle different error types
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch block data' },
      { status: 500 }
    );
  }
}
