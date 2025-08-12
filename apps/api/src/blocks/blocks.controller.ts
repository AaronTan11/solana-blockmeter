import { Controller, Get, Param, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BlocksService } from './blocks.service';

@Controller('blocks')
@UseInterceptors(CacheInterceptor)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get(':blockNumber')
  async getBlockTransactionCount(@Param('blockNumber', ParseIntPipe) blockNumber: number) {
    return this.blocksService.getTransactionCount(blockNumber);
  }
}
