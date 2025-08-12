const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  const response = await fetch(`${API_BASE_URL}/blocks/${blockNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(404, `Block ${blockNumber} not found`);
    }
    throw new ApiError(response.status, `Failed to fetch block data: ${response.statusText}`);
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
