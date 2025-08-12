import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

export interface SolanaBlockJob {
  blockNumber: number;
  transactionCount: number;
  blockhash: string;
  timestamp: number | null;
}

@Injectable()
@Processor('solana-blocks')
export class BlocksProcessor extends WorkerHost {
  private readonly logger = new Logger(BlocksProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<SolanaBlockJob>): Promise<void> {
    const { blockNumber, transactionCount, blockhash, timestamp } = job.data;
    
    this.logger.log(`Processing block storage job for block ${blockNumber}`);

    try {
      // Store block data in Prisma database
      await this.prisma.solanaBlock.upsert({
        where: { blockNumber: BigInt(blockNumber) },
        update: {
          transactionCount,
          blockhash,
          timestamp: timestamp ? BigInt(timestamp) : null,
          updatedAt: new Date(),
        },
        create: {
          blockNumber: BigInt(blockNumber),
          transactionCount,
          blockhash,
          timestamp: timestamp ? BigInt(timestamp) : null,
        },
      });

      this.logger.log(`Successfully stored block ${blockNumber} data in database`);
    } catch (error) {
      this.logger.error(`Failed to store block ${blockNumber}: ${error.message}`);
      throw error; // Let BullMQ handle retries
    }
  }
}
