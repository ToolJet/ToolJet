/**
 * Covers: migration-helpers/run-all-migrations.ts, migration-locks.ts (pods racing on one database)
 * @group database
 */
import { DataSource } from 'typeorm';
import { HELD_MIGRATION_LOCKS_SQL, MIGRATION_ACTIVE_LOCK_KEY } from 'src/migration-helpers/migration-locks';
import {
  createScratchDatabase,
  dropScratchDatabase,
  PodOutcome,
  postgres,
  spawnPod,
  waitFor,
  watchActiveLock,
  withScratchConnection,
} from '../fixtures/harness';

const POD_COUNT = 3;
const MIGRATION_SLEEP_SECONDS = 6;

const scratchDatabase = `tooljet_migration_gate_${process.pid}`;

describe('Several pods upgrading the same database at once (a rolling upgrade)', () => {
  let scratch: DataSource;
  let pods: PodOutcome[];
  let activeLockSamples: boolean[];

  beforeAll(async () => {
    await createScratchDatabase(scratchDatabase);
    scratch = await new DataSource({ type: 'postgres', ...postgres, database: scratchDatabase }).initialize();

    const watcher = watchActiveLock(scratch);
    // Released at the same instant; the generous lead time absorbs ts-node start-up.
    const startAt = Date.now() + 12_000;
    pods = await Promise.all(
      Array.from(
        { length: POD_COUNT },
        (_unused, index) =>
          spawnPod({
            podId: `pod-${index + 1}`,
            database: scratchDatabase,
            startAt,
            migrationSleepSeconds: MIGRATION_SLEEP_SECONDS,
          }).done
      )
    );
    watcher.stop();
    activeLockSamples = watcher.samples;
  }, 180_000);

  afterAll(async () => {
    await scratch?.destroy().catch(() => undefined);
    await dropScratchDatabase(scratchDatabase);
  }, 60_000);

  describe('no pod crashes and restarts', () => {
    // The migrating pod sleeps that long, and the rest wait on its lock: no pod boots before the schema is ready.
    it('should finish every pod successfully, only once the migration is done', () => {
      expect(pods.map(({ podId, exitCode }) => ({ podId, exitCode }))).toEqual([
        { podId: 'pod-1', exitCode: 0 },
        { podId: 'pod-2', exitCode: 0 },
        { podId: 'pod-3', exitCode: 0 },
      ]);
      expect(pods.map(({ result }) => result?.error)).toEqual([null, null, null]);
      pods.forEach(({ result }) => expect(result.durationMs).toBeGreaterThanOrEqual(MIGRATION_SLEEP_SECONDS * 1000));
    });
  });

  describe('the migration runs exactly once', () => {
    it('should run the migration once across all pods', async () => {
      const witnesses = await scratch.query('SELECT pod FROM migration_witness');

      expect(witnesses).toHaveLength(1);
    });

    it('should record it once in the migrations table', async () => {
      const [{ count }] = await scratch.query(
        `SELECT count(*)::int FROM migrations WHERE name = 'SlowWitnessedMigration1790700000001'`
      );

      expect(count).toBe(1);
    });
  });

  /**
   * The specs above run pods with NODE_ENV=test, which keeps them hermetic (`getEnvVars()` then
   * reads `.env.test`). Production pods do not. NODE_ENV must not be load-bearing for any of the
   * coordination, so this repeats the race under a production-like value.
   */
  describe('with NODE_ENV=production: the same result outside test mode', () => {
    const productionDatabase = `tooljet_migration_gate_prod_${process.pid}`;

    afterAll(async () => {
      await dropScratchDatabase(productionDatabase);
    }, 60_000);

    it('should still start both pods once the migration is done, and run it exactly once', async () => {
      await createScratchDatabase(productionDatabase);
      const startAt = Date.now() + 8000;
      const productionPods = await Promise.all(
        ['prod-pod-1', 'prod-pod-2'].map(
          (podId) =>
            spawnPod({
              podId,
              database: productionDatabase,
              startAt,
              migrationSleepSeconds: 5,
              env: { NODE_ENV: 'production' },
            }).done
        )
      );

      expect(productionPods.map(({ exitCode, result }) => ({ exitCode, error: result?.error }))).toEqual([
        { exitCode: 0, error: null },
        { exitCode: 0, error: null },
      ]);
      productionPods.forEach(({ result }) => expect(result.durationMs).toBeGreaterThanOrEqual(5000));
      expect(
        await withScratchConnection(productionDatabase, (db) => db.query('SELECT 1 FROM migration_witness'))
      ).toHaveLength(1);
    }, 180_000);
  });

  describe('pausing API traffic during the upgrade', () => {
    it('should hold the lock that pauses API traffic while the migration runs', () => {
      expect(activeLockSamples.filter(Boolean).length).toBeGreaterThan(0);
    });

    it('should release both migration locks once migrations finish', async () => {
      expect(await scratch.query(HELD_MIGRATION_LOCKS_SQL)).toEqual([{ running: false, migrating: false }]);
    });

    it('should not pause API traffic from a pod that has no migrations to run', async () => {
      // A pod that took the active lock would wait here behind this session.
      const holder = scratch.createQueryRunner();
      await holder.connect();
      await holder.query('SELECT pg_advisory_lock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
      const pod = spawnPod({ podId: 'pod-no-work', database: scratchDatabase });
      try {
        const outcome = await Promise.race([
          pod.done,
          new Promise<'hung'>((resolveHung) => setTimeout(() => resolveHung('hung'), 30_000)),
        ]);

        expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
      } finally {
        pod.child.kill('SIGKILL');
        await holder.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
        await holder.release();
      }
    }, 60_000);

    it('should resume API traffic as soon as a migrating pod is killed, without waiting for a timeout', async () => {
      const database = `tooljet_migration_gate_kill_${process.pid}`;
      await createScratchDatabase(database);
      const connection = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
      try {
        const pod = spawnPod({ podId: 'pod-sigkill', database, migrationSleepSeconds: 25 });
        await waitFor(
          'the active lock',
          () => connection.query(HELD_MIGRATION_LOCKS_SQL),
          ([{ migrating }]) => migrating,
          { timeoutMs: 60_000 }
        );

        pod.child.kill('SIGKILL');
        await pod.done;

        await waitFor(
          'the locks to go',
          () => connection.query(HELD_MIGRATION_LOCKS_SQL),
          ([{ running, migrating }]) => !running && !migrating,
          { timeoutMs: 5000 }
        );

        expect(await connection.query('SELECT 1 FROM migration_witness').catch(() => [])).toHaveLength(0);
      } finally {
        await connection.destroy().catch(() => undefined);
        await dropScratchDatabase(database);
      }
    }, 180_000);
  });
});
