/**
 * Covers: migration-helpers/migration-locks.ts
 * @group database
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  LOCK_SENTINEL_MIGRATION_NAMES,
  DEAD_CLIENT_KEEPALIVE_SQL,
  DEFAULT_MAX_WAIT_MINUTES,
  DEFAULT_RETRY_INTERVAL_SECONDS,
  getLockWaitOptions,
  getSchemaPhaseOptions,
  isLockNotAvailableError,
  LockWaitOptions,
  MigrationLockWaitTimeoutError,
  withMigrationAdvisoryLock,
} from 'src/migration-helpers/migration-locks';

const lockWaitOptions: LockWaitOptions = {
  retryIntervalMs: 60_000,
  maxWaitMs: 30 * 60_000,
};

describe('migration-helpers/migration-locks', () => {
  describe('LOCK_SENTINEL_MIGRATION_NAMES: a plain restart must not look like an upgrade', () => {
    // If this list stops matching the files, every pod restart and scale-up would count as an
    // upgrade and answer live API traffic with 503.
    it.each([['migrations/schema'], ['migrations/data']])(
      'should name every LockMigrationsTable migration file in %s',
      (directory) => {
        // Class names TypeORM reports as pending, read from the migration files themselves.
        const absolute = join(__dirname, '../../../../', directory);
        const classNames = readdirSync(absolute)
          .filter((file) => file.startsWith('LockMigrationsTable'))
          .map((file) => readFileSync(join(absolute, file), 'utf8').match(/export class (\w+)/)?.[1])
          .sort();

        expect(classNames).toEqual([...LOCK_SENTINEL_MIGRATION_NAMES].sort());
      }
    );
  });

  describe("getLockWaitOptions(): how long a pod waits for another pod's migration run", () => {
    it('should check every 60s and give up after 30 minutes when nothing is configured', () => {
      expect(getLockWaitOptions({})).toEqual({
        retryIntervalMs: DEFAULT_RETRY_INTERVAL_SECONDS * 1000,
        maxWaitMs: DEFAULT_MAX_WAIT_MINUTES * 60_000,
      });
    });

    it('should use the configured interval and limit', () => {
      expect(
        getLockWaitOptions({
          MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '15',
          MIGRATION_LOCK_MAX_WAIT_MINUTES: '5',
        })
      ).toEqual({ retryIntervalMs: 15_000, maxWaitMs: 300_000 });
    });

    it('should wait forever when MIGRATION_LOCK_MAX_WAIT_MINUTES is 0', () => {
      expect(getLockWaitOptions({ MIGRATION_LOCK_MAX_WAIT_MINUTES: '0' }).maxWaitMs).toBe(0);
    });

    // A blank value must not read as 0, which for the limit means "wait forever".
    it.each([
      ['not numbers', 'soon', '-1'],
      ['blank', '', ''],
      ['only spaces', '  ', '  '],
    ])(
      'should use the defaults for values that are %s, so the pod never retries in a tight loop or waits forever',
      (_shape, interval, maxWait) => {
        expect(
          getLockWaitOptions({
            MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: interval,
            MIGRATION_LOCK_MAX_WAIT_MINUTES: maxWait,
          })
        ).toEqual({ retryIntervalMs: 60_000, maxWaitMs: 1_800_000 });
      }
    );
  });

  describe('getSchemaPhaseOptions(): retry settings for the schema migrations run at boot', () => {
    it('should check every 5s and try 10 times, waiting up to 5s for a table lock each time, when nothing is configured', () => {
      expect(getSchemaPhaseOptions({})).toEqual({
        lockWait: { retryIntervalMs: 5000, maxWaitMs: DEFAULT_MAX_WAIT_MINUTES * 60_000 },
        lockTimeoutMs: 5000,
        lockAttempts: 10,
      });
    });

    it('should use configured values, and the default for any that is not a number', () => {
      expect(
        getSchemaPhaseOptions({
          MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '20',
          MIGRATION_LOCK_MAX_WAIT_MINUTES: '0',
          MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '1500',
          MIGRATION_SCHEMA_LOCK_RETRIES: 'many',
        })
      ).toEqual({ lockWait: { retryIntervalMs: 20_000, maxWaitMs: 0 }, lockTimeoutMs: 1500, lockAttempts: 10 });
    });
  });

  describe('isLockNotAvailableError(): which schema-run failures are worth retrying', () => {
    // The pg driver puts `code` on the error; TypeORM's QueryFailedError puts it on `driverError`.
    it.each([
      ['a lock timeout from the pg driver', Object.assign(new Error('lock timeout'), { code: '55P03' }), true],
      [
        'a lock timeout wrapped by TypeORM',
        Object.assign(new Error('query failed'), { driverError: { code: '55P03' } }),
        true,
      ],
      ['any other database error', Object.assign(new Error('relation exists'), { code: '42P07' }), false],
      ['something that is not an error', undefined, false],
    ])('should say whether to retry %s: %s', (_shape, error, retryable) => {
      expect(isLockNotAvailableError(error)).toBe(retryable);
    });
  });

  describe('withMigrationAdvisoryLock(): only one pod runs migrations at a time', () => {
    const noWait = { sleep: async () => undefined, now: () => 0, log: jest.fn() };

    it('should retry on the configured interval and log each wait, so operators can see the pod is alive', async () => {
      const { dataSource } = fakeDataSource([false, false, true]);
      const clock = fakeClock();
      const log = jest.fn();

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, { ...clock, log }, async () => undefined);

      expect(clock.slept).toEqual([60_000, 60_000]);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Another pod is running migrations'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('This pod will NOT exit.'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Lock released'));
    });

    it('should give up after the configured limit instead of waiting forever on a stuck pod', async () => {
      const { dataSource } = fakeDataSource(Array(10).fill(false));

      await expect(
        withMigrationAdvisoryLock(
          dataSource,
          { ...lockWaitOptions, maxWaitMs: 180_000 },
          { ...fakeClock(), log: jest.fn() },
          jest.fn()
        )
      ).rejects.toBeInstanceOf(MigrationLockWaitTimeoutError);
    });

    it('should keep waiting past the default 30 minutes when maxWaitMs is 0', async () => {
      // 40 refusals is well past the 30 minute default ceiling.
      const { dataSource } = fakeDataSource([...Array(40).fill(false), true]);
      const critical = jest.fn().mockResolvedValue('done');

      await expect(
        withMigrationAdvisoryLock(
          dataSource,
          { ...lockWaitOptions, maxWaitMs: 0 },
          { ...fakeClock(), log: jest.fn() },
          critical
        )
      ).resolves.toBe('done');
    });

    it('should run the migrations on the connection that holds the lock, so their locks end when it closes', async () => {
      const { dataSource, queryRunner } = fakeDataSource([true]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, critical);

      expect(critical).toHaveBeenCalledWith(queryRunner);
    });

    it('should hold the lock while the migrations run and release it afterwards', async () => {
      const { dataSource, queryRunner, queries } = fakeDataSource([true]);
      const order: string[] = [];

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, async () => {
        order.push('critical');
        return undefined;
      });

      // Keepalive first: a silently lost pod must not hold the lock for the OS default of ~2 hours.
      expect(queries[0].sql).toBe(DEAD_CLIENT_KEEPALIVE_SQL);
      expect(queries[1].sql).toContain('pg_try_advisory_lock');
      expect(order).toEqual(['critical']);
      expect(queries[queries.length - 1].sql).toContain('pg_advisory_unlock');
      // Same key both ways, or the lock would never be released.
      expect(queries[1].parameters).toEqual(queries[queries.length - 1].parameters);
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should run migrations only once the other pod lets go of the lock', async () => {
      const { dataSource } = fakeDataSource([false, false, true]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, critical);

      expect(critical).toHaveBeenCalledTimes(1);
    });

    it('should not start migrations while another pod holds the lock', async () => {
      const { dataSource } = fakeDataSource([false]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await expect(
        withMigrationAdvisoryLock(dataSource, { ...lockWaitOptions, maxWaitMs: 1 }, noWait, critical)
      ).rejects.toBeInstanceOf(MigrationLockWaitTimeoutError);
      expect(critical).not.toHaveBeenCalled();
    });

    it('should return without waiting when told to skip and another server holds the lock', async () => {
      const { dataSource, queries } = fakeDataSource([false, true]);
      const critical = jest.fn().mockResolvedValue('ran');

      await expect(
        withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, critical, { skipIfBusy: true })
      ).resolves.toBeUndefined();
      expect(critical).not.toHaveBeenCalled();
      expect(queries.filter(({ sql }) => sql.includes('pg_try_advisory_lock'))).toHaveLength(1);
    });

    it('should release the lock when the migration fails, so the next pod is not locked out', async () => {
      const { dataSource, queries, queryRunner } = fakeDataSource([true]);

      await expect(
        withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, async () => {
          throw new Error('migration blew up');
        })
      ).rejects.toThrow('migration blew up');

      expect(queries.some(({ sql }) => sql.includes('pg_advisory_unlock'))).toBe(true);
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});

/** A data source whose advisory-lock attempts return `lockResults` in turn; records every query. */
function fakeDataSource(lockResults: boolean[]) {
  const queries: Array<{ sql: string; parameters?: unknown[] }> = [];
  const queryRunner = {
    connect: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(async (sql: string, parameters?: unknown[]) => {
      queries.push({ sql, parameters });
      if (sql.includes('pg_try_advisory_lock')) return [{ locked: lockResults.shift() ?? true }];
      return [{}];
    }),
  };
  return { dataSource: { createQueryRunner: () => queryRunner } as unknown as DataSource, queryRunner, queries };
}

// A clock the test advances only through sleep(), so elapsed time is exactly the time slept.
function fakeClock() {
  let current = 0;
  const slept: number[] = [];
  return {
    now: () => current,
    slept,
    sleep: async (ms: number) => {
      slept.push(ms);
      current += ms;
    },
  };
}
