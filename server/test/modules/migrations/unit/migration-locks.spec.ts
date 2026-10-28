/**
 * Covers: migration-helpers/migration-locks.ts, the retry helpers in with-short-lock.ts and run-all-migrations.ts
 * @group database
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  LOCK_SENTINEL_MIGRATION_NAMES,
  DEAD_CLIENT_KEEPALIVE_SQL,
  getLockWaitOptions,
  getSchemaPhaseOptions,
  isLockNotAvailableError,
  LockWaitOptions,
  MigrationLockWaitTimeoutError,
  withMigrationAdvisoryLock,
} from 'src/migration-helpers/migration-locks';
import { codeHead, isTransientError } from 'src/migration-helpers/run-all-migrations';
import { retryWhen } from 'src/migration-helpers/with-short-lock';

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
      expect(getLockWaitOptions({})).toEqual({ retryIntervalMs: 60_000, maxWaitMs: 1_800_000 });
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
    it.each([
      [
        'check every 5s and try 10 times, waiting up to 5s for a table lock each time, when nothing is configured',
        {},
        { lockWait: { retryIntervalMs: 5000, maxWaitMs: 1_800_000 }, lockTimeoutMs: 5000, lockAttempts: 10 },
      ],
      [
        'use configured values, and the default for any that is not a number',
        {
          MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '20',
          MIGRATION_LOCK_MAX_WAIT_MINUTES: '0',
          MIGRATION_SCHEMA_LOCK_TIMEOUT_MS: '1500',
          MIGRATION_SCHEMA_LOCK_RETRIES: 'many',
        },
        { lockWait: { retryIntervalMs: 20_000, maxWaitMs: 0 }, lockTimeoutMs: 1500, lockAttempts: 10 },
      ],
    ])('should %s', (_case, env, options) => {
      expect(getSchemaPhaseOptions(env)).toEqual(options);
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

  describe('isTransientError(): which data-phase failures roll back and run the data phase again', () => {
    it.each([
      ['a deadlock', { code: '40P01' }, true],
      ['a serialization failure', { code: '40001' }, true],
      ['a lock timeout', { code: '55P03' }, true],
      ['a lock timeout wrapped by TypeORM', { driverError: { code: '55P03' } }, true],
      ['any other database error', { code: '23505' }, false],
      ['something that is not an error', undefined, false],
    ])('should say whether to retry %s: %s', (_shape, error, retryable) => {
      expect(isTransientError(error)).toBe(retryable);
    });
  });

  describe('retryWhen(): how many times a failing step is tried', () => {
    const noDelay = { attempts: 3, retryDelayMs: 0 };

    it.each([
      ['succeed on a retry after one retryable failure', ['retry', 'ok'], 2, 'ok'],
      ['give up after the configured number of attempts', ['retry', 'retry', 'retry', 'ok'], 3, 'retry'],
      ['fail at once on an error it should not retry', ['fatal', 'ok'], 1, 'fatal'],
    ])('should %s', async (_case, outcomes, calls, result) => {
      const work = jest.fn(async () => {
        const outcome = outcomes.shift();
        if (outcome !== 'ok') throw new Error(outcome);
        return outcome;
      });

      const settled = await retryWhen((error) => (error as Error).message === 'retry', work, noDelay).catch(
        (error: Error) => error.message
      );

      expect(settled).toBe(result);
      expect(work).toHaveBeenCalledTimes(calls);
    });
  });

  describe('codeHead(): the newest migration this code ships, which keys the cleanup baseline', () => {
    const shipping = (...names: string[]) => ({ migrations: names.map((name) => ({ name })) }) as unknown as DataSource;

    it.each([
      [
        'the cleanup folder',
        ['AddSlug1790000000001'],
        ['FillSlug1790000000002'],
        ['DropIcon1790000000003'],
        'DropIcon1790000000003',
      ],
      [
        'the schema folder, listed before older ones',
        ['AddSlug1790000000009', 'AddIcon1790000000001'],
        ['FillSlug1790000000002'],
        [],
        'AddSlug1790000000009',
      ],
    ])('should pick the newest timestamp when it is in %s', (_where, schema, data, cleanup, head) => {
      expect(codeHead(shipping(...schema), shipping(...data), shipping(...cleanup))).toBe(head);
    });
  });

  describe('withMigrationAdvisoryLock(): only one pod runs migrations at a time', () => {
    const noWait = { sleep: async () => undefined, now: () => 0, log: jest.fn() };

    it('should retry on the configured interval, log each wait, and run migrations once the other pod lets go', async () => {
      const { dataSource } = fakeDataSource([false, false, true]);
      const clock = fakeClock();
      const log = jest.fn();
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, { ...clock, log }, critical);

      expect(clock.slept).toEqual([60_000, 60_000]);
      expect(critical).toHaveBeenCalledTimes(1);
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
      const { dataSource, queries } = fakeDataSource([true]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, critical);

      const lockHolder = queries.find(({ sql }) => sql.includes('pg_try_advisory_lock'))?.runner;
      expect(critical).toHaveBeenCalledWith(lockHolder);
    });

    it('should hold the lock while the migrations run and release it afterwards', async () => {
      const { dataSource, runners, queries } = fakeDataSource([true]);

      await withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, async () => {
        queries.push({ sql: 'migrations ran' });
        return undefined;
      });

      // Keepalive first: a silently lost pod must not hold the lock for the OS default of ~2 hours.
      expect(queries.map(({ sql }) => sql)).toEqual([
        DEAD_CLIENT_KEEPALIVE_SQL,
        expect.stringContaining('pg_try_advisory_lock'),
        'migrations ran',
        expect.stringContaining('pg_advisory_unlock'),
      ]);
      // Same key both ways, or the lock would never be released.
      expect(queries[1].parameters).toEqual(queries[3].parameters);
      expect(runners[0].release).toHaveBeenCalled();
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
      const { dataSource, queries, runners } = fakeDataSource([true]);

      await expect(
        withMigrationAdvisoryLock(dataSource, lockWaitOptions, noWait, async () => {
          throw new Error('migration blew up');
        })
      ).rejects.toThrow('migration blew up');

      expect(queries.some(({ sql }) => sql.includes('pg_advisory_unlock'))).toBe(true);
      expect(runners[0].release).toHaveBeenCalled();
    });
  });
});

/**
 * A data source whose advisory-lock attempts return `lockResults` in turn. Each createQueryRunner()
 * is a new connection, and every query records the connection that ran it.
 */
function fakeDataSource(lockResults: boolean[]) {
  const queries: Array<{ sql: string; parameters?: unknown[]; runner?: object }> = [];
  const runners: Array<{ release: jest.Mock }> = [];
  const createQueryRunner = () => {
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(async (sql: string, parameters?: unknown[]) => {
        queries.push({ sql, parameters, runner });
        if (sql.includes('pg_try_advisory_lock')) return [{ locked: lockResults.shift() ?? true }];
        return [{}];
      }),
    };
    runners.push(runner);
    return runner;
  };
  return { dataSource: { createQueryRunner } as unknown as DataSource, runners, queries };
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
