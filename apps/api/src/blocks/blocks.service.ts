import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from '@solana/web3.js';

@Injectable()
export class BlocksService {
  private connection: Connection;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('solana.rpcUrl');
    const commitmentLevel = this.configService.get<string>('solana.commitmentLevel');
    
    this.connection = new Connection(rpcUrl!, commitmentLevel as any);
  }

  async getTransactionCount(blockNumber: number) {
    try {
      const block = await this.connection.getBlock(blockNumber, {
        maxSupportedTransactionVersion: 0,
      });

      if (!block) {
        throw new NotFoundException(`Block ${blockNumber} not found`);
      }

      const transactionCount = block.transactions.length;

      return {
        blockNumber,
        transactionCount,
        blockhash: block.blockhash,
        timestamp: block.blockTime,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch block ${blockNumber}: ${error.message}`);
    }
  }
}
