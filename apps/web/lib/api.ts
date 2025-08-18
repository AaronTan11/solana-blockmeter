// Client-side API that calls Next.js API routes (no CORS issues)
export interface BlockData {
  blockNumber: number;
  transactionCount: number;
  blockhash: string;
  timestamp: number | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getBlockData(blockNumber: string | number): Promise<BlockData> {
  const response = await fetch('/api/blocks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blockNumber }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    
    if (response.status === 404) {
      throw new ApiError(404, errorData.error || `Block ${blockNumber} not found`);
    }
    throw new ApiError(response.status, errorData.error || `Failed to fetch block data: ${response.statusText}`);
  }

  return response.json();
}

export interface BatchBlockResult {
  blockNumber: number;
  success: boolean;
  data?: BlockData;
  error?: string;
}

export interface BatchBlockResponse {
  results: BatchBlockResult[];
}

export async function getMultipleBlocks(blockNumbers: (string | number)[]): Promise<BatchBlockResponse> {
  const response = await fetch('/api/blocks/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blockNumbers }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, errorData.error || 'Failed to fetch multiple blocks');
  }

  return response.json();
}

export async function checkApiHealth() {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Health check failed');
  }

  return response.json();
}

export function formatBlockHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}
