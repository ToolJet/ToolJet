/** @group database */
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { RedisService } from '@modules/redis/service';
import { MigrationGateMiddleware } from '@modules/app/middlewares/migration-gate.middleware';
import { MIGRATION_IN_PROGRESS_KEY } from 'src/migration-helpers/migration-status';
import { MigrationStatusFlag } from 'src/migration-helpers/migration-status-flag';
import {
  createScratchDatabase,
  dropScratchDatabase,
  postgres,
  runPod,
  spawnPod,
  TEST_REDIS_DB,
  waitFor,
} from '../fixtures/concurrent-pods/harness';

/**
 * The Redis half of the upgrade gate, against a real Redis.
 *
 * The unit specs drive the flag and the middleware through fakes. These prove the two halves
 * actually agree over the wire, and that every Redis failure mode an operator can hit — down,
 * black-holed, pod killed mid-migration, gate switched off — leaves the deploy working and the
 * key non-leaking.
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

/** Long enough to catch a pod mid-migration and signal it. */
const LONG_MIGRATION_SECONDS = 25;

function buildResponse() {
  const res = {
    statusCode: null as number | null,
    body: null as Record<string, unknown> | null,
    setHeader: jest.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

/** Drives the real middleware the way Express would, returning what the caller would see. */
async function callApi(middleware: MigrationGateMiddleware, path = '/api/apps') {
  const res = buildResponse();
  let passedThrough = false;
  await middleware.use({ path, originalUrl: path, method: 'GET' } as Request, res as unknown as Response, () => {
    passedThrough = true;
  });
  return { passedThrough, statusCode: res.statusCode, body: res.body };
}

describe('Upgrade gate over a real Redis', () => {
  let redis: Redis;
  let databases: string[] = [];

  const scratchDatabase = async (suffix: string) => {
    const name = `tooljet_redis_gate_${process.pid}_${suffix}`;
    databases.push(name);
    return createScratchDatabase(name);
  };

  beforeAll(async () => {
    redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, db: Number(TEST_REDIS_DB) });
  });

  beforeEach(async () => {
    await redis.del(MIGRATION_IN_PROGRESS_KEY);
  });

  afterAll(async () => {
    await redis?.del(MIGRATION_IN_PROGRESS_KEY);
    await redis?.quit();
    await Promise.all(databases.map(dropScratchDatabase));
    databases = [];
  }, 120_000);

  describe('the migrator and a serving pod agree over the wire', () => {
    let redisService: RedisService;
    let middleware: MigrationGateMiddleware;
    let flag: MigrationStatusFlag;

    beforeAll(() => {
      // The production RedisService, pointed at the test db the same way a pod would be.
      process.env.REDIS_DB = TEST_REDIS_DB;
      redisService = new RedisService({ log: jest.fn(), warn: jest.fn(), error: jest.fn() } as never);
      redisService.onModuleInit();
      middleware = new MigrationGateMiddleware(redisService, {
        warn: jest.fn(),
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger);
      flag = MigrationStatusFlag.create({ REDIS_HOST, REDIS_PORT: String(REDIS_PORT), REDIS_DB: TEST_REDIS_DB });
    });

    afterAll(async () => {
      await flag?.release();
      await flag?.close();
      redisService?.onModuleDestroy();
      delete process.env.REDIS_DB;
    });

    it('should start answering 503 once the migrator raises the flag', async () => {
      expect(await callApi(middleware)).toMatchObject({ passedThrough: true });

      await flag.acquire();

      const gated = await waitFor(
        'the middleware to see the flag',
        () => callApi(middleware),
        (call) => !call.passedThrough,
        { timeoutMs: 5000 }
      );
      expect(gated).toMatchObject({
        passedThrough: false,
        statusCode: 503,
        body: expect.objectContaining({ code: 'MIGRATION_IN_PROGRESS' }),
      });
    });

    it('should resume serving once the migrator clears it', async () => {
      await flag.acquire();
      await waitFor(
        'the gate to engage',
        () => callApi(middleware),
        (call) => !call.passedThrough,
        {
          timeoutMs: 5000,
        }
      );

      await flag.release();

      const resumed = await waitFor(
        'the middleware to see the flag cleared',
        () => callApi(middleware),
        (call) => call.passedThrough,
        { timeoutMs: 5000 }
      );
      expect(resumed.passedThrough).toBe(true);
    });

    it('should never gate the health probe, even mid-upgrade', async () => {
      await flag.acquire();
      await waitFor(
        'the gate to engage',
        () => callApi(middleware),
        (call) => !call.passedThrough,
        {
          timeoutMs: 5000,
        }
      );

      expect(await callApi(middleware, '/api/health')).toMatchObject({ passedThrough: true });
    });
  });

  describe('a Redis outage never blocks a deploy', () => {
    it('should migrate successfully when Redis refuses connections, warning that traffic is not cut', async () => {
      const database = await scratchDatabase('down');

      const pod = await runPod({
        podId: 'pod-redis-down',
        database,
        migrationSleepSeconds: 1,
        // Nothing listens here, so the connection is refused rather than dropped.
        env: { REDIS_HOST: '127.0.0.1', REDIS_PORT: '6399' },
      });

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(pod.stdout).toContain('API traffic will NOT be cut');
      expect(pod.stdout).toContain('Committed schema + data migrations');
      expect(await migrationRan(database)).toBe(true);
    }, 120_000);

    it('should not stall the deploy when Redis is black-holed rather than refusing', async () => {
      const database = await scratchDatabase('blackhole');

      const pod = await runPod({
        podId: 'pod-redis-blackhole',
        database,
        migrationSleepSeconds: 1,
        // TEST-NET-1: routable nowhere, so packets are dropped and ioredis waits on its
        // connect timeout. Unbounded, this cost ~40s per pod boot.
        env: { REDIS_HOST: '192.0.2.1', REDIS_PORT: '6379' },
      });

      expect(pod.exitCode).toBe(0);
      expect(pod.stdout).toMatch(/timed out after \d+ms/);
      expect(pod.result.durationMs).toBeLessThan(25_000);
      expect(await migrationRan(database)).toBe(true);
    }, 120_000);
  });

  describe('the flag does not leak', () => {
    it('should clear the flag when the orchestrator stops a migrating pod with SIGTERM', async () => {
      const database = await scratchDatabase('sigterm');
      const pod = spawnPod({ podId: 'pod-sigterm', database, migrationSleepSeconds: LONG_MIGRATION_SECONDS });

      await waitFor('the flag to be raised', () => redis.get(MIGRATION_IN_PROGRESS_KEY), Boolean, {
        timeoutMs: 60_000,
      });
      pod.child.kill('SIGTERM');
      const outcome = await pod.done;

      expect(await redis.get(MIGRATION_IN_PROGRESS_KEY)).toBeNull();
      expect(outcome.exitCode).not.toBe(0);
    }, 180_000);

    it('should leave a SIGKILLed pod a key that still expires on its own', async () => {
      const database = await scratchDatabase('sigkill');
      const pod = spawnPod({
        podId: 'pod-sigkill',
        database,
        migrationSleepSeconds: LONG_MIGRATION_SECONDS,
        env: { MIGRATION_FLAG_TTL_MINUTES: '1' },
      });

      await waitFor('the flag to be raised', () => redis.get(MIGRATION_IN_PROGRESS_KEY), Boolean, {
        timeoutMs: 60_000,
      });
      // SIGKILL cannot be trapped, so the pod cannot clear its own key. The TTL is the backstop.
      pod.child.kill('SIGKILL');
      await pod.done;

      const ttl = await redis.ttl(MIGRATION_IN_PROGRESS_KEY);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    }, 180_000);
  });

  describe('the opt-out', () => {
    it('should never write the key when DISABLE_MIGRATION_TRAFFIC_GATE is set', async () => {
      const database = await scratchDatabase('disabled');
      const pod = spawnPod({
        podId: 'pod-gate-off',
        database,
        migrationSleepSeconds: 4,
        env: { DISABLE_MIGRATION_TRAFFIC_GATE: 'true' },
      });

      const samples: (string | null)[] = [];
      const poll = setInterval(() => void redis.get(MIGRATION_IN_PROGRESS_KEY).then((v) => samples.push(v)), 100);
      const outcome = await pod.done;
      clearInterval(poll);

      expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(samples.filter(Boolean)).toEqual([]);
      expect(outcome.stdout).toContain('Skipping the upgrade gate — disabled by env variable');
      expect(outcome.stdout).toContain('DISABLE_MIGRATION_TRAFFIC_GATE=true');
      expect(await migrationRan(database)).toBe(true);
    }, 120_000);
  });
});

/** Proves the migration body ran, not just that the pod exited cleanly. */
async function migrationRan(database: string): Promise<boolean> {
  const connection = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  try {
    const rows = await connection.query('SELECT 1 FROM migration_witness');
    return rows.length === 1;
  } finally {
    await connection.destroy().catch(() => undefined);
  }
}
