/**
 * Covers: migration-helpers/run-all-migrations.ts, migration-mode.ts, enum-value-additions.ts, migration-locks.ts
 * @group database
 */
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  CLEANUP_ADVISORY_LOCK_KEY,
  HELD_MIGRATION_LOCKS_SQL,
  MIGRATION_ADVISORY_LOCK_KEY,
  SKIPPED_EXIT_CODE,
  withMigrationConnectionOptions,
} from 'src/migration-helpers/migration-locks';
import {
  createScratchDatabase,
  dropScratchDatabase,
  postgres,
  RunningPod,
  spawnPod,
  waitFor,
  watchActiveLock,
  withScratchConnection,
} from '../fixtures/harness';

describe('Upgrading in three phases: schema, then data, then cleanup', () => {
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

  /** Async mode: schema migrations while the pod starts (`migrateSchemaBeforeBoot`), data migrations in a run the server starts. */
  describe('Schema phase at startup, data phase after', () => {
    it('should apply schema migrations in the schema phase, and let the next pod start without taking the lock', async () => {
      const watcher = watchActiveLock(connection);
      const firstPod = await spawnPod({
        podId: 'schema-1',
        database: phaseDatabase,
        migrationSleepSeconds: 3,
        env: { MIGRATION_PHASE: 'schema' },
      }).done;
      watcher.stop();

      const nextPod = await spawnPod({ podId: 'schema-2', database: phaseDatabase, env: { MIGRATION_PHASE: 'schema' } })
        .done;

      expect(watcher.samples.filter(Boolean).length).toBeGreaterThan(0);
      expect(firstPod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(firstPod.stdout).toContain('1 schema migration(s) pending: SlowWitnessedMigration1790700000001');
      expect(firstPod.stdout).toContain('Committed schema migrations.');
      expect(nextPod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(nextPod.stdout).toContain('No schema migrations pending before boot.');
      expect(await connection.query('SELECT 1 FROM migration_witness')).toHaveLength(1);
      expect(await connection.query(HELD_MIGRATION_LOCKS_SQL)).toEqual([{ running: false, migrating: false }]);
    }, 120_000);

    it('should run schema and data in separate transactions in the data phase', async () => {
      const pod = await spawnPod({ podId: 'data-1', database: phaseDatabase, env: { MIGRATION_PHASE: 'data' } }).done;

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(pod.stdout).toContain('Data phase:');
      expect(pod.stdout).toContain('Committed schema and data migrations in separate transactions.');
    }, 120_000);

    it('should fail when MIGRATION_PHASE names a phase that does not exist', async () => {
      const pod = await spawnPod({
        podId: 'bad-phase',
        database: phaseDatabase,
        env: { MIGRATION_PHASE: 'everything' },
      }).done;

      expect(pod).toMatchObject({ exitCode: 1, result: { error: expect.stringContaining('Unknown MIGRATION_PHASE') } });
    }, 120_000);

    it('should run the whole upgrade in one transaction when the database is older than 3.21.58', async () => {
      await withFreshDatabase(`tooljet_migration_legacy_${process.pid}`, async (database) => {
        const pod = await spawnPod({
          podId: 'legacy-1',
          database,
          fixtureSet: 'pre-cutoff',
          env: { MIGRATION_PHASE: 'schema' },
        }).done;

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain('LegacyWitness1700000000004 is pending: this database is older than 3.21.58');
        expect(pod.stdout).toContain('Committed schema + data migrations in a single transaction.');
        expect(await withScratchConnection(database, (db) => db.query('SELECT 1 FROM legacy_witness'))).toEqual([]);
      });
    }, 120_000);

    describe('a schema migration that has to wait for a table lock', () => {
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

      it('should undo and retry until the table is free, then apply the migration once', async () => {
        const lock = await holdTableLock();
        const pod = spawnPod({
          podId: 'blocked-1',
          database: blockedDatabase,
          env: {
            MIGRATION_PHASE: 'schema',
            MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '300',
            MIGRATION_SCHEMA_LOCK_RETRIES: '30',
          },
        });
        await waitForPodOutput(pod, 'a lock-timeout retry', 'for a table lock; rolled back');

        await lock.release();
        const outcome = await pod.done;

        expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(await blocked.query('SELECT 1 FROM migration_witness')).toHaveLength(1);
      }, 120_000);

      it('should stop the pod from starting once it runs out of attempts', async () => {
        const lock = await holdTableLock();
        try {
          const outcome = await spawnPod({
            podId: 'blocked-2',
            database: blockedDatabase,
            env: {
              MIGRATION_PHASE: 'schema',
              MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '200',
              MIGRATION_SCHEMA_LOCK_RETRIES: '2',
            },
          }).done;

          expect(outcome).toMatchObject({ exitCode: 1, result: { error: expect.stringContaining('lock timeout') } });
          expect(outcome.stdout).toContain('Retrying (attempt 2 of 2)');
        } finally {
          await lock.release();
        }
      }, 120_000);
    });

    describe('a new enum value added by a schema migration and used by a data migration', () => {
      const enumDatabase = `tooljet_migration_enum_${process.pid}`;

      beforeEach(async () => {
        await createScratchDatabase(enumDatabase);
      }, 60_000);

      afterEach(async () => {
        await dropScratchDatabase(enumDatabase);
      }, 60_000);

      it('should migrate a fresh database, where the same run creates the type', async () => {
        const pod = await spawnPod({ podId: 'enum-fresh', database: enumDatabase, fixtureSet: 'split-phases' }).done;

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain('targets an enum type created in this run');
      }, 120_000);

      it('should save a new enum value on its own first, so the data migration that uses it in the same upgrade does not fail', async () => {
        // An earlier release created the type; this upgrade only adds a value to it.
        await withScratchConnection(enumDatabase, (db) => db.query(`CREATE TYPE fixture_color AS ENUM ('red')`));

        const pod = await spawnPod({ podId: 'enum-upgrade', database: enumDatabase, fixtureSet: 'split-phases' }).done;

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain("pre-committed enum value fixture_color.'blue'");
        expect(pod.stdout).toContain('in a single transaction');
      }, 120_000);

      it('should save the new enum value on its own first in the schema phase too', async () => {
        // An earlier release created the type; this upgrade only adds a value to it.
        await withScratchConnection(enumDatabase, (db) => db.query(`CREATE TYPE fixture_color AS ENUM ('red')`));

        const pod = await spawnPod({
          podId: 'enum-schema',
          database: enumDatabase,
          fixtureSet: 'split-phases',
          env: { MIGRATION_PHASE: 'schema' },
        }).done;

        expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(pod.stdout).toContain("pre-committed enum value fixture_color.'blue'");
      }, 120_000);

      it('should start a new pod right away while another pod runs a long data phase', async () => {
        const schemaPod = await spawnPod({
          podId: 'split-schema',
          database: enumDatabase,
          fixtureSet: 'split-phases',
          env: { MIGRATION_PHASE: 'schema' },
        }).done;
        expect(schemaPod).toMatchObject({ exitCode: 0 });
        const dataPod = spawnPod({
          podId: 'split-data',
          database: enumDatabase,
          fixtureSet: 'split-phases',
          migrationSleepSeconds: 20,
          env: { MIGRATION_PHASE: 'data' },
        });
        await waitForPodOutput(dataPod, 'the data migration to start', 'START UseFixtureColorValue1790700000003');

        const booting = await spawnPod({
          podId: 'split-boot',
          database: enumDatabase,
          fixtureSet: 'split-phases',
          env: { MIGRATION_PHASE: 'schema' },
        }).done;

        expect(booting).toMatchObject({ exitCode: 0, result: { error: null } });
        expect(booting.stdout).toContain('No schema migrations pending before boot.');
        expect(booting.result.durationMs).toBeLessThan(5000);
        expect(await dataPod.done).toMatchObject({ exitCode: 0, result: { error: null } });
      }, 180_000);
    });
  });

  describe('when another pod is already migrating', () => {
    it('should exit and let the other pod finish when MIGRATION_SKIP_IF_LOCKED is set', async () => {
      await withFreshDatabase(`tooljet_migration_skip_${process.pid}`, async (database) => {
        const pod = await whileAnotherPodHoldsLock(
          database,
          MIGRATION_ADVISORY_LOCK_KEY,
          () =>
            spawnPod({ podId: 'skip-1', database, env: { MIGRATION_PHASE: 'data', MIGRATION_SKIP_IF_LOCKED: 'true' } })
              .done
        );

        expect(pod).toMatchObject({ exitCode: SKIPPED_EXIT_CODE, result: { error: null } });
        expect(pod.stdout).toContain('leaving the run to it');
        const [{ witness }] = await withScratchConnection(database, (db) =>
          db.query(`SELECT to_regclass('migration_witness') AS witness`)
        );
        expect(witness).toBeNull();
      });
    }, 120_000);

    it("should wait for another pod's single-transaction run instead of failing while reading the migrations table", async () => {
      await withFreshDatabase(`tooljet_migration_table_held_${process.pid}`, async (database) => {
        const setupPod = await spawnPod({ podId: 'held-setup', database, env: { MIGRATION_PHASE: 'schema' } }).done;
        expect(setupPod).toMatchObject({ exitCode: 0 });
        await withScratchConnection(database, async (db) => {
          const otherRun = await startSingleTransactionRun(db);
          try {
            const pod = spawnPod({
              podId: 'held-1',
              database,
              env: {
                MIGRATION_PHASE: 'schema',
                PGOPTIONS: '-c statement_timeout=2000',
                MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '300',
                MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '1',
              },
            });
            await waitForPodOutput(pod, 'the pod to wait on the run', 'migrations table locked; waiting for it');
            // Longer than the pod's 2s statement timeout: a read that did not wait would have failed by now.
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await otherRun.finish();

            expect(await pod.done).toMatchObject({ exitCode: 0, result: { error: null } });
          } finally {
            await otherRun.release();
          }
        });
      });
    }, 120_000);
  });

  describe('migration runner connections', () => {
    it('should open connections with no statement time limit, so a server or role setting cannot cancel a long run', async () => {
      const [{ timeout }] = await withPgOptions(undefined, () =>
        queryOnRunnerConnection(phaseDatabase, `SELECT current_setting('statement_timeout') AS timeout`)
      );

      expect(timeout).toBe('0');
    });

    // Keepalive closes a vanished pod's connection, and its locks, in seconds rather than hours.
    it('should turn on TCP keepalive, and keep options set in the PGOPTIONS environment variable', async () => {
      const [settings] = await withPgOptions('-c statement_timeout=12345', () =>
        queryOnRunnerConnection(
          phaseDatabase,
          `SELECT current_setting('tcp_keepalives_idle') AS idle, current_setting('tcp_keepalives_count') AS count,
                  current_setting('statement_timeout') AS timeout`
        )
      );

      expect(settings).toEqual({ idle: '30', count: '3', timeout: '12345ms' });
    }, 60_000);
  });

  /** Cleanup runs after writes reopen, in its own process and lock; a single-transaction run includes it. */
  describe('Cleanup phase: dropping old columns and tables after the upgrade', () => {
    const database = `tooljet_migration_cleanup_${process.pid}`;
    const CLEANUP = 'DropFixtureGadgetsLegacy1790700000011';
    const LEGACY_COLUMN_SQL = `SELECT column_name FROM information_schema.columns WHERE table_name = 'fixture_gadgets'`;
    let db: DataSource;

    beforeEach(async () => {
      await createScratchDatabase(database);
      db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
    }, 60_000);

    afterEach(async () => {
      await db?.destroy().catch(() => undefined);
      await dropScratchDatabase(database);
    }, 60_000);

    it('should run cleanup as part of a single-transaction upgrade', async () => {
      const pod = await spawnPod({ podId: 'cleanup-single', database, fixtureSet: 'cleanup-phase' }).done;
      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });

      expect(await db.query('SELECT name FROM migrations')).toContainEqual({ name: CLEANUP });
      expect(await db.query(LEGACY_COLUMN_SQL)).not.toContainEqual({ column_name: 'legacy' });
    }, 120_000);

    it('should leave cleanup out of the data phase, then run it in the cleanup phase', async () => {
      for (const phase of ['schema', 'data']) {
        const pod = await spawnPod({
          podId: `cleanup-${phase}`,
          database,
          fixtureSet: 'cleanup-phase',
          env: { MIGRATION_PHASE: phase },
        }).done;
        expect(pod).toMatchObject({ exitCode: 0 });
      }
      expect(await db.query('SELECT name FROM migrations')).not.toContainEqual({ name: CLEANUP });

      const pod = await spawnPod({
        podId: 'cleanup-1',
        database,
        fixtureSet: 'cleanup-phase',
        env: { MIGRATION_PHASE: 'cleanup' },
      }).done;

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(await db.query('SELECT name FROM migrations')).toContainEqual({ name: CLEANUP });
      expect(await db.query(LEGACY_COLUMN_SQL)).not.toContainEqual({ column_name: 'legacy' });
    }, 120_000);

    it('should wait one upgrade before dropping a column, so the previous release that may still read it keeps working', async () => {
      // An instance already in use: one migration recorded before this upgrade.
      await db.query(`CREATE TABLE migrations (id SERIAL PRIMARY KEY, timestamp bigint NOT NULL, name varchar NOT NULL);
                      INSERT INTO migrations (timestamp, name) VALUES (1700000000001, 'EarlierRelease1700000000001')`);
      for (const phase of ['schema', 'data']) {
        const pod = await spawnPod({
          podId: `skip-${phase}`,
          database,
          fixtureSet: 'cleanup-phase',
          env: { MIGRATION_PHASE: phase },
        }).done;
        expect(pod).toMatchObject({ exitCode: 0 });
      }

      const firstUpgrade = await spawnPod({
        podId: 'skip-cleanup',
        database,
        fixtureSet: 'cleanup-phase',
        env: { MIGRATION_PHASE: 'cleanup' },
      }).done;

      expect(firstUpgrade).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(firstUpgrade.stdout).toContain(`Holding back ${CLEANUP}`);
      expect(await db.query('SELECT name FROM migrations')).not.toContainEqual({ name: CLEANUP });
      expect(await db.query(LEGACY_COLUMN_SQL)).toContainEqual({ column_name: 'legacy' });

      // Dropping the baseline makes the next run count as the next release's first upgrade.
      await db.query('DELETE FROM migration_baselines');
      const nextUpgrade = await spawnPod({
        podId: 'next-cleanup',
        database,
        fixtureSet: 'cleanup-phase',
        env: { MIGRATION_PHASE: 'cleanup' },
      }).done;

      expect(nextUpgrade).toMatchObject({ exitCode: 0 });
      expect(await db.query('SELECT name FROM migrations')).toContainEqual({ name: CLEANUP });
    }, 180_000);

    it('should stop and leave the rest for the next start while another pod is running migrations', async () => {
      const schemaPod = await spawnPod({
        podId: 'yield-schema',
        database,
        fixtureSet: 'cleanup-phase',
        env: { MIGRATION_PHASE: 'schema' },
      }).done;
      expect(schemaPod).toMatchObject({ exitCode: 0 });

      const pod = await whileAnotherPodHoldsLock(
        database,
        MIGRATION_ADVISORY_LOCK_KEY,
        () =>
          spawnPod({ podId: 'yield-1', database, fixtureSet: 'cleanup-phase', env: { MIGRATION_PHASE: 'cleanup' } })
            .done
      );

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(pod.stdout).toContain('the remaining cleanup migrations run on the next boot');
      expect(await db.query('SELECT name FROM migrations')).not.toContainEqual({ name: CLEANUP });
    }, 120_000);

    it('should not make a data run skip when only a cleanup run is in progress', async () => {
      const pod = await whileAnotherPodHoldsLock(
        database,
        CLEANUP_ADVISORY_LOCK_KEY,
        () =>
          spawnPod({
            podId: 'cleanup-held',
            database,
            fixtureSet: 'cleanup-phase',
            env: { MIGRATION_PHASE: 'data', MIGRATION_SKIP_IF_LOCKED: 'true' },
          }).done
      );

      expect(pod).toMatchObject({ exitCode: 0, result: { error: null } });
    }, 120_000);

    it('should exit and leave cleanup to the server that is already running it', async () => {
      const pod = await whileAnotherPodHoldsLock(
        database,
        CLEANUP_ADVISORY_LOCK_KEY,
        () =>
          spawnPod({
            podId: 'cleanup-busy',
            database,
            fixtureSet: 'cleanup-phase',
            env: { MIGRATION_PHASE: 'cleanup' },
          }).done
      );

      expect(pod).toMatchObject({ exitCode: SKIPPED_EXIT_CODE });
    }, 120_000);
  });

  /** Data statements that lock tables wait for beforeCommit(); passing errors such as deadlocks undo the phase and retry. */
  describe('Data phase: index builds at the end, and retries', () => {
    const database = `tooljet_migration_tail_${process.pid}`;
    const deadlockMarker = join(tmpdir(), `tooljet-deadlock-${process.pid}`);

    beforeEach(async () => {
      rmSync(deadlockMarker, { force: true });
      await createScratchDatabase(database);
    }, 60_000);
    afterEach(() => dropScratchDatabase(database), 60_000);

    it("should build indexes from beforeCommit() only after every data migration's up() has run", async () => {
      const pod = spawnPod({
        podId: 'before-commit-1',
        database,
        migrationSleepSeconds: 3,
        fixtureSet: 'data-before-commit',
        env: { MIGRATION_PHASE: 'data' },
      });
      await waitForPodOutput(pod, 'the slow data migration to start', 'START SlowFixtureStep');

      const locksMidRun = await withScratchConnection(database, (db) =>
        db.query(`SELECT l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE c.relname = 'fixture_rows'`)
      );
      const outcome = await pod.done;

      expect(locksMidRun).not.toContainEqual({ mode: 'ShareLock' });
      expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(outcome.stdout.indexOf('BEFORE COMMIT FillFixtureRows')).toBeGreaterThan(
        outcome.stdout.indexOf('DONE SlowFixtureStep')
      );
      const indexes = await withScratchConnection(database, (db) =>
        db.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'fixture_rows'`)
      );
      expect(indexes).toEqual([{ indexname: 'fixture_rows_label' }]);
    }, 120_000);

    it('should undo and retry the data phase after a deadlock', async () => {
      const outcome = await spawnPod({
        podId: 'deadlock-1',
        database,
        fixtureSet: 'data-before-commit',
        env: { MIGRATION_PHASE: 'data', FIXTURE_DEADLOCK_ONCE: deadlockMarker },
      }).done;

      expect(outcome).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(outcome.stdout).toContain('Retrying (attempt 2 of 3)');
      const [{ count }] = await withScratchConnection(database, (db) =>
        db.query('SELECT count(*)::int AS count FROM fixture_rows')
      );
      expect(count).toBe(10);
    }, 120_000);
  });
});

/** Creates `name`, runs `fn` on it, and drops it again. */
async function withFreshDatabase(name: string, fn: (database: string) => Promise<void>): Promise<void> {
  await createScratchDatabase(name);
  try {
    await fn(name);
  } finally {
    await dropScratchDatabase(name);
  }
}

/** Runs `fn` while another session holds the advisory lock `key`, as a pod in the middle of a run would. */
async function whileAnotherPodHoldsLock<T>(database: string, key: number, fn: () => Promise<T>): Promise<T> {
  return withScratchConnection(database, async (db) => {
    const holder = db.createQueryRunner();
    await holder.connect();
    try {
      await holder.query('SELECT pg_advisory_lock($1)', [key]);
      return await fn();
    } finally {
      await holder.release();
    }
  });
}

/** What a single-transaction run holds until it commits: the migration lock, and the migrations table locked. */
async function startSingleTransactionRun(db: DataSource) {
  const holder = db.createQueryRunner();
  await holder.connect();
  await holder.query('SELECT pg_advisory_lock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
  await holder.startTransaction();
  await holder.query('LOCK TABLE migrations');
  return {
    finish: async () => {
      await holder.commitTransaction();
      await holder.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY]);
    },
    release: () => holder.release(),
  };
}

/** Runs `fn` with PGOPTIONS set to `value` (unset when undefined), then puts the old value back. */
async function withPgOptions<T>(value: string | undefined, fn: () => Promise<T>): Promise<T> {
  const previous = process.env.PGOPTIONS;
  if (value === undefined) delete process.env.PGOPTIONS;
  else process.env.PGOPTIONS = value;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.PGOPTIONS;
    else process.env.PGOPTIONS = previous;
  }
}

/** Opens a connection the way the migration runner does, runs `sql` on it, and closes it. */
async function queryOnRunnerConnection(database: string, sql: string) {
  const dataSource = new DataSource({ type: 'postgres', ...postgres, database });
  try {
    withMigrationConnectionOptions(dataSource);
    await dataSource.initialize();
    return await dataSource.query(sql);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

/**
 * Starts collecting a running pod's output at once; the returned wait resolves when `text` shows up.
 * Call it right after `spawnPod`, before awaiting anything, so no output is missed.
 */
function waitForPodOutput(pod: RunningPod, describeWhat: string, text: string): Promise<string> {
  let output = '';
  pod.child.stdout.on('data', (chunk) => (output += chunk));
  pod.child.stderr.on('data', (chunk) => (output += chunk));
  return waitFor(
    describeWhat,
    async () => output,
    (out) => out.includes(text),
    { timeoutMs: 60_000 }
  );
}
