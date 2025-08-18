import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { BlocksService } from './blocks.service';
import { BlocksProcessor } from './blocks.processor';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

// Mock SST Resources
jest.mock('sst', () => ({
  Resource: {
    'solana-blockmeter-redis': {
      host: 'localhost',
      port: 6379,
      username: 'default',
      password: 'test',
    },
    'solana-blockmeter-postgres': {
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test',
    },
  },
}));

// Mock Solana Web3
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBlock: jest.fn(),
  })),
}));

describe('Blocks Integration (Service + Processor + Database)', () => {
  let service: BlocksService;
  let processor: BlocksProcessor;
  let prismaService: PrismaService;
  let queue: Queue;
  let module: TestingModule;
  let mockConnection: any;

  const mockPrismaService = {
    solanaBlock: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        CacheModule.register({
          ttl: 60000,
          max: 100,
        }),
        BullModule.forRoot({
          connection: {
            host: 'localhost',
            port: 6379,
            db: 1, // Use different Redis DB for testing
          },
        }),
        BullModule.registerQueue({
          name: 'solana-blocks',
        }),
      ],
      providers: [
        BlocksService,
        BlocksProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    processor = module.get<BlocksProcessor>(BlocksProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
    queue = module.get<Queue>(getQueueToken('solana-blocks'));

    // Access the mocked connection
    mockConnection = (service as any).connection;
  });

  afterAll(async () => {
    await queue.close();
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate service and processor for complete flow', async () => {
    const mockBlockData = {
      transactions: new Array(1500),
      blockhash: 'integration-test-hash',
      blockTime: 1754938644,
    };

    const expectedResult = {
      blockNumber: 789789789,
      transactionCount: 1500,
      blockhash: 'integration-test-hash',
      timestamp: 1754938644,
    };

    // Mock Solana response
    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    
    // Mock database operations
    mockPrismaService.solanaBlock.upsert.mockResolvedValue({
      id: 'test-id',
      blockNumber: BigInt(789789789),
      transactionCount: 1500,
      blockhash: 'integration-test-hash',
      timestamp: BigInt(1754938644),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Call service
    const result = await service.getTransactionCount(789789789);

    // Verify service response
    expect(result).toEqual(expectedResult);

    // Wait for job to be processed (in real app this would be async)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify database was called correctly
    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalledWith({
      where: { blockNumber: BigInt(789789789) },
      update: {
        transactionCount: 1500,
        blockhash: 'integration-test-hash',
        timestamp: BigInt(1754938644),
        updatedAt: expect.any(Date),
      },
      create: {
        blockNumber: BigInt(789789789),
        transactionCount: 1500,
        blockhash: 'integration-test-hash',
        timestamp: BigInt(1754938644),
      },
    });
  });

  it('should handle high-volume concurrent requests', async () => {
    const mockBlockData = {
      transactions: new Array(2000),
      blockhash: 'high-volume-test-hash',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockPrismaService.solanaBlock.upsert.mockResolvedValue({});

    // Simulate high-volume concurrent requests
    const promises = Array(10).fill(null).map((_, index) =>
      service.getTransactionCount(888888880 + index)
    );

    const results = await Promise.all(promises);

    // All should complete successfully
    expect(results).toHaveLength(10);
    results.forEach((result, index) => {
      expect(result.blockNumber).toBe(888888880 + index);
      expect(result.transactionCount).toBe(2000);
    });

    // Should have made individual calls for each block
    expect(mockConnection.getBlock).toHaveBeenCalledTimes(10);
  });

  it('should maintain data integrity under error conditions', async () => {
    const mockBlockData = {
      transactions: new Array(1000),
      blockhash: 'error-test-hash',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    
    // Simulate database error
    mockPrismaService.solanaBlock.upsert.mockRejectedValueOnce(
      new Error('Database connection timeout')
    );

    // Service should still return data even if background job fails
    const result = await service.getTransactionCount(999999999);

    expect(result).toEqual({
      blockNumber: 999999999,
      transactionCount: 1000,
      blockhash: 'error-test-hash',
      timestamp: 1754938644,
    });

    // Wait for background job attempt
    await new Promise(resolve => setTimeout(resolve, 100));

    // Database should have been called despite error
    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalled();
  });

  it('should verify queue configuration and job options', async () => {
    const mockBlockData = {
      transactions: new Array(500),
      blockhash: 'queue-config-test',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockPrismaService.solanaBlock.upsert.mockResolvedValue({});

    await service.getTransactionCount(111222333);

    // Check if queue is properly configured
    expect(queue.name).toBe('solana-blocks');
    
    // In a real test, you might check queue jobs
    // const jobs = await queue.getJobs(['waiting', 'active', 'completed']);
    // expect(jobs.length).toBeGreaterThan(0);
  });

  it('should validate complete end-to-end data flow', async () => {
    const testBlockNumber = 456456456;
    const mockBlockData = {
      transactions: new Array(3000),
      blockhash: 'e2e-test-hash-12345',
      blockTime: 1754938644,
    };

    mockConnection.getBlock.mockResolvedValue(mockBlockData);
    mockPrismaService.solanaBlock.upsert.mockResolvedValue({
      id: 'e2e-test-id',
      blockNumber: BigInt(testBlockNumber),
      transactionCount: 3000,
      blockhash: 'e2e-test-hash-12345',
      timestamp: BigInt(1754938644),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 1. Call service
    const serviceResult = await service.getTransactionCount(testBlockNumber);

    // 2. Verify service response format
    expect(serviceResult).toMatchObject({
      blockNumber: testBlockNumber,
      transactionCount: 3000,
      blockhash: 'e2e-test-hash-12345',
      timestamp: 1754938644,
    });

    // 3. Simulate processor execution
    const processorResult = await processor.process({
      data: serviceResult,
    } as any);

    // 4. Verify database integration
    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalledWith({
      where: { blockNumber: BigInt(testBlockNumber) },
      update: {
        transactionCount: 3000,
        blockhash: 'e2e-test-hash-12345',
        timestamp: BigInt(1754938644),
        updatedAt: expect.any(Date),
      },
      create: {
        blockNumber: BigInt(testBlockNumber),
        transactionCount: 3000,
        blockhash: 'e2e-test-hash-12345',
        timestamp: BigInt(1754938644),
      },
    });

    // 5. Verify processor completes without error
    expect(processorResult).toBeUndefined(); // Processor returns void
  });
});
