import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { Resource } from 'sst';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    let databaseUrl: string;

    try {
      // Use SST PostgreSQL resource
      const postgres = (Resource as Record<string, any>)[
        'solana-blockmeter-postgres'
      ];
      databaseUrl = `postgresql://${postgres.username}:${postgres.password}@${postgres.host}:${postgres.port}/${postgres.database}`;
      console.log('🔗 Using SST PostgreSQL resource for database connection');
    } catch (error) {
      // Fallback to environment variable
      databaseUrl = process.env.DATABASE_URL!;
      console.warn(
        '⚠️ SST PostgreSQL resource not available, using DATABASE_URL environment variable:',
        error.message,
      );
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
