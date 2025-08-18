import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BlocksProcessor, SolanaBlockJob } from './blocks.processor';
import { PrismaService } from '../prisma/prisma.service';

describe('BlocksProcessor', () => {
  let processor: BlocksProcessor;
  let prismaService: PrismaService;

  const mockPrismaService = {
    solanaBlock: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get<BlocksProcessor>(BlocksProcessor);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process block data and store in database', async () => {
    const jobData: SolanaBlockJob = {
      blockNumber: 359399609,
      transactionCount: 1476,
      blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
      timestamp: 1754938644,
    };

    const mockJob = {
      data: jobData,
    } as Job<SolanaBlockJob>;

    mockPrismaService.solanaBlock.upsert.mockResolvedValue({});

    await processor.process(mockJob);

    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalledWith({
      where: { blockNumber: BigInt(359399609) },
      update: {
        transactionCount: 1476,
        blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
        timestamp: BigInt(1754938644),
        updatedAt: expect.any(Date),
      },
      create: {
        blockNumber: BigInt(359399609),
        transactionCount: 1476,
        blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
        timestamp: BigInt(1754938644),
      },
    });
  });

  it('should handle null timestamp correctly', async () => {
    const jobData: SolanaBlockJob = {
      blockNumber: 123456789,
      transactionCount: 1000,
      blockhash: 'test-hash',
      timestamp: null,
    };

    const mockJob = {
      data: jobData,
    } as Job<SolanaBlockJob>;

    mockPrismaService.solanaBlock.upsert.mockResolvedValue({});

    await processor.process(mockJob);

    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalledWith({
      where: { blockNumber: BigInt(123456789) },
      update: {
        transactionCount: 1000,
        blockhash: 'test-hash',
        timestamp: null,
        updatedAt: expect.any(Date),
      },
      create: {
        blockNumber: BigInt(123456789),
        transactionCount: 1000,
        blockhash: 'test-hash',
        timestamp: null,
      },
    });
  });

  it('should throw error when database operation fails', async () => {
    const jobData: SolanaBlockJob = {
      blockNumber: 555555555,
      transactionCount: 2000,
      blockhash: 'failing-hash',
      timestamp: 1654938644,
    };

    const mockJob = {
      data: jobData,
    } as Job<SolanaBlockJob>;

    const dbError = new Error('Database connection failed');
    mockPrismaService.solanaBlock.upsert.mockRejectedValue(dbError);

    await expect(processor.process(mockJob)).rejects.toThrow('Database connection failed');

    expect(mockPrismaService.solanaBlock.upsert).toHaveBeenCalled();
  });

  it('should log processing status', async () => {
    const jobData: SolanaBlockJob = {
      blockNumber: 777777777,
      transactionCount: 1500,
      blockhash: 'log-test-hash',
      timestamp: 1754938644,
    };

    const mockJob = {
      data: jobData,
    } as Job<SolanaBlockJob>;

    const logSpy = jest.spyOn(Logger.prototype, 'log');
    mockPrismaService.solanaBlock.upsert.mockResolvedValue({});

    await processor.process(mockJob);

    expect(logSpy).toHaveBeenCalledWith('Processing block storage job for block 777777777');
    expect(logSpy).toHaveBeenCalledWith('Successfully stored block 777777777 data in database');
  });

  it('should log errors when database operation fails', async () => {
    const jobData: SolanaBlockJob = {
      blockNumber: 888888888,
      transactionCount: 1800,
      blockhash: 'error-test-hash',
      timestamp: 1754938644,
    };

    const mockJob = {
      data: jobData,
    } as Job<SolanaBlockJob>;

    const errorSpy = jest.spyOn(Logger.prototype, 'error');
    const dbError = new Error('Database timeout');
    mockPrismaService.solanaBlock.upsert.mockRejectedValue(dbError);

    await expect(processor.process(mockJob)).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalledWith('Failed to store block 888888888: Database timeout');
  });
});
