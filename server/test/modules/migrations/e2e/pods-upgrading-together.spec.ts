/**
 * Covers: migration-helpers/run-all-migrations.ts, migration-locks.ts (pods racing on one database)
 * @group database
 */
import { DataSource } from 'typeorm';
import { HELD_MIGRATION_LOCKS_SQL } from 'src/migration-helpers/migration-locks';
import {
  createScratchDatabase,
  dropScratchDatabase,
  PodOutcome,
  postgres,
  spawnPod,
  waitFor,
  watchActiveLock,
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
    it('should finish every pod successfully, including the ones that had to wait', () => {
      expect(pods.map(({ podId, exitCode }) => ({ podId, exitCode }))).toEqual([
        { podId: 'pod-1', exitCode: 0 },
        { podId: 'pod-2', exitCode: 0 },
        { podId: 'pod-3', exitCode: 0 },
      ]);
      expect(pods.map(({ result }) => result?.error)).toEqual([null, null, null]);
    });

    it('should log that the other pods are waiting, not failing', () => {
      const waiting = pods.filter(({ stdout }) => stdout.includes('Another pod is running migrations'));

      expect(waiting.length).toBe(POD_COUNT - 1);
      waiting.forEach(({ stdout }) => {
        expect(stdout).toContain('This pod will NOT exit.');
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
   */
  describe('with NODE_ENV=production: the same result outside test mode', () => {
    const productionDatabase = `tooljet_migration_gate_prod_${process.pid}`;
    let productionPods: PodOutcome[];

    beforeAll(async () => {
      await createScratchDatabase(productionDatabase);
      const startAt = Date.now() + 8000;
      productionPods = await Promise.all(
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
    }, 180_000);

    afterAll(async () => {
      await dropScratchDatabase(productionDatabase);
    }, 60_000);

    it('should still start every pod successfully', () => {
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

    it('should still make the second pod wait for the first instead of exiting', () => {
      const migrated = productionPods.filter(({ stdout }) => stdout.includes('1 migration(s) pending'));
      const waited = productionPods.filter(({ stdout }) => stdout.includes('Another pod is running migrations'));

      expect(migrated).toHaveLength(1);
      expect(waited).toHaveLength(1);
      expect(waited[0].stdout).toContain('This pod will NOT exit.');
      expect(waited[0].stdout).toContain('No schema or data migrations pending');
    });
  });

  describe('pausing API traffic during the upgrade', () => {
    it('should hold the lock that pauses API traffic while the migration runs', () => {
      expect(activeLockSamples.filter(Boolean).length).toBeGreaterThan(0);
    });

    it('should release both migration locks once migrations finish', async () => {
      expect(await scratch.query(HELD_MIGRATION_LOCKS_SQL)).toEqual([{ running: false, migrating: false }]);
    });

    it('should not pause API traffic from the pods that had no migrations to run', () => {
      const noWork = pods.filter(({ stdout }) => stdout.includes('No schema or data migrations pending'));

      noWork.forEach(({ stdout }) => expect(stdout).toContain('not cutting API traffic for this boot'));
      // Two pods found nothing; had either taken the lock, the samples would show it after the run.
      expect(activeLockSamples[activeLockSamples.length - 1]).toBe(false);
    });

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
