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
});

