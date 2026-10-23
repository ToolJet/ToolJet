import { DataSource } from 'typeorm';

/**
 * Turn-taking for pods that all boot at once during a rolling upgrade.
 *
 * Every pod runs the migration process on boot. The first one to get there takes an ACCESS
 * EXCLUSIVE lock on `migrations` (see `LockMigrationsTable1/2`) and holds it for the whole
 * schema+data transaction. Every other pod's first query against that table blocks behind the
 * lock, and on any deployment that enforces a `statement_timeout` / `lock_timeout` that block
 * became an error, a non-zero exit and a container restart — so the pods crash-looped until
 * the migration finished.
 *
 * Two mechanisms here, and the order matters:
 *   - `withMigrationAdvisoryLock` serialises pods BEFORE any of them reads the pending
 *     migration list. That table lock is taken too late to do this job — see its doc comment.
 *   - `probeMigrationsTable` + `withLockContentionRetry` treat "someone else is migrating" as
 *     an expected condition: probe under a short, transaction-local lock timeout, and when
 *     refused, sleep and probe again rather than exiting.
 *
 * Genuine migration errors still fail fast — only lock/timeout/connection errors are retried.
 */

/** Hardcoded in LockMigrationsTable1/2 and in TypeORM's default config alike. */
const MIGRATIONS_TABLE = 'migrations';

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
export const DEFAULT_PROBE_LOCK_TIMEOUT = '5s';

export interface LockWaitOptions {
  /** How long to sleep between attempts. */
  retryIntervalMs: number;
  /** Give up after this long. `0` waits indefinitely. */
  maxWaitMs: number;
  /** PostgreSQL interval string applied to the probe only. */
  probeLockTimeout: string;
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
    probeLockTimeout: env.MIGRATION_LOCK_PROBE_TIMEOUT || DEFAULT_PROBE_LOCK_TIMEOUT,
  };
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
const MIGRATION_ADVISORY_LOCK_KEY = 6273975241000;

export class MigrationLockBusyError extends Error {
  constructor() {
    super('Another pod holds the ToolJet migration advisory lock.');
    this.name = 'MigrationLockBusyError';
  }
}

/**
 * Runs `critical` as the only migrating pod in the cluster, waiting its turn on the same
 * interval as every other kind of contention.
 */
export async function withMigrationAdvisoryLock<T>(
  dataSource: DataSource,
  options: LockWaitOptions,
  deps: LockWaitDeps,
  critical: () => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    await withLockContentionRetry(
      'acquiring the migration lock',
      async () => {
        const [{ locked }] = await queryRunner.query('SELECT pg_try_advisory_lock($1) AS locked', [
          MIGRATION_ADVISORY_LOCK_KEY,
        ]);
        if (!locked) throw new MigrationLockBusyError();
      },
      options,
      deps
    );

    try {
      return await critical();
    } finally {
      await queryRunner.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY]).catch(() => undefined);
    }
  } finally {
    await queryRunner.release().catch(() => undefined);
  }
}

export class MigrationLockWaitTimeoutError extends Error {
  constructor(
    label: string,
    waitedMs: number,
    readonly lastError: unknown
  ) {
    super(
      `Gave up ${label} after ${Math.round(waitedMs / 1000)}s. Another pod appears to be stuck holding the ` +
        `${MIGRATIONS_TABLE} table lock, or the database is unreachable. Last error: ${describe(lastError)}`
    );
    this.name = 'MigrationLockWaitTimeoutError';
  }
}

/**
 * SQLSTATEs that mean "come back later", not "this migration is broken".
 * 55P03 lock_not_available · 57014 query_canceled (statement_timeout) · 40P01 deadlock_detected
 * 57P03 cannot_connect_now · 53300 too_many_connections · 08xxx connection exceptions
 */
const RETRYABLE_SQL_STATES = new Set([
  '55P03',
  '57014',
  '40P01',
  '57P03',
  '53300',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
]);

const RETRYABLE_SYSTEM_ERRORS = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

/** pg/TypeORM surface some timeouts only as prose — match those too. */
const RETRYABLE_MESSAGE_PATTERNS = [
  /canceling statement due to statement timeout/i,
  /canceling statement due to lock timeout/i,
  /could not obtain lock/i,
  /connection terminated/i,
  /connection timeout/i,
  /timeout exceeded when trying to connect/i,
  /server closed the connection unexpectedly/i,
];

/** 42P01 undefined_table — a fresh database that has no `migrations` table yet. */
export function isUndefinedTableError(error: unknown): boolean {
  return errorCodes(error).includes('42P01');
}

export function isRetryableLockError(error: unknown): boolean {
  if (error instanceof MigrationLockBusyError) return true;
  if (isUndefinedTableError(error)) return false;
  if (errorCodes(error).some((code) => RETRYABLE_SQL_STATES.has(code) || RETRYABLE_SYSTEM_ERRORS.has(code))) {
    return true;
  }
  const message = describe(error);
  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Reads one row from `migrations` under a short lock timeout.
 *
 * The timeout is set with `set_config(..., is_local => true)` inside a transaction so it dies
 * with that transaction. A session-level `SET` would ride the pooled connection back out and
 * silently cap the real migration's own `LOCK TABLE` at the probe's timeout.
 */
export async function probeMigrationsTable(dataSource: DataSource, lockTimeout: string): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SELECT set_config('lock_timeout', $1, true)`, [lockTimeout]);
      await queryRunner.query(`SELECT 1 FROM ${MIGRATIONS_TABLE} LIMIT 1`);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction().catch(() => undefined);
      // No table yet means nothing can be holding it: a fresh install has nothing to wait for.
      if (isUndefinedTableError(error)) return;
      throw error;
    }
  } finally {
    await queryRunner.release().catch(() => undefined);
  }
}

/**
 * Runs `attempt`, retrying while it fails for a reason that another pod's migration would
 * explain. Non-retryable failures propagate immediately so a broken migration still fails the
 * deploy.
 */
export async function withLockContentionRetry<T>(
  label: string,
  attempt: () => Promise<T>,
  options: LockWaitOptions,
  deps: LockWaitDeps & { beforeWait?: () => Promise<void> | void } = {}
): Promise<T> {
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((message: string) => console.log(message));

  const startedAt = now();
  for (let attemptNumber = 1; ; attemptNumber++) {
    try {
      const result = await attempt();
      if (attemptNumber > 1) {
        log(
          `[migrations] Lock released — ${label} succeeded on attempt ${attemptNumber} ` +
            `after waiting ${seconds(now() - startedAt)}s.`
        );
      }
      return result;
    } catch (error) {
      if (!isRetryableLockError(error)) throw error;

      const waitedMs = now() - startedAt;
      if (options.maxWaitMs > 0 && waitedMs + options.retryIntervalMs > options.maxWaitMs) {
        throw new MigrationLockWaitTimeoutError(label, waitedMs, error);
      }

      log(
        `[migrations] Another pod is running migrations (attempt ${attemptNumber} of ${label} was refused: ` +
          `${describe(error)}). Waited ${seconds(waitedMs)}s so far; retrying in ` +
          `${seconds(options.retryIntervalMs)}s. This pod will NOT exit.`
      );
      await deps.beforeWait?.();
      await sleep(options.retryIntervalMs);
    }
  }
}

function errorCodes(error: unknown): string[] {
  const candidate = error as { code?: unknown; driverError?: { code?: unknown } };
  return [candidate?.code, candidate?.driverError?.code].filter((code): code is string => typeof code === 'string');
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
