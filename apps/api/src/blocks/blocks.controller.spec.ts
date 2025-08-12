import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: BlocksService;

  const mockBlocksService = {
    getTransactionCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        { provide: BlocksService, useValue: mockBlocksService },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(BlocksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return block transaction count', async () => {
    const mockResult = {
      blockNumber: 359399609,
      transactionCount: 1476,
      blockhash: '7SnecFadW1NizZ7eysE94xQ5uXAdE32PiaXiaWhr2efb',
      timestamp: 1754938644,
    };

    mockBlocksService.getTransactionCount.mockResolvedValue(mockResult);

    const result = await controller.getBlockTransactionCount(359399609);

    expect(result).toEqual(mockResult);
    expect(service.getTransactionCount).toHaveBeenCalledWith(359399609);
  });

  it('should handle invalid block numbers', async () => {
    mockBlocksService.getTransactionCount.mockRejectedValue(
      new Error('Block not found'),
    );

    await expect(controller.getBlockTransactionCount(999999999999))
      .rejects
      .toThrow('Block not found');
  });
});
