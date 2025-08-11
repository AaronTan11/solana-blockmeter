import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import solanaConfig from '../config/solana.config';

@Module({
  imports: [ConfigModule.forFeature(solanaConfig)],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
