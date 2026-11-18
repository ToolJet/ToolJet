import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp } from 'test-helper';
import { ConcurrencyLimiter } from '@modules/workflows/admission/concurrency-limiter';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared slots with leases (Redis): at most N holders per scope across all pods, and a holder that
 * stops renewing loses its slot once the lease lapses.
 *
 * @group workflows
 */
describe('ConcurrencyLimiter', () => {
  let app: INestApplication;
  let limiter: ConcurrencyLimiter;
  let scopeCounter = 0;
  const scope = () => `test-scope-${process.pid}-${scopeCounter++}`;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    limiter = app.get(ConcurrencyLimiter, { strict: false });
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('acquire | Take a slot', () => {
    it('should grant up to max holders and refuse the next', async () => {
      const s = scope();

      const leases = [];
      for (const holder of ['a', 'b', 'c']) leases.push(await limiter.acquire(s, holder, 2, 60_000));

      expect(leases.map((lease) => lease !== null)).toEqual([true, true, false]);
      expect(await limiter.held(s)).toBe(2);
    });

    it('should never let concurrent acquirers overshoot', async () => {
      const s = scope();

      const leases = await Promise.all(Array.from({ length: 20 }, (_, i) => limiter.acquire(s, `h${i}`, 3, 60_000)));

      expect(leases.filter(Boolean)).toHaveLength(3);
    });

    it('should let the same holder acquire again without taking a second slot', async () => {
      const s = scope();
      await limiter.acquire(s, 'a', 1, 60_000);

      expect(await limiter.acquire(s, 'a', 1, 60_000)).not.toBeNull();
      expect(await limiter.held(s)).toBe(1);
    });
  });

  describe('release | Give the slot back', () => {
    it('should free the slot for the next holder', async () => {
      const s = scope();
      const lease = await limiter.acquire(s, 'a', 1, 60_000);
      expect(await limiter.acquire(s, 'b', 1, 60_000)).toBeNull();

      await lease.release();

      expect(await limiter.acquire(s, 'b', 1, 60_000)).not.toBeNull();
    });
  });

  describe('renew | Keep the slot while working', () => {
    it('should free a slot whose holder stopped renewing once the lease lapses', async () => {
      const s = scope();
      await limiter.acquire(s, 'dead-pod', 1, 150);

      await sleep(250);

      expect(await limiter.acquire(s, 'b', 1, 60_000)).not.toBeNull();
    });

    it('should keep a renewed lease past its first expiry', async () => {
      const s = scope();
      const lease = await limiter.acquire(s, 'a', 1, 300);

      await sleep(150);
      expect(await lease.renew()).toBe(true);
      await sleep(200);

      expect(await limiter.acquire(s, 'b', 1, 60_000)).toBeNull();
    });

    it('should report a lapsed lease when renewing', async () => {
      const s = scope();
      const lease = await limiter.acquire(s, 'a', 1, 100);

      await sleep(200);

      expect(await lease.renew()).toBe(false);
    });
  });
});
