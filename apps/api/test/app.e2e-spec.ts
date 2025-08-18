import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Mock SST resources for testing
    jest.mock('sst', () => ({
      Resource: {
        'solana-blockmeter-redis': {
          host: 'localhost',
          port: 6379,
          username: 'default',
          password: 'test',
        },
        'solana-blockmeter-postgres': {
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
        },
      },
    }));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/blocks/:blockNumber (GET)', () => {
    // Using a known valid block number
    return request(app.getHttpServer())
      .get('/blocks/359399609')
      .expect(200)
      .expect((res: any) => {
        expect(res.body).toHaveProperty('blockNumber');
        expect(res.body).toHaveProperty('transactionCount');
        expect(res.body).toHaveProperty('blockhash');
        expect(res.body).toHaveProperty('timestamp');
        expect(typeof res.body.blockNumber).toBe('number');
        expect(typeof res.body.transactionCount).toBe('number');
        expect(typeof res.body.blockhash).toBe('string');
      });
  }, 30000); // 30 second timeout for Solana RPC call

  it('/blocks/:blockNumber (GET) - Invalid block should return 404', () => {
    return request(app.getHttpServer())
      .get('/blocks/999999999999')
      .expect(404)
      .expect((res: any) => {
        expect(res.body.message).toContain('Block');
        expect(res.body.message).toContain('not found');
      });
  }, 30000);

  it('/blocks/:blockNumber (GET) - Should cache responses for performance', async () => {
    const blockNumber = 359399609;
    
    // First request - should be slower (from Solana)
    const start1 = Date.now();
    const response1 = await request(app.getHttpServer())
      .get(`/blocks/${blockNumber}`)
      .expect(200);
    const duration1 = Date.now() - start1;
    
    // Second request - should be faster (from cache)
    const start2 = Date.now();
    const response2 = await request(app.getHttpServer())
      .get(`/blocks/${blockNumber}`)
      .expect(200);
    const duration2 = Date.now() - start2;
    
    // Verify responses are identical
    expect(response1.body).toEqual(response2.body);
    
    // Second request should be significantly faster (cache hit)
    expect(duration2).toBeLessThan(duration1 * 0.5); // At least 50% faster
  }, 60000);

  it('/blocks/:blockNumber (GET) - Should handle concurrent requests correctly', async () => {
    const blockNumber = 359399608;
    
    // Make multiple concurrent requests
    const promises = Array(5).fill(null).map(() => 
      request(app.getHttpServer())
        .get(`/blocks/${blockNumber}`)
        .expect(200)
    );
    
    const responses = await Promise.all(promises);
    
    // All responses should be identical
    const firstResponse = responses[0].body;
    responses.forEach(response => {
      expect(response.body).toEqual(firstResponse);
    });
  }, 60000);

  it('/blocks/:blockNumber (GET) - Should validate response format', () => {
    return request(app.getHttpServer())
      .get('/blocks/359399609')
      .expect(200)
      .expect((res: any) => {
        // Validate required fields
        expect(res.body).toHaveProperty('blockNumber');
        expect(res.body).toHaveProperty('transactionCount');
        expect(res.body).toHaveProperty('blockhash');
        expect(res.body).toHaveProperty('timestamp');
        
        // Validate data types
        expect(typeof res.body.blockNumber).toBe('number');
        expect(typeof res.body.transactionCount).toBe('number');
        expect(typeof res.body.blockhash).toBe('string');
        expect(res.body.timestamp === null || typeof res.body.timestamp === 'number').toBe(true);
        
        // Validate constraints
        expect(res.body.blockNumber).toBeGreaterThan(0);
        expect(res.body.transactionCount).toBeGreaterThanOrEqual(0);
        expect(res.body.blockhash).toMatch(/^[A-Za-z0-9]+$/); // Base58 format
      });
  }, 30000);

  it('/blocks/:blockNumber (GET) - Should handle rate limiting gracefully', async () => {
    const blockNumber = 359399607;
    
    // Make rapid sequential requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app.getHttpServer())
          .get(`/blocks/${blockNumber}`)
      );
    }
    
    const responses = await Promise.all(promises);
    
    // All should succeed (cache should handle this)
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status); // Either success or rate limited
    });
  }, 30000);
});
