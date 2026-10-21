import { DataSource } from 'typeorm';

/**
 * Turn-taking for pods that all boot at once during a rolling upgrade.
 *
 * Every pod runs the migration process on boot. `withMigrationAdvisoryLock` lets one of them in
 * before anyone reads the pending list; the rest wait on an interval instead of exiting into a
 * crash loop, then find nothing left to do. The winner also holds `MIGRATION_ACTIVE_LOCK_KEY`
 * while real migrations run, which is what serving pods read to refuse writes. Both are
 * session locks: a killed pod's locks go with its connection, so nothing can leak.
 */

/**
 * The two concurrency sentinels, present in BOTH migration dirs. Each deletes the other's row
 * so that exactly one of them is always pending — that is how the lock gets taken on every
 * boot. It also means they say nothing about whether a deploy has real work to do, so they are
 * filtered out before deciding whether to raise the upgrade gate. Counting them would answer
 * every ordinary pod restart and scale-up with 503.
 */
export const LOCK_SENTINEL_MIGRATION_NAMES: readonly string[] = [
  'LockMigrationsTable1234567890000',
  'LockMigrationsTable1234567891000',
];

export function excludeLockSentinels(migrationNames: string[]): string[] {
  return migrationNames.filter((name) => !LOCK_SENTINEL_MIGRATION_NAMES.includes(name));
}

export const DEFAULT_RETRY_INTERVAL_SECONDS = 60;
export const DEFAULT_MAX_WAIT_MINUTES = 30;

export interface LockWaitOptions {
  /** How long to sleep between attempts. */
  retryIntervalMs: number;
  /** Give up after this long. `0` waits indefinitely. */
  maxWaitMs: number;
}

export interface LockWaitDeps {
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  log?: (message: string) => void;
}

export function getLockWaitOptions(env: Record<string, string | undefined> = process.env): LockWaitOptions {
  return {
    retryIntervalMs: positiveNumber(env.MIGRATION_LOCK_RETRY_INTERVAL_SECONDS, DEFAULT_RETRY_INTERVAL_SECONDS) * 1000,
    maxWaitMs: nonNegativeNumber(env.MIGRATION_LOCK_MAX_WAIT_MINUTES, DEFAULT_MAX_WAIT_MINUTES) * 60 * 1000,
  };
}

export const SCHEMA_PHASE_RETRY_INTERVAL_SECONDS = 5;
export const DEFAULT_SCHEMA_LOCK_TIMEOUT_MS = 5000;
export const DEFAULT_SCHEMA_LOCK_RETRIES = 10;

export interface SchemaPhaseOptions {
  lockWait: LockWaitOptions;
  /** `lock_timeout` of the schema transaction. */
  lockTimeoutMs: number;
  /** Attempts before a lock timeout fails the phase. */
  lockAttempts: number;
}

/** MIGRATION_PHASE=schema: the run a booting pod waits on. */
export function getSchemaPhaseOptions(env: Record<string, string | undefined> = process.env): SchemaPhaseOptions {
  return {
    // Poll faster than the default unless the operator chose an interval.
    lockWait: getLockWaitOptions({
      ...env,
      MIGRATION_LOCK_RETRY_INTERVAL_SECONDS:
        env.MIGRATION_LOCK_RETRY_INTERVAL_SECONDS || String(SCHEMA_PHASE_RETRY_INTERVAL_SECONDS),
    }),
    lockTimeoutMs: Math.round(positiveNumber(env.MIGRATION_SCHEMA_LOCK_TIMEOUT_MS, DEFAULT_SCHEMA_LOCK_TIMEOUT_MS)),
    lockAttempts: positiveNumber(env.MIGRATION_SCHEMA_LOCK_RETRIES, DEFAULT_SCHEMA_LOCK_RETRIES),
  };
}

/** SQLSTATE 55P03 (lock_timeout hit), raw from pg or wrapped in TypeORM's QueryFailedError. */
export function isLockNotAvailableError(error: unknown): boolean {
  const { code, driverError } = (error ?? {}) as { code?: string; driverError?: { code?: string } };
  return (driverError?.code ?? code) === '55P03';
}

/**
 * Session-scoped advisory lock that serialises migration runs across pods.
 *
 * Why the `migrations` table lock is not enough on its own: `LockMigrationsTable1/2` take it
 * *inside* the migration transaction, by which point every pod has already computed its own
 * list of pending migrations. The pods that lose the race wake up holding a stale list and
 * re-run migrations the winner just applied — which fails with "already exists", not a lock
 * error, so it is not retryable and the pod dies. (Before this gate existed the crash-restart
 * is what hid the problem: a restarted pod re-reads a fresh list.)
 *
 * Taking an advisory lock BEFORE reading the pending list makes that race structurally
 * impossible. PostgreSQL releases the lock when the session ends, so a killed pod cannot leak
 * it — no TTL or recovery path needed.
 */
export const MIGRATION_ADVISORY_LOCK_KEY = 6273975241000;

/** Held only while real migrations run, so serving pods can refuse writes (`MigrationRunsService.status`). */
export const MIGRATION_ACTIVE_LOCK_KEY = 6273975241001;

/** Both locks as the database sees them: held by any live session, released when it ends. */
export const HELD_MIGRATION_LOCKS_SQL = `
  SELECT COALESCE(bool_or(k = ${MIGRATION_ADVISORY_LOCK_KEY}), false) AS running,
         COALESCE(bool_or(k = ${MIGRATION_ACTIVE_LOCK_KEY}), false) AS migrating
    FROM (SELECT (classid::bigint << 32) | objid::bigint AS k FROM pg_locks
           WHERE locktype = 'advisory' AND objsubid = 1 AND granted
             AND database = (SELECT oid FROM pg_database WHERE datname = current_database())) held`;

/** Postgres drops a silent client after about 60s (30s idle, then 3 probes 10s apart). Ignored on Unix sockets. */
export const DEAD_CLIENT_KEEPALIVE_SQL =
  'SET tcp_keepalives_idle = 30; SET tcp_keepalives_interval = 10; SET tcp_keepalives_count = 3';

/** Exit code of a runner that left the run to another server (MIGRATION_SKIP_IF_LOCKED). */
export const SKIPPED_EXIT_CODE = 75;

export interface LockSession {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

/**
 * Runs `critical` as the only migrating pod in the cluster. Waits for the lock, or with
 * `skipIfBusy` returns undefined at once. `critical` gets the lock's session, so it can take
 * more locks that die with it.
 */
export async function withMigrationAdvisoryLock<T>(
  dataSource: DataSource,
  options: LockWaitOptions,
  deps: LockWaitDeps,
  critical: (session: LockSession) => Promise<T>,
  { skipIfBusy = false }: { skipIfBusy?: boolean } = {}
): Promise<T | undefined> {
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((message: string) => console.log(message));
  const queryRunner = dataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    // The lock session idles while migrations run, so a crash releases the lock at once. A pod lost
    // without a FIN (node failure, partition) would hold it until the OS keepalive: about 2 hours.
    await queryRunner.query(DEAD_CLIENT_KEEPALIVE_SQL).catch(() => undefined);
    const startedAt = now();
    for (let attempt = 1; ; attempt++) {
      const [{ locked }] = await queryRunner.query('SELECT pg_try_advisory_lock($1) AS locked', [
        MIGRATION_ADVISORY_LOCK_KEY,
      ]);
      if (locked) {
        if (attempt > 1)
          log(`[migrations] Lock released; got the migration lock after ${seconds(now() - startedAt)}s.`);
        break;
      }
      if (skipIfBusy) return undefined;
      const waitedMs = now() - startedAt;
      if (options.maxWaitMs > 0 && waitedMs + options.retryIntervalMs > options.maxWaitMs) {
        throw new MigrationLockWaitTimeoutError(waitedMs);
      }
      log(
        `[migrations] Another pod is running migrations. Waited ${seconds(waitedMs)}s so far; ` +
          `retrying in ${seconds(options.retryIntervalMs)}s. This pod will NOT exit.`
      );
      await sleep(options.retryIntervalMs);
    }

    try {
      return await critical(queryRunner);
    } finally {
      await queryRunner.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY]).catch(() => undefined);
    }
  } finally {
    await queryRunner.release().catch(() => undefined);
  }
}

export class MigrationLockWaitTimeoutError extends Error {
  constructor(waitedMs: number) {
    super(
      `Gave up waiting for the migration lock after ${seconds(waitedMs)}s. Another pod is still migrating; ` +
        'raise MIGRATION_LOCK_MAX_WAIT_MINUTES (0 waits indefinitely) if its migrations take longer.'
    );
    this.name = 'MigrationLockWaitTimeoutError';
  }
}

function seconds(ms: number): number {
  return Math.round(ms / 1000);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function positiveNumber(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
