/** @group database */
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { MIGRATION_IN_PROGRESS_KEY } from 'src/migration-helpers/migration-status';
import {
  createScratchDatabase,
  dropScratchDatabase,
  PodOutcome,
  postgres,
  runPod,
  TEST_REDIS_DB,
} from '../fixtures/concurrent-pods/harness';

/**
 * The rolling-upgrade scenario, with real processes.
 *
 * Several pods boot at the same instant against one database. The first takes the
 * `migrations` table lock and runs a slow migration; the rest must wait it out instead of
 * timing out and exiting — the crash loop this whole mechanism exists to prevent.
 *
 * Everything here is real: real PostgreSQL, real Redis, real OS processes, and the real
 * `run()` from `src/migration-helpers/run-all-migrations.ts`. Only the migration set is a
 * fixture (the two production lock sentinels plus one slow migration), and only the database
 * is a scratch one, so the suite is fast and touches nothing else.
 */

const POD_COUNT = 3;
const MIGRATION_SLEEP_SECONDS = 6;

const scratchDatabase = `tooljet_migration_gate_${process.pid}`;

/** Samples the upgrade flag throughout the run, so the spec can see it raised AND cleared. */
function watchFlag(redis: Redis) {
  const samples: (string | null)[] = [];
  const timer = setInterval(() => {
    void redis.get(MIGRATION_IN_PROGRESS_KEY).then((value) => samples.push(value));
  }, 100);
  return { samples, stop: () => clearInterval(timer) };
}

describe('Concurrent pod boots | rolling upgrade against one database', () => {
  let scratch: DataSource;
  let redis: Redis;
  let pods: PodOutcome[];
  let flagSamples: (string | null)[];

  beforeAll(async () => {
    await createScratchDatabase(scratchDatabase);

    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      db: Number(TEST_REDIS_DB),
    });
    await redis.del(MIGRATION_IN_PROGRESS_KEY);

    const watcher = watchFlag(redis);
    // One shared release instant; the generous lead time absorbs ts-node start-up.
    const startAt = Date.now() + 12_000;
    pods = await Promise.all(
      Array.from({ length: POD_COUNT }, (_unused, index) =>
        runPod({
          podId: `pod-${index + 1}`,
          database: scratchDatabase,
          startAt,
          migrationSleepSeconds: MIGRATION_SLEEP_SECONDS,
        })
      )
    );
    watcher.stop();
    flagSamples = watcher.samples;

    scratch = await new DataSource({ type: 'postgres', ...postgres, database: scratchDatabase }).initialize();
  }, 180_000);

  afterAll(async () => {
    await scratch?.destroy().catch(() => undefined);
    await redis?.del(MIGRATION_IN_PROGRESS_KEY);
    await redis?.quit();
    await dropScratchDatabase(scratchDatabase);
  }, 60_000);

  describe('no pod crash-loops', () => {
    it('should exit 0 from every pod, including the ones that had to wait', () => {
      expect(pods.map(({ podId, exitCode }) => ({ podId, exitCode }))).toEqual([
        { podId: 'pod-1', exitCode: 0 },
        { podId: 'pod-2', exitCode: 0 },
        { podId: 'pod-3', exitCode: 0 },
      ]);
      expect(pods.map(({ result }) => result?.error)).toEqual([null, null, null]);
    });

    it('should report the blocked pods waiting rather than failing', () => {
      const waiting = pods.filter(({ stdout }) => stdout.includes('Another pod is running migrations'));

      expect(waiting.length).toBe(POD_COUNT - 1);
      waiting.forEach(({ stdout }) => {
        expect(stdout).toContain('This pod will NOT exit.');
        // Queued on the advisory lock, which is taken before the pending list is read.
        expect(stdout).toContain('Another pod holds the ToolJet migration advisory lock');
        expect(stdout).toContain('Lock released');
      });
    });

    it('should keep the waiting pods alive for the whole migration instead of exiting early', () => {
      const waiting = pods.filter(({ stdout }) => stdout.includes('Another pod is running migrations'));

      waiting.forEach(({ result }) => {
        expect(result.durationMs).toBeGreaterThanOrEqual(MIGRATION_SLEEP_SECONDS * 1000);
      });
    });
  });

  describe('the migration runs exactly once', () => {
    it('should execute the slow migration body a single time across all pods', async () => {
      const witnesses = await scratch.query('SELECT pod FROM migration_witness');

      expect(witnesses).toHaveLength(1);
    });

    it('should record it once in the migrations table', async () => {
      const [{ count }] = await scratch.query(
        `SELECT count(*)::int FROM migrations WHERE name = 'SlowWitnessedMigration1700000000001'`
      );

      expect(count).toBe(1);
    });

    it('should have exactly one pod report it as pending, and the rest find nothing to do', () => {
      const migrated = pods.filter(({ stdout }) => stdout.includes('1 migration(s) pending'));
      const noWork = pods.filter(({ stdout }) => stdout.includes('No schema or data migrations pending'));

      expect(migrated).toHaveLength(1);
      expect(noWork).toHaveLength(POD_COUNT - 1);
    });
  });

  /**
   * The specs above run pods with NODE_ENV=test, which keeps them hermetic (`getEnvVars()` then
   * reads `.env.test`). Production pods do not. NODE_ENV must not be load-bearing for any of the
   * coordination, so this repeats the race under a production-like value.
   *
   * Deliberately asserts nothing about Redis: a developer's or CI's `.env` may point REDIS_* at
   * another instance, and an env-file key beats an exported variable (see MIGRATION_FLOW.md §1).
   * Migrations succeed regardless of Redis, so these assertions hold either way.
   */
  describe('without NODE_ENV=test | coordination is not an artifact of test mode', () => {
    const productionDatabase = `tooljet_migration_gate_prod_${process.pid}`;
    let productionPods: PodOutcome[];

    beforeAll(async () => {
      await createScratchDatabase(productionDatabase);
      const startAt = Date.now() + 8000;
      productionPods = await Promise.all(
        ['prod-pod-1', 'prod-pod-2'].map((podId) =>
          runPod({
            podId,
            database: productionDatabase,
            startAt,
            migrationSleepSeconds: 5,
            env: { NODE_ENV: 'production' },
          })
        )
      );
    }, 180_000);

    afterAll(async () => {
      await dropScratchDatabase(productionDatabase);
    }, 60_000);

    it('should still let every pod boot cleanly', () => {
      expect(productionPods.map(({ exitCode }) => exitCode)).toEqual([0, 0]);
      expect(productionPods.map(({ result }) => result?.error)).toEqual([null, null]);
    });

    it('should still run the migration exactly once', async () => {
      const connection = await new DataSource({
        type: 'postgres',
        ...postgres,
        database: productionDatabase,
      }).initialize();
      try {
        expect(await connection.query('SELECT 1 FROM migration_witness')).toHaveLength(1);
      } finally {
        await connection.destroy().catch(() => undefined);
      }
    });

    it('should still make the loser wait on the advisory lock rather than exit', () => {
      const migrated = productionPods.filter(({ stdout }) => stdout.includes('1 migration(s) pending'));
      const waited = productionPods.filter(({ stdout }) => stdout.includes('Another pod is running migrations'));

      expect(migrated).toHaveLength(1);
      expect(waited).toHaveLength(1);
      expect(waited[0].stdout).toContain('Another pod holds the ToolJet migration advisory lock');
      expect(waited[0].stdout).toContain('This pod will NOT exit.');
      expect(waited[0].stdout).toContain('No schema or data migrations pending');
    });
  });

  describe('the upgrade gate', () => {
    it('should raise MIGRATION_IN_PROGRESS while the migration is running', () => {
      expect(flagSamples.filter(Boolean).length).toBeGreaterThan(0);
    });

    it('should name the owning pod in the flag, so operators can see who is migrating', () => {
      const [owner] = flagSamples.filter(Boolean);

      expect(owner).toMatch(/^.+:\d+:[0-9a-f]{8}$/);
    });

    it('should clear the flag once migrations finish, leaving nothing to leak', async () => {
      expect(await redis.get(MIGRATION_IN_PROGRESS_KEY)).toBeNull();
    });

    it('should not raise the gate on the pods that had no migrations to run', () => {
      const noWork = pods.filter(({ stdout }) => stdout.includes('No schema or data migrations pending'));

      noWork.forEach(({ stdout }) => {
        expect(stdout).toContain('not cutting API traffic for this boot');
        expect(stdout).not.toContain('Upgrade gate ON');
      });
    });
  });
});
