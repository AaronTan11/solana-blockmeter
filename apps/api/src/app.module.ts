import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { Resource } from 'sst';
import { Cluster } from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlocksModule } from './blocks/blocks.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        try {
          // Use SST Redis resource with ioredis cluster (following SST pattern)
          console.log('🔗 Connecting to SST Redis cluster with ioredis...');

          const redis = (Resource as Record<string, any>)[
            'solana-blockmeter-redis'
          ];
          const redisCluster = new Cluster(
            [
              {
                host: redis.host,
                port: redis.port,
              },
            ],
            {
              dnsLookup: (address, callback) => callback(null, address),
              redisOptions: {
                tls: {},
                username: redis.username,
                password: redis.password,
              },
            },
          );

          console.log('Redis cluster created successfully');

          return {
            store: redisCluster,
            ttl: 600000, // 10 minutes
          };
        } catch (error) {
          console.warn(
            '⚠️ SST Redis resource not available, using in-memory cache:',
            error.message,
          );
          return {
            ttl: 600000,
            max: 1000,
          };
        }
      },
    }),
    BullModule.forRootAsync({
      useFactory: async () => {
        try {
          // Use SST Redis cluster for BullMQ (following SST pattern)
          console.log('🔗 Connecting BullMQ to SST Redis cluster...');

          const redis = (Resource as Record<string, any>)[
            'solana-blockmeter-redis'
          ];
          // BullMQ accepts ioredis cluster configuration directly
          return {
            connection: {
              host: redis.host,
              port: redis.port,
              username: redis.username,
              password: redis.password,
              tls: {},
              enableCluster: true,
              dnsLookup: (
                address: string,
                callback: (err: Error | null, result: string) => void,
              ) => callback(null, address),
              enableOfflineQueue: false,
            },
            prefix: '{bullmq}', // Use hash tag to ensure all keys go to same slot
          };
        } catch (error) {
          console.warn(
            '⚠️ SST Redis resource not available for BullMQ, using localhost:',
            error.message,
          );
          return {
            connection: {
              host: 'localhost',
              port: 6379,
            },
          };
        }
      },
    }),
    PrismaModule,
    BlocksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
