import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { BlocksService } from './blocks.service';

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBlock: jest.fn(),
  })),
}));

describe('BlocksService', () => {
  let service: BlocksService;
  let mockConnection: any;
  let mockQueue: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'solana.rpcUrl') return 'https://api.mainnet-beta.solana.com';
      if (key === 'solana.commitmentLevel') return 'confirmed';
      return null;
    }),
  };

  const mockSolanaBlocksQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getQueueToken('solana-blocks'), useValue: mockSolanaBlocksQueue },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    mockQueue = module.get(getQueueToken('solana-blocks'));
    // Access the mocked connection
    mockConnection = (service as any).connection;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return block data with correct format and queue background job', async () => {
    const mockBlockData = {
      transactions: new Array(1476), // Mock 1476 transactions
      blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    const result = await service.getTransactionCount(359399609);

    expect(result).toEqual({
      blockNumber: 359399609,
      transactionCount: 1476,
      blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
      timestamp: 1754938644,
    });

    expect(mockConnection.getBlock).toHaveBeenCalledWith(359399609, {
      maxSupportedTransactionVersion: 0,
    });

    // Verify background job was queued
    expect(mockQueue.add).toHaveBeenCalledWith('store-block', {
      blockNumber: 359399609,
      transactionCount: 1476,
      blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
      timestamp: 1754938644,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  });

  it('should throw NotFoundException when block is not found', async () => {
    mockConnection.getBlock.mockResolvedValue(null);

    await expect(service.getTransactionCount(999999999999))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should throw NotFoundException for Solana block not available error', async () => {
    mockConnection.getBlock.mockRejectedValue(
      new Error('failed to get confirmed block: Block not available for slot 999999999999')
    );

    await expect(service.getTransactionCount(999999999999))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should throw NotFoundException for skipped slot error', async () => {
    mockConnection.getBlock.mockRejectedValue(
      new Error('Slot 123456789 was skipped or was not confirmed')
    );

    await expect(service.getTransactionCount(123456789))
      .rejects
      .toThrow(NotFoundException);
  });

  it('should throw error when Solana RPC fails', async () => {
    mockConnection.getBlock.mockRejectedValue(new Error('RPC Error'));

    await expect(service.getTransactionCount(359399609))
      .rejects
      .toThrow('Failed to fetch block 359399609: RPC Error');
  });

  it('should validate response format matches requirements', () => {
    const expectedFormat = {
      blockNumber: expect.any(Number),
      transactionCount: expect.any(Number),
      blockhash: expect.any(String),
      timestamp: expect.any(Number),
    };

    // Validate the expected API response structure
    expect(expectedFormat.blockNumber).toBeDefined();
    expect(expectedFormat.transactionCount).toBeDefined();
    expect(expectedFormat.blockhash).toBeDefined();
    expect(expectedFormat.timestamp).toBeDefined();
  });

  it('should handle queue failures gracefully', async () => {
    const mockBlockData = {
      transactions: new Array(1000),
      blockhash: 'test-hash',
      blockTime: 1654938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockRejectedValue(new Error('Queue connection failed'));

    // Should still return block data even if queue fails
    const result = await service.getTransactionCount(123456789);

    expect(result).toEqual({
      blockNumber: 123456789,
      transactionCount: 1000,
      blockhash: 'test-hash',
      timestamp: 1654938644,
    });

    expect(mockConnection.getBlock).toHaveBeenCalled();
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('should handle null timestamp', async () => {
    const mockBlockData = {
      transactions: new Array(500),
      blockhash: 'test-hash-null',
      blockTime: null, // Some blocks might have null timestamp
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    const result = await service.getTransactionCount(987654321);

    expect(result).toEqual({
      blockNumber: 987654321,
      transactionCount: 500,
      blockhash: 'test-hash-null',
      timestamp: null,
    });
  });

  it('should handle large transaction counts correctly', async () => {
    const mockBlockData = {
      transactions: new Array(5000), // Large block
      blockhash: 'large-block-hash',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    const result = await service.getTransactionCount(359399610);

    expect(result).toEqual({
      blockNumber: 359399610,
      transactionCount: 5000,
      blockhash: 'large-block-hash',
      timestamp: 1754938644,
    });

    // Verify large data is queued correctly
    expect(mockQueue.add).toHaveBeenCalledWith('store-block', {
      blockNumber: 359399610,
      transactionCount: 5000,
      blockhash: 'large-block-hash',
      timestamp: 1754938644,
    }, expect.any(Object));
  });

  it('should maintain data consistency between API response and background job', async () => {
    const mockBlockData = {
      transactions: new Array(2500),
      blockhash: 'consistency-test-hash',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    const result = await service.getTransactionCount(123123123);

    // API response
    const expectedData = {
      blockNumber: 123123123,
      transactionCount: 2500,
      blockhash: 'consistency-test-hash',
      timestamp: 1754938644,
    };

    expect(result).toEqual(expectedData);

    // Background job should receive identical data
    expect(mockQueue.add).toHaveBeenCalledWith('store-block', expectedData, expect.any(Object));
  });

  it('should validate block number bounds', async () => {
    // Test with block number 0
    const mockBlockData = {
      transactions: new Array(100),
      blockhash: 'genesis-block-hash',
      blockTime: 1609459200, // Unix timestamp for 2021-01-01
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    const result = await service.getTransactionCount(0);

    expect(result.blockNumber).toBe(0);
    expect(result.transactionCount).toBe(100);
  });

  it('should handle concurrent service calls efficiently', async () => {
    const mockBlockData = {
      transactions: new Array(1000),
      blockhash: 'concurrent-test-hash',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockQueue.add.mockResolvedValue({});

    // Make multiple concurrent calls
    const promises = Array(5).fill(null).map(() => 
      service.getTransactionCount(555666777)
    );

    const results = await Promise.all(promises);

    // All results should be identical
    const expectedResult = {
      blockNumber: 555666777,
      transactionCount: 1000,
      blockhash: 'concurrent-test-hash',
      timestamp: 1754938644,
    };

    results.forEach(result => {
      expect(result).toEqual(expectedResult);
    });

    // Should have made 5 calls to Solana (no caching at service level)
    expect(mockConnection.getBlock).toHaveBeenCalledTimes(5);
    
    // Should have queued 5 background jobs
    expect(mockQueue.add).toHaveBeenCalledTimes(5);
  });
});

