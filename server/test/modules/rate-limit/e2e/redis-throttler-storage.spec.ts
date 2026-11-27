import Redis from 'ioredis';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { RedisRateLimiter } from '@modules/rate-limit/redis-rate-limiter';
import { RedisThrottlerStorage } from '@modules/rate-limit/redis-throttler-storage';

const THROTTLER = 'default';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Talks to the real Redis the e2e environment provides (REDIS_HOST / REDIS_PORT). */
const redisClient = () =>
  new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') });

/** A client that can never reach Redis, to exercise the fallback. */
const unreachableClient = () =>
  new Redis({ host: '127.0.0.1', port: 1, maxRetriesPerRequest: 0, enableOfflineQueue: false, lazyConnect: true });

const storageWith = (client: Redis) => new RedisThrottlerStorage(new RedisRateLimiter({ getClient: () => client }));

let keyCounter = 0;
const uniqueKey = () => `spec-${process.pid}-${Date.now()}-${keyCounter++}`;

/**
 * @group platform
 */
describe('RedisThrottlerStorage', () => {
  let client: Redis;
  let storage: RedisThrottlerStorage;

  beforeAll(() => {
    client = redisClient();
    storage = storageWith(client);
  });

  afterAll(async () => {
    await client.quit();
  });

  describe('counting and blocking', () => {
    it('should count hits within the window and stay unblocked up to the limit', async () => {
      const key = uniqueKey();

      const records = [];
      for (let i = 0; i < 3; i++) records.push(await storage.increment(key, 60_000, 3, 60_000, THROTTLER));

      expect(records.map((record) => record.totalHits)).toEqual([1, 2, 3]);
      expect(records.every((record) => !record.isBlocked)).toBe(true);
      expect(records[2].timeToExpire).toBeGreaterThan(0);
      expect(records[2].timeToExpire).toBeLessThanOrEqual(60);
    });

    it('should block the hit that exceeds the limit, for the block duration', async () => {
      const key = uniqueKey();
      for (let i = 0; i < 3; i++) await storage.increment(key, 60_000, 3, 30_000, THROTTLER);

      const record = await storage.increment(key, 60_000, 3, 30_000, THROTTLER);

      expect(record.isBlocked).toBe(true);
      expect(record.timeToBlockExpire).toBeGreaterThan(0);
      expect(record.timeToBlockExpire).toBeLessThanOrEqual(30);
    });

    it('should keep refusing while blocked, then start counting from one when the block ends', async () => {
      const key = uniqueKey();
      for (let i = 0; i < 3; i++) await storage.increment(key, 60_000, 2, 300, THROTTLER);

      expect((await storage.increment(key, 60_000, 2, 300, THROTTLER)).isBlocked).toBe(true);
      await sleep(400);
      const afterBlock = await storage.increment(key, 60_000, 2, 300, THROTTLER);

      expect(afterBlock).toMatchObject({ isBlocked: false, totalHits: 1 });
    });

    it('should forget each hit once it is older than the window (sliding window)', async () => {
      const key = uniqueKey();
      await storage.increment(key, 300, 5, 300, THROTTLER);
      await storage.increment(key, 300, 5, 300, THROTTLER);
      await sleep(400);

      expect((await storage.increment(key, 300, 5, 300, THROTTLER)).totalHits).toBe(1);
    });

    it('should keep separate counts per throttler name on the same key', async () => {
      const key = uniqueKey();
      await storage.increment(key, 60_000, 5, 60_000, 'short');
      await storage.increment(key, 60_000, 5, 60_000, 'short');

      expect((await storage.increment(key, 60_000, 5, 60_000, 'long')).totalHits).toBe(1);
    });
  });

  describe('across pods', () => {
    it('should share one count between storages on different connections', async () => {
      const otherClient = redisClient();
      const otherPod = storageWith(otherClient);
      const key = uniqueKey();

      await storage.increment(key, 60_000, 2, 60_000, THROTTLER);
      await otherPod.increment(key, 60_000, 2, 60_000, THROTTLER);
      const third = await storage.increment(key, 60_000, 2, 60_000, THROTTLER);

      expect(third.isBlocked).toBe(true);
      await otherClient.quit();
    });

    it('should keep each key in one Redis Cluster hash slot and let it expire', async () => {
      const key = uniqueKey();
      await storage.increment(key, 60_000, 1, 60_000, THROTTLER);
      await storage.increment(key, 60_000, 1, 60_000, THROTTLER);

      const stored = await client.keys(`tj:rl:{*${key}*}*`);
      expect(stored.length).toBeGreaterThan(0);
      for (const storedKey of stored) {
        expect(storedKey).toMatch(/^tj:rl:\{[^}]+\}:/);
        expect(await client.pttl(storedKey)).toBeGreaterThan(0);
      }
    });
  });

  describe('behaves like the library in-memory storage', () => {
    it('should report the same blocked/unblocked sequence for the same hits', async () => {
      const inMemory = new ThrottlerStorageService();
      const key = uniqueKey();

      const ours = [];
      const theirs = [];
      for (let i = 0; i < 6; i++) {
        ours.push((await storage.increment(key, 60_000, 4, 60_000, THROTTLER)).isBlocked);
        theirs.push((await inMemory.increment(key, 60_000, 4, 60_000, THROTTLER)).isBlocked);
      }
      inMemory.onApplicationShutdown();

      expect(ours).toEqual(theirs);
      expect(ours).toEqual([false, false, false, false, true, true]);
    });
  });

  describe('when Redis is unavailable', () => {
    it('should fall back to counting on this pod instead of failing or allowing everything', async () => {
      const offline = storageWith(unreachableClient());
      const key = uniqueKey();

      const records = [];
      for (let i = 0; i < 3; i++) records.push(await offline.increment(key, 60_000, 2, 60_000, THROTTLER));

      expect(records.map((record) => record.isBlocked)).toEqual([false, false, true]);
    });
  });
});
