import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigModule } from '@nestjs/config';

describe('Cache Performance Tests', () => {
  let cacheManager: Cache;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        CacheModule.register({
          ttl: 600000, // 10 minutes
          max: 1000,
        }),
      ],
    }).compile();

    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheManager.reset();
  });

  it('should demonstrate cache performance benefits', async () => {
    const testKey = 'performance-test-key';
    const testData = {
      blockNumber: 123456789,
      transactionCount: 2500,
      blockhash: 'performance-test-hash',
      timestamp: Date.now(),
      largeData: new Array(1000).fill('test-data'),
    };

    // Simulate expensive operation (cache miss)
    const start1 = Date.now();
    await cacheManager.set(testKey, testData);
    const setDuration = Date.now() - start1;

    // Cache hit should be much faster
    const start2 = Date.now();
    const cachedData = await cacheManager.get(testKey);
    const getDuration = Date.now() - start2;

    expect(cachedData).toEqual(testData);
    expect(getDuration).toBeLessThan(setDuration); // Get should be faster than set
    expect(getDuration).toBeLessThan(10); // Should be very fast (< 10ms)
  });

  it('should handle high-volume cache operations', async () => {
    const startTime = Date.now();
    const operations = [];

    // Perform 100 cache operations
    for (let i = 0; i < 100; i++) {
      const key = `bulk-test-${i}`;
      const data = {
        index: i,
        blockData: `block-data-${i}`,
        timestamp: Date.now(),
      };

      operations.push(
        cacheManager.set(key, data).then(() =>
          cacheManager.get(key)
        )
      );
    }

    const results = await Promise.all(operations);
    const totalDuration = Date.now() - startTime;

    expect(results).toHaveLength(100);
    expect(totalDuration).toBeLessThan(1000); // Should complete in under 1 second
    expect(totalDuration / 100).toBeLessThan(10); // Average < 10ms per operation
  });

  it('should verify cache TTL behavior', async () => {
    const shortTtlKey = 'short-ttl-test';
    const testData = { test: 'data', timestamp: Date.now() };

    // Set with very short TTL (100ms)
    await cacheManager.set(shortTtlKey, testData, 100);

    // Should be available immediately
    const immediate = await cacheManager.get(shortTtlKey);
    expect(immediate).toEqual(testData);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be expired
    const expired = await cacheManager.get(shortTtlKey);
    expect(expired).toBeUndefined();
  });

  it('should measure cache memory efficiency', async () => {
    const baselineMemory = process.memoryUsage().heapUsed;
    
    // Store 1000 items
    for (let i = 0; i < 1000; i++) {
      await cacheManager.set(`memory-test-${i}`, {
        id: i,
        data: `test-data-${i}`,
        metadata: {
          created: Date.now(),
          type: 'test',
        },
      });
    }

    const afterCacheMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = afterCacheMemory - baselineMemory;

    // Memory increase should be reasonable (< 50MB for 1000 small objects)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    // Verify all items are cached
    const randomKey = `memory-test-${Math.floor(Math.random() * 1000)}`;
    const randomItem = await cacheManager.get(randomKey);
    expect(randomItem).toBeDefined();
  });

  it('should test concurrent cache access', async () => {
    const concurrentKey = 'concurrent-test';
    const testData = {
      blockNumber: 987654321,
      data: 'concurrent-access-test',
      timestamp: Date.now(),
    };

    // Set initial data
    await cacheManager.set(concurrentKey, testData);

    // Perform 50 concurrent reads
    const startTime = Date.now();
    const concurrentReads = Array(50).fill(null).map(() =>
      cacheManager.get(concurrentKey)
    );

    const results = await Promise.all(concurrentReads);
    const duration = Date.now() - startTime;

    // All reads should return the same data
    results.forEach(result => {
      expect(result).toEqual(testData);
    });

    // All concurrent reads should complete quickly
    expect(duration).toBeLessThan(500); // < 500ms for 50 concurrent reads
  });

  it('should verify cache store type and capabilities', async () => {
    // Test basic cache operations
    await cacheManager.set('capability-test', { test: true });
    const result = await cacheManager.get('capability-test');
    expect(result).toEqual({ test: true });

    // Test cache deletion
    await cacheManager.del('capability-test');
    const deleted = await cacheManager.get('capability-test');
    expect(deleted).toBeUndefined();

    // Test cache reset
    await cacheManager.set('reset-test-1', 'data1');
    await cacheManager.set('reset-test-2', 'data2');
    await cacheManager.reset();
    
    const afterReset1 = await cacheManager.get('reset-test-1');
    const afterReset2 = await cacheManager.get('reset-test-2');
    expect(afterReset1).toBeUndefined();
    expect(afterReset2).toBeUndefined();
  });
});
