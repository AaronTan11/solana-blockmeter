import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { Connection } from '@solana/web3.js';
// import { SolanaBlockJob } from './blocks.processor';

@Injectable()
export class BlocksService {
  private connection: Connection;

  constructor(
    private configService: ConfigService,
    // @InjectQueue('solana-blocks') private solanaBlocksQueue: Queue<SolanaBlockJob>,
  ) {
    const rpcUrl = this.configService.get<string>('solana.rpcUrl');
    const commitmentLevel = this.configService.get<string>('solana.commitmentLevel');
    
    this.connection = new Connection(rpcUrl!, commitmentLevel as any);
  }

  async getTransactionCount(blockNumber: number) {
    try {
      // Fetch from Solana (caching handled by CacheInterceptor in controller)
      const block = await this.connection.getBlock(blockNumber, {
        maxSupportedTransactionVersion: 0,
      });

      if (!block) {
        throw new NotFoundException(`Block ${blockNumber} not found`);
      }

      const transactionCount = block.transactions.length;
      const result = {
        blockNumber,
        transactionCount,
        blockhash: block.blockhash,
        timestamp: block.blockTime,
      };

      // Database storage disabled - caching only
      // await this.solanaBlocksQueue.add('store-block', result, {
      //   attempts: 3,
      //   backoff: {
      //     type: 'exponential',
      //     delay: 2000,
      //   },
      //   removeOnComplete: 100, // Keep last 100 completed jobs
      //   removeOnFail: 50, // Keep last 50 failed jobs
      // });

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch block ${blockNumber}: ${error.message}`);
    }
  }
}
