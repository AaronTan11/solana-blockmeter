import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { BlocksProcessor } from './blocks.processor';
import solanaConfig from '../config/solana.config';

@Module({
  imports: [
    ConfigModule.forFeature(solanaConfig),
    BullModule.registerQueue({
      name: 'solana-blocks',
    }),
  ],
  controllers: [BlocksController],
  providers: [BlocksService, BlocksProcessor],
  exports: [BlocksService],
})
export class BlocksModule {}
