import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get(':blockNumber')
  async getBlockTransactionCount(@Param('blockNumber', ParseIntPipe) blockNumber: number) {
    return this.blocksService.getTransactionCount(blockNumber);
  }
}
