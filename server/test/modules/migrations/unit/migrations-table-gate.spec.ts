/** @group database */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  excludeLockSentinels,
  LOCK_SENTINEL_MIGRATION_NAMES,
  DEFAULT_MAX_WAIT_MINUTES,
  DEFAULT_PROBE_LOCK_TIMEOUT,
  DEFAULT_RETRY_INTERVAL_SECONDS,
  getLockWaitOptions,
  isRetryableLockError,
  isUndefinedTableError,
  LockWaitOptions,
  MigrationLockBusyError,
  MigrationLockWaitTimeoutError,
  withMigrationAdvisoryLock,
  probeMigrationsTable,
  withLockContentionRetry,
} from 'src/migration-helpers/migrations-table-gate';

// Shapes the two ways a PostgreSQL error reaches us: raw from the pg driver (`code` on the
// error) and wrapped by TypeORM's QueryFailedError (`code` on `driverError`).
function pgError(code: string, message = `pg error ${code}`): Error {
  return Object.assign(new Error(message), { code });
}

function typeormError(code: string, message = `query failed ${code}`): Error {
  return Object.assign(new Error(message), { driverError: { code } });
}

const options: LockWaitOptions = {
  retryIntervalMs: 60_000,
  maxWaitMs: 30 * 60_000,
  probeLockTimeout: '5s',
};

/** Class names TypeORM reports as pending, read from the migration files themselves. */
function lockSentinelClassNamesOnDisk(directory: string): string[] {
  const absolute = join(__dirname, '../../../../', directory);
  return readdirSync(absolute)
    .filter((file) => file.startsWith('LockMigrationsTable'))
    .flatMap((file) => {
      const [, className] = readFileSync(join(absolute, file), 'utf8').match(/export class (\w+)/) ?? [];
      return className ? [className] : [];
    })
    .sort();
}

describe('migration-helpers/migrations-table-gate', () => {
  describe('excludeLockSentinels | an ordinary restart must not look like an upgrade', () => {
    // Exactly one sentinel is always pending — that is how the lock is taken on every boot.
    // If this list ever stops matching the files, every pod restart and scale-up would raise
    // the upgrade gate and answer live API traffic with 503.
    it.each([['migrations'], ['data-migrations']])(
      'should list every LockMigrationsTable class actually shipped in %s',
      (directory) => {
        expect(lockSentinelClassNamesOnDisk(directory)).toEqual([...LOCK_SENTINEL_MIGRATION_NAMES].sort());
      }
    );

    it('should report nothing pending when only the boot-time lock sentinel is, so no Redis key is set', () => {
      expect(excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[0]])).toEqual([]);
      expect(excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[1]])).toEqual([]);
      expect(excludeLockSentinels([])).toEqual([]);
    });

    it('should report real migrations so the upgrade gate goes up for them', () => {
      expect(
        excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[0], 'AddBranchIdToApps1783372800000'])
      ).toEqual(['AddBranchIdToApps1783372800000']);
    });
  });

  describe('isRetryableLockError | tells "another pod is migrating" apart from "this migration is broken"', () => {
    it.each([
      ['55P03 lock_not_available — another pod holds the migrations table', pgError('55P03')],
      ['57014 query_canceled — a statement_timeout killed the blocked query', pgError('57014')],
      ['40P01 deadlock_detected', pgError('40P01')],
      ['57P03 cannot_connect_now — the database is still starting', pgError('57P03')],
      ['53300 too_many_connections — every pod reconnected at once', pgError('53300')],
      ['08006 connection_failure', typeormError('08006')],
      ['ECONNREFUSED', pgError('ECONNREFUSED')],
      ['ETIMEDOUT', typeormError('ETIMEDOUT')],
      ['a statement timeout reported only in prose', new Error('canceling statement due to statement timeout')],
      ['a lock timeout reported only in prose', new Error('canceling statement due to lock timeout')],
      ['a dropped connection reported only in prose', new Error('Connection terminated unexpectedly')],
      ['a connect timeout reported only in prose', new Error('timeout exceeded when trying to connect')],
    ])('should retry on %s', (_label, error) => {
      expect(isRetryableLockError(error)).toBe(true);
    });

    it.each([
      ['42P01 undefined_table — a fresh database, not a busy one', pgError('42P01')],
      ['23505 unique_violation raised by the migration itself', pgError('23505')],
      ['42703 undefined_column — the migration is wrong', typeormError('42703')],
      ['a plain programming error', new TypeError('x is not a function')],
    ])('should fail fast on %s', (_label, error) => {
      expect(isRetryableLockError(error)).toBe(false);
    });

    it('should recognise a missing migrations table as a fresh install rather than contention', () => {
      expect(isUndefinedTableError(pgError('42P01'))).toBe(true);
      expect(isUndefinedTableError(pgError('55P03'))).toBe(false);
    });
  });

  describe('getLockWaitOptions | reads the operator-facing knobs', () => {
    it('should fall back to a 60s retry interval and a 30 minute ceiling when nothing is configured', () => {
      expect(getLockWaitOptions({})).toEqual({
        retryIntervalMs: DEFAULT_RETRY_INTERVAL_SECONDS * 1000,
        maxWaitMs: DEFAULT_MAX_WAIT_MINUTES * 60_000,
        probeLockTimeout: DEFAULT_PROBE_LOCK_TIMEOUT,
      });
    });

    it('should apply configured values', () => {
      expect(
        getLockWaitOptions({
          MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '15',
          MIGRATION_LOCK_MAX_WAIT_MINUTES: '5',
          MIGRATION_LOCK_PROBE_TIMEOUT: '2s',
        })
      ).toEqual({ retryIntervalMs: 15_000, maxWaitMs: 300_000, probeLockTimeout: '2s' });
    });

    it('should treat MIGRATION_LOCK_MAX_WAIT_MINUTES=0 as "wait indefinitely"', () => {
      expect(getLockWaitOptions({ MIGRATION_LOCK_MAX_WAIT_MINUTES: '0' }).maxWaitMs).toBe(0);
    });

    it('should ignore unparseable values rather than wedging the retry loop at zero', () => {
      const parsed = getLockWaitOptions({
        MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: 'soon',
        MIGRATION_LOCK_MAX_WAIT_MINUTES: '-1',
      });
      expect(parsed.retryIntervalMs).toBe(DEFAULT_RETRY_INTERVAL_SECONDS * 1000);
      expect(parsed.maxWaitMs).toBe(DEFAULT_MAX_WAIT_MINUTES * 60_000);
    });
  });

  describe('withLockContentionRetry | the pod waits instead of exiting', () => {
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

    it('should keep retrying a blocked query on the configured interval and return once the lock clears', async () => {
      const clock = fakeClock();
      const attempt = jest
        .fn()
        .mockRejectedValueOnce(pgError('55P03'))
        .mockRejectedValueOnce(pgError('57014'))
        .mockResolvedValue('migrations readable');

      const result = await withLockContentionRetry('probing', attempt, options, { ...clock, log: jest.fn() });

      expect(result).toBe('migrations readable');
      expect(attempt).toHaveBeenCalledTimes(3);
      expect(clock.slept).toEqual([60_000, 60_000]);
    });

    it('should log each wait so an operator can see the pod is alive and queued, not dead', async () => {
      const clock = fakeClock();
      const log = jest.fn();
      const attempt = jest.fn().mockRejectedValueOnce(pgError('55P03')).mockResolvedValue(undefined);

      await withLockContentionRetry('probing', attempt, options, { ...clock, log });

      expect(log).toHaveBeenCalledWith(expect.stringContaining('Another pod is running migrations'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('This pod will NOT exit.'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Lock released'));
    });

    it('should rethrow a real migration failure immediately instead of masking it as contention', async () => {
      const clock = fakeClock();
      const attempt = jest.fn().mockRejectedValue(pgError('23505', 'duplicate key value'));

      await expect(
        withLockContentionRetry('running migrations', attempt, options, { ...clock, log: jest.fn() })
      ).rejects.toThrow('duplicate key value');
      expect(attempt).toHaveBeenCalledTimes(1);
      expect(clock.slept).toEqual([]);
    });

    it('should give up once the ceiling is reached rather than waiting forever on a stuck pod', async () => {
      const clock = fakeClock();
      const attempt = jest.fn().mockRejectedValue(pgError('55P03'));

      await expect(
        withLockContentionRetry('probing', attempt, { ...options, maxWaitMs: 180_000 }, { ...clock, log: jest.fn() })
      ).rejects.toBeInstanceOf(MigrationLockWaitTimeoutError);
      // Attempts at 0s, 60s, 120s and once more on the 180s deadline; sleeping again would
      // overshoot the ceiling, so that fourth refusal is the one that gives up.
      expect(attempt).toHaveBeenCalledTimes(4);
    });

    it('should keep waiting past the default ceiling when maxWaitMs is 0', async () => {
      const clock = fakeClock();
      const attempt = jest.fn();
      // 40 refusals is well past the 30 minute default ceiling.
      for (let i = 0; i < 40; i++) attempt.mockRejectedValueOnce(pgError('55P03'));
      attempt.mockResolvedValue('done');

      await expect(
        withLockContentionRetry('probing', attempt, { ...options, maxWaitMs: 0 }, { ...clock, log: jest.fn() })
      ).resolves.toBe('done');
      expect(attempt).toHaveBeenCalledTimes(41);
    });

    it('should run beforeWait on every wait so the upgrade flag outlives a long queue', async () => {
      const clock = fakeClock();
      const beforeWait = jest.fn();
      const attempt = jest
        .fn()
        .mockRejectedValueOnce(pgError('55P03'))
        .mockRejectedValueOnce(pgError('55P03'))
        .mockResolvedValue(undefined);

      await withLockContentionRetry('probing', attempt, options, { ...clock, log: jest.fn(), beforeWait });

      expect(beforeWait).toHaveBeenCalledTimes(2);
    });
  });

  describe('withMigrationAdvisoryLock | only one pod reads the pending list at a time', () => {
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

    const noWait = { sleep: async () => undefined, now: () => 0, log: jest.fn() };

    it('should treat a busy lock as retryable contention, not a failure', () => {
      expect(isRetryableLockError(new MigrationLockBusyError())).toBe(true);
    });

    it('should hold the lock across the critical section and release it afterwards', async () => {
      const { dataSource, queryRunner, queries } = fakeDataSource([true]);
      const order: string[] = [];

      await withMigrationAdvisoryLock(dataSource, options, noWait, async () => {
        order.push('critical');
        return undefined;
      });

      expect(queries[0].sql).toContain('pg_try_advisory_lock');
      expect(order).toEqual(['critical']);
      expect(queries[queries.length - 1].sql).toContain('pg_advisory_unlock');
      // Same key both ways, or the lock would never be released.
      expect(queries[0].parameters).toEqual(queries[queries.length - 1].parameters);
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should wait its turn rather than running migrations alongside another pod', async () => {
      const { dataSource } = fakeDataSource([false, false, true]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, options, noWait, critical);

      expect(critical).toHaveBeenCalledTimes(1);
    });

    it('should never start the critical section while the lock is refused', async () => {
      const { dataSource } = fakeDataSource([false]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await expect(
        withMigrationAdvisoryLock(dataSource, { ...options, maxWaitMs: 1 }, noWait, critical)
      ).rejects.toBeInstanceOf(MigrationLockWaitTimeoutError);
      expect(critical).not.toHaveBeenCalled();
    });

    it('should release the lock when the migration fails, so the next pod is not locked out', async () => {
      const { dataSource, queries, queryRunner } = fakeDataSource([true]);

      await expect(
        withMigrationAdvisoryLock(dataSource, options, noWait, async () => {
          throw new Error('migration blew up');
        })
      ).rejects.toThrow('migration blew up');

      expect(queries.some(({ sql }) => sql.includes('pg_advisory_unlock'))).toBe(true);
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('probeMigrationsTable | a read that refuses to queue behind another pod', () => {
    function fakeDataSource(behaviour: { onSelect?: () => never } = {}) {
      const queries: Array<{ sql: string; parameters?: unknown[] }> = [];
      const queryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        query: jest.fn(async (sql: string, parameters?: unknown[]) => {
          queries.push({ sql, parameters });
          if (sql.includes('FROM migrations') && behaviour.onSelect) behaviour.onSelect();
          return [];
        }),
      };
      const dataSource = { createQueryRunner: () => queryRunner } as unknown as DataSource;
      return { dataSource, queryRunner, queries };
    }

    it('should scope the lock timeout to the probe transaction so it cannot cap the real migration', async () => {
      const { dataSource, queryRunner, queries } = fakeDataSource();

      await probeMigrationsTable(dataSource, '5s');

      // is_local => true: the setting dies with this transaction instead of riding the pooled
      // connection back out and capping the migration's own LOCK TABLE.
      expect(queries[0]).toEqual({ sql: expect.stringContaining("set_config('lock_timeout'"), parameters: ['5s'] });
      expect(queries[0].sql).toContain('true');
      expect(queries[1].sql).toContain('FROM migrations');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should surface a refused lock to the caller, who decides whether to wait', async () => {
      const { dataSource, queryRunner } = fakeDataSource({
        onSelect: () => {
          throw pgError('55P03');
        },
      });

      await expect(probeMigrationsTable(dataSource, '5s')).rejects.toMatchObject({ code: '55P03' });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should treat a missing migrations table as "nothing to wait for" on a fresh install', async () => {
      const { dataSource, queryRunner } = fakeDataSource({
        onSelect: () => {
          throw pgError('42P01', 'relation "migrations" does not exist');
        },
      });

      await expect(probeMigrationsTable(dataSource, '5s')).resolves.toBeUndefined();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
