/** @group database */
import { DataSource } from 'typeorm';
import {
  HELD_MIGRATION_LOCKS_SQL,
  MIGRATION_ADVISORY_LOCK_KEY,
  SKIPPED_EXIT_CODE,
  withMigrationConnectionOptions,
} from 'src/migration-helpers/migrations-table-gate';
import {
  createScratchDatabase,
  dropScratchDatabase,
  PodOutcome,
  postgres,
  runPod,
  spawnPod,
  waitFor,
} from '../fixtures/concurrent-pods/harness';

const POD_COUNT = 3;
const MIGRATION_SLEEP_SECONDS = 6;

const scratchDatabase = `tooljet_migration_gate_${process.pid}`;

interface HeldLocks {
  running: boolean;
  migrating: boolean;
}

async function withScratchConnection<T>(database: string, fn: (db: DataSource) => Promise<T>): Promise<T> {
  const db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  try {
    return await fn(db);
  } finally {
    await db.destroy().catch(() => undefined);
  }
}

const heldLocks = async (connection: DataSource): Promise<HeldLocks> =>
  (await connection.query(HELD_MIGRATION_LOCKS_SQL))[0];

/** Samples the active lock throughout the run, so the spec can see it taken AND released. */
function watchActiveLock(connection: DataSource) {
  const samples: boolean[] = [];
  const timer = setInterval(() => {
    void heldLocks(connection).then(({ migrating }) => samples.push(migrating));
  }, 100);
  return { samples, stop: () => clearInterval(timer) };
}

describe('Concurrent pod boots | rolling upgrade against one database', () => {
  let scratch: DataSource;
  let pods: PodOutcome[];
  let activeLockSamples: boolean[];

  beforeAll(async () => {
    await createScratchDatabase(scratchDatabase);
    scratch = await new DataSource({ type: 'postgres', ...postgres, database: scratchDatabase }).initialize();

    const watcher = watchActiveLock(scratch);
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
    activeLockSamples = watcher.samples;
  }, 180_000);

  afterAll(async () => {
    await scratch?.destroy().catch(() => undefined);
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
      expect(waited[0].stdout).toContain('This pod will NOT exit.');
      expect(waited[0].stdout).toContain('No schema or data migrations pending');
    });
  });

  describe('the upgrade gate', () => {
    it('should hold the active lock while the migration is running', () => {
      expect(activeLockSamples.filter(Boolean).length).toBeGreaterThan(0);
    });

    it('should release both locks once migrations finish, leaving nothing to leak', async () => {
      expect(await heldLocks(scratch)).toEqual({ running: false, migrating: false });
    });

    it('should not take the active lock on the pods that had no migrations to run', () => {
      const noWork = pods.filter(({ stdout }) => stdout.includes('No schema or data migrations pending'));

      noWork.forEach(({ stdout }) => expect(stdout).toContain('not cutting API traffic for this boot'));
      // Two pods found nothing; had either taken the lock, the samples would show it after the run.
      expect(activeLockSamples[activeLockSamples.length - 1]).toBe(false);
    });

    it('should release the gate the moment a migrating pod is killed, with no expiry to wait out', async () => {
      const database = `tooljet_migration_gate_kill_${process.pid}`;
      await createScratchDatabase(database);
      const connection = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
      try {
        const pod = spawnPod({ podId: 'pod-sigkill', database, migrationSleepSeconds: 25 });
        await waitFor(
          'the active lock',
          () => heldLocks(connection),
          ({ migrating }) => migrating,
          {
            timeoutMs: 60_000,
          }
        );

        pod.child.kill('SIGKILL');
        await pod.done;

        await waitFor(
          'the locks to go',
          () => heldLocks(connection),
          ({ running, migrating }) => !running && !migrating,
          {
            timeoutMs: 5000,
          }
        );
        expect(await connection.query('SELECT 1 FROM migration_witness').catch(() => [])).toHaveLength(0);
      } finally {
        await connection.destroy().catch(() => undefined);
        await dropScratchDatabase(database);
      }
    }, 180_000);
  });

  /** Async mode: schema at boot (`migrateSchemaBeforeBoot`), data in the server-spawned run. */
  describe('MIGRATION_PHASE | schema at boot, data after', () => {
    const phaseDatabase = `tooljet_migration_phase_${process.pid}`;
    let connection: DataSource;

    beforeAll(async () => {
      await createScratchDatabase(phaseDatabase);
      connection = await new DataSource({ type: 'postgres', ...postgres, database: phaseDatabase }).initialize();
    }, 60_000);

    afterAll(async () => {
      await connection?.destroy().catch(() => undefined);
      await dropScratchDatabase(phaseDatabase);
    }, 60_000);

    const phasePod = (
      podId: string,
      phase: string,
      database = phaseDatabase,
      env: Record<string, string> = {},
      { fixtureSet = 'concurrent-pods', migrationSleepSeconds = 0 } = {}
    ) => spawnPod({ podId, database, migrationSleepSeconds, fixtureSet, env: { MIGRATION_PHASE: phase, ...env } });

    it('should apply the schema migrations in the schema phase, and let the next boot skip the lock', async () => {
      const watcher = watchActiveLock(connection);
      const first = await phasePod('schema-1', 'schema', phaseDatabase, {}, { migrationSleepSeconds: 3 }).done;
      watcher.stop();
      const second = await phasePod('schema-2', 'schema').done;

      expect(watcher.samples.filter(Boolean).length).toBeGreaterThan(0);

      expect(first).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(first.stdout).toContain('1 schema migration(s) pending: SlowWitnessedMigration1790700000001');
      expect(first.stdout).toContain('Committed schema migrations.');
      expect(second).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(second.stdout).toContain('No schema migrations pending before boot.');
      expect(await connection.query('SELECT 1 FROM migration_witness')).toHaveLength(1);
      expect(await heldLocks(connection)).toEqual({ running: false, migrating: false });
    }, 120_000);

    it('should run schema and data in separate transactions in the data phase', async () => {
      const pod = await phasePod('data-1', 'data').done;

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(pod.stdout).toContain('Data phase:');
      expect(pod.stdout).toContain('Committed schema and data migrations in separate transactions.');
    }, 120_000);

    it('should refuse an unknown phase', async () => {
      const pod = await phasePod('bad-phase', 'everything').done;

      expect(pod).toMatchObject({ exitCode: 1, result: { error: expect.stringContaining('Unknown MIGRATION_PHASE') } });
    }, 120_000);

    describe('a schema migration that waits on a table lock', () => {
      const blockedDatabase = `tooljet_migration_phase_blocked_${process.pid}`;
      let blocked: DataSource;

      beforeEach(async () => {
        await createScratchDatabase(blockedDatabase);
        blocked = await new DataSource({ type: 'postgres', ...postgres, database: blockedDatabase }).initialize();
        await blocked.query(
          'CREATE TABLE migration_witness (id serial PRIMARY KEY, pod text NOT NULL, ran_at timestamptz)'
        );
      }, 60_000);

      afterEach(async () => {
        await blocked?.destroy().catch(() => undefined);
        await dropScratchDatabase(blockedDatabase);
      }, 60_000);

      /** A released app's long read, holding the table the migration writes to. */
      async function holdTableLock() {
        const holder = blocked.createQueryRunner();
        await holder.connect();
        await holder.startTransaction();
        await holder.query('LOCK TABLE migration_witness IN ACCESS EXCLUSIVE MODE');
        return {
          release: async () => {
            await holder.rollbackTransaction();
            await holder.release();
          },
        };
      }

      it('should roll back and retry until the lock frees, then apply it once', async () => {
        const lock = await holdTableLock();
        const pod = phasePod('blocked-1', 'schema', blockedDatabase, {
          MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '300',
          MIGRATION_SCHEMA_LOCK_RETRIES: '30',
        });
        let stdout = '';
        pod.child.stdout.on('data', (chunk) => (stdout += chunk));
        pod.child.stderr.on('data', (chunk) => (stdout += chunk));
        await waitFor(
          'a lock-timeout retry',
          async () => stdout,
          (out) => out.includes('for a table lock; rolled back'),
          { timeoutMs: 60_000 }
        );
        await lock.release();
        const outcome = await pod.done;

        expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(await blocked.query('SELECT 1 FROM migration_witness')).toHaveLength(1);
      }, 120_000);

      it('should fail the boot once the attempts run out', async () => {
        const lock = await holdTableLock();
        try {
          const outcome = await phasePod('blocked-2', 'schema', blockedDatabase, {
            MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '200',
            MIGRATION_SCHEMA_LOCK_RETRIES: '2',
          }).done;

          expect(outcome).toMatchObject({ exitCode: 1, result: { error: expect.stringContaining('lock timeout') } });
          expect(outcome.stdout).toContain('Retrying (attempt 2 of 2)');
        } finally {
          await lock.release();
        }
      }, 120_000);
    });

    describe('an enum value added in schema and used in data | split-phases fixtures', () => {
      const enumDatabase = `tooljet_migration_enum_${process.pid}`;
      const enumPod = (podId: string, phase = '') =>
        phasePod(podId, phase, enumDatabase, {}, { fixtureSet: 'split-phases' }).done;

      beforeEach(async () => {
        await createScratchDatabase(enumDatabase);
      }, 60_000);

      afterEach(async () => {
        await dropScratchDatabase(enumDatabase);
      }, 60_000);

      const createColorType = () =>
        withScratchConnection(enumDatabase, (db) => db.query(`CREATE TYPE fixture_color AS ENUM ('red')`));

      it('should migrate a fresh database, where the type is created in the same run', async () => {
        const pod = await enumPod('enum-fresh');

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain('targets an enum type created in this run');
      }, 120_000);

      it('should pre-commit the value when the type exists, then run schema and data in one transaction', async () => {
        await createColorType();
        const pod = await enumPod('enum-upgrade');

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain("pre-committed enum value fixture_color.'blue'");
        expect(pod.stdout).toContain('in a single transaction');
      }, 120_000);

      it('should pre-commit the value in the schema phase too', async () => {
        await createColorType();
        const pod = await enumPod('enum-schema', 'schema');

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain("pre-committed enum value fixture_color.'blue'");
      }, 120_000);

      it('should boot a pod at once while another pod runs a long data phase', async () => {
        expect(await enumPod('split-schema', 'schema')).toMatchObject({ exitCode: 0 });
        const dataPod = phasePod(
          'split-data',
          'data',
          enumDatabase,
          {},
          {
            fixtureSet: 'split-phases',
            migrationSleepSeconds: 20,
          }
        );
        let stdout = '';
        dataPod.child.stdout.on('data', (chunk) => (stdout += chunk));
        await waitFor(
          'the data migration to start',
          async () => stdout,
          (out) => out.includes('START UseFixtureColorValue1790700000003'),
          { timeoutMs: 60_000 }
        );

        const booting = await enumPod('split-boot', 'schema');

        expect(booting).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(booting.stdout).toContain('No schema migrations pending before boot.');
        expect(booting.result.durationMs).toBeLessThan(5000);
        expect(await dataPod.done).toMatchObject({ exitCode: 0, result: { error: null } });
      }, 180_000);
    });

    it('should leave the run to the lock holder and exit 75 with MIGRATION_SKIP_IF_LOCKED', async () => {
      const database = `tooljet_migration_skip_${process.pid}`;
      await createScratchDatabase(database);
      try {
        await withScratchConnection(database, async (db) => {
          const holder = db.createQueryRunner();
          await holder.connect();
          try {
            await holder.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
            const pod = await phasePod('skip-1', 'data', database, { MIGRATION_SKIP_IF_LOCKED: 'true' }).done;

            expect(pod).toMatchObject({ exitCode: SKIPPED_EXIT_CODE, result: { error: null } });
            expect(pod.stdout).toContain('leaving the run to it');
            expect(await db.query(`SELECT to_regclass('migration_witness') AS t`)).toEqual([{ t: null }]);
          } finally {
            await holder.release();
          }
        });
      } finally {
        await dropScratchDatabase(database);
      }
    }, 120_000);

    it('should wait for a run that holds the migrations table instead of timing out on its read', async () => {
      const database = `tooljet_migration_table_held_${process.pid}`;
      await createScratchDatabase(database);
      try {
        expect(await phasePod('held-setup', 'schema', database).done).toMatchObject({ exitCode: 0 });
        await withScratchConnection(database, async (db) => {
          // A joint run: the advisory lock plus the sentinels' LOCK TABLE, held to the end.
          const holder = db.createQueryRunner();
          await holder.connect();
          await holder.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
          await holder.startTransaction();
          await holder.query('LOCK TABLE migrations');
          try {
            const pod = phasePod('held-1', 'schema', database, {
              PGOPTIONS: '-c statement_timeout=2000',
              MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '300',
              MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '1',
            });
            let stdout = '';
            pod.child.stdout.on('data', (chunk) => (stdout += chunk));
            await waitFor(
              'the pod to wait on the run',
              async () => stdout,
              (out) => out.includes('migrations table locked; waiting for it'),
              { timeoutMs: 60_000 }
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));
            await holder.commitTransaction();
            await holder.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);

            expect(await pod.done).toMatchObject({ exitCode: 0, result: { error: null } });
          } finally {
            await holder.release();
          }
        });
      } finally {
        await dropScratchDatabase(database);
      }
    }, 120_000);

    it('should open runner connections with no statement timeout, so a server or role limit cannot cancel a long run', async () => {
      const previous = process.env.PGOPTIONS;
      delete process.env.PGOPTIONS;
      const dataSource = new DataSource({ type: 'postgres', ...postgres, database: phaseDatabase });
      try {
        withMigrationConnectionOptions(dataSource);
        await dataSource.initialize();
        const [{ timeout }] = await dataSource.query(`SELECT current_setting('statement_timeout') AS timeout`);

        expect(timeout).toBe('0');
      } finally {
        if (previous !== undefined) process.env.PGOPTIONS = previous;
        if (dataSource.isInitialized) await dataSource.destroy();
      }
    });

    it('should open every runner connection with the dead-client keepalive, keeping PGOPTIONS', async () => {
      const previous = process.env.PGOPTIONS;
      process.env.PGOPTIONS = '-c statement_timeout=12345';
      const dataSource = new DataSource({ type: 'postgres', ...postgres, database: phaseDatabase });
      try {
        withMigrationConnectionOptions(dataSource);
        await dataSource.initialize();
        const [settings] = await dataSource.query(
          `SELECT current_setting('tcp_keepalives_idle') AS idle, current_setting('tcp_keepalives_count') AS count,
                  current_setting('statement_timeout') AS timeout`
        );

        expect(settings).toEqual({ idle: '30', count: '3', timeout: '12345ms' });
      } finally {
        if (previous === undefined) delete process.env.PGOPTIONS;
        else process.env.PGOPTIONS = previous;
        if (dataSource.isInitialized) await dataSource.destroy();
      }
    }, 60_000);

    it('should run the whole upgrade in one transaction when a pending migration predates the authoring rules', async () => {
      const database = `tooljet_migration_legacy_${process.pid}`;
      await createScratchDatabase(database);
      try {
        const pod = await phasePod('legacy-1', 'schema', database, {}, { fixtureSet: 'legacy' }).done;

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain('LegacyWitness1700000000004 is pending: this database is older than 3.21.58');
        expect(pod.stdout).toContain('Committed schema + data migrations in a single transaction.');
        expect(await withScratchConnection(database, (db) => db.query('SELECT 1 FROM legacy_witness'))).toEqual([]);
      } finally {
        await dropScratchDatabase(database);
      }
    }, 120_000);
  });
});
