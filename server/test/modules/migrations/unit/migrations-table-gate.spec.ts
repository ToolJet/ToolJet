/** @group database */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  excludeLockSentinels,
  LOCK_SENTINEL_MIGRATION_NAMES,
  DEFAULT_MAX_WAIT_MINUTES,
  DEFAULT_RETRY_INTERVAL_SECONDS,
  getLockWaitOptions,
  LockWaitOptions,
  MigrationLockWaitTimeoutError,
  withMigrationAdvisoryLock,
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

    it('should report nothing pending when only the boot-time lock sentinel is, so writes are not refused', () => {
      expect(excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[0]])).toEqual([]);
      expect(excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[1]])).toEqual([]);
      expect(excludeLockSentinels([])).toEqual([]);
    });

    it('should report real migrations so the upgrade gate goes up for them', () => {
      expect(excludeLockSentinels([LOCK_SENTINEL_MIGRATION_NAMES[0], 'AddBranchIdToApps1783372800000'])).toEqual([
        'AddBranchIdToApps1783372800000',
      ]);
    });
  });

  describe('getLockWaitOptions | reads the operator-facing knobs', () => {
    it('should fall back to a 60s retry interval and a 30 minute ceiling when nothing is configured', () => {
      expect(getLockWaitOptions({})).toEqual({
        retryIntervalMs: DEFAULT_RETRY_INTERVAL_SECONDS * 1000,
        maxWaitMs: DEFAULT_MAX_WAIT_MINUTES * 60_000,
      });
    });

    it('should apply configured values', () => {
      expect(
        getLockWaitOptions({
          MIGRATION_LOCK_RETRY_INTERVAL_SECONDS: '15',
          MIGRATION_LOCK_MAX_WAIT_MINUTES: '5',
        })
      ).toEqual({ retryIntervalMs: 15_000, maxWaitMs: 300_000 });
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

    it('should retry on the configured interval, logging each wait so the pod is seen alive', async () => {
      const { dataSource } = fakeDataSource([false, false, true]);
      const clock = fakeClock();
      const log = jest.fn();

      await withMigrationAdvisoryLock(dataSource, options, { ...clock, log }, async () => undefined);

      expect(clock.slept).toEqual([60_000, 60_000]);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Another pod is running migrations'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('This pod will NOT exit.'));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Lock released'));
    });

    it('should give up once the ceiling is reached rather than waiting forever on a stuck pod', async () => {
      const { dataSource } = fakeDataSource(Array(10).fill(false));

      await expect(
        withMigrationAdvisoryLock(
          dataSource,
          { ...options, maxWaitMs: 180_000 },
          { ...fakeClock(), log: jest.fn() },
          jest.fn()
        )
      ).rejects.toBeInstanceOf(MigrationLockWaitTimeoutError);
    });

    it('should keep waiting past the default ceiling when maxWaitMs is 0', async () => {
      // 40 refusals is well past the 30 minute default ceiling.
      const { dataSource } = fakeDataSource([...Array(40).fill(false), true]);
      const critical = jest.fn().mockResolvedValue('done');

      await expect(
        withMigrationAdvisoryLock(
          dataSource,
          { ...options, maxWaitMs: 0 },
          { ...fakeClock(), log: jest.fn() },
          critical
        )
      ).resolves.toBe('done');
    });

    it('should hand the critical section the lock session, so locks it takes die with it', async () => {
      const { dataSource, queryRunner } = fakeDataSource([true]);
      const critical = jest.fn().mockResolvedValue(undefined);

      await withMigrationAdvisoryLock(dataSource, options, noWait, critical);

      expect(critical).toHaveBeenCalledWith(queryRunner);
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

    it('should skip without waiting when asked to and another server holds the lock', async () => {
      const { dataSource, queries } = fakeDataSource([false, true]);
      const critical = jest.fn().mockResolvedValue('ran');

      await expect(
        withMigrationAdvisoryLock(dataSource, options, noWait, critical, { skipIfBusy: true })
      ).resolves.toBeUndefined();
      expect(critical).not.toHaveBeenCalled();
      expect(queries.filter(({ sql }) => sql.includes('pg_try_advisory_lock'))).toHaveLength(1);
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
});
