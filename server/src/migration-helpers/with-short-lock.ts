import { QueryRunner } from 'typeorm';
import { isLockNotAvailableError } from './migration-locks';

/** Below the server pool's 5000 ms (ASYNC_MODE_LOCK_TIMEOUT_MS), so readers queued behind a step give up after it does. */
export const SHORT_LOCK_TIMEOUT_MS = 2000;

export interface LockRetryPolicy {
  lockTimeoutMs: number;
  /** Total tries, first included. */
  attempts: number;
  retryDelayMs: number;
}

const SHORT_LOCK_POLICY: LockRetryPolicy = { lockTimeoutMs: SHORT_LOCK_TIMEOUT_MS, attempts: 10, retryDelayMs: 2000 };

const quote = (identifier: string) => `"${identifier}"`;

/** CHECK NOT VALID → VALIDATE → SET NOT NULL (PG 12+ skips the scan for a valid check) → drop the check. */
export function notNullSteps(table: string, column: string): string[][] {
  const alter = `ALTER TABLE ${quote(table)}`;
  const check = quote(`${table}_${column}_not_null`);
  return [
    [
      `${alter} DROP CONSTRAINT IF EXISTS ${check}, ADD CONSTRAINT ${check} CHECK (${quote(column)} IS NOT NULL) NOT VALID`,
    ],
    [`${alter} VALIDATE CONSTRAINT ${check}`],
    [`${alter} ALTER COLUMN ${quote(column)} SET NOT NULL`, `${alter} DROP CONSTRAINT IF EXISTS ${check}`],
  ];
}

/** Retries `work` while `retryable(error)`; any other error, or the last attempt, throws. */
export async function retryWhen<T>(
  retryable: (error: unknown) => boolean,
  work: () => Promise<T>,
  { attempts, retryDelayMs }: Pick<LockRetryPolicy, 'attempts' | 'retryDelayMs'>,
  onRetry: (nextAttempt: number) => void = () => undefined
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      if (!retryable(error) || attempt >= attempts) throw error;
      onRetry(attempt + 1);
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

export const retryOnLockTimeout = <T>(
  work: () => Promise<T>,
  policy: Pick<LockRetryPolicy, 'attempts' | 'retryDelayMs'>,
  onRetry?: (nextAttempt: number) => void
): Promise<T> => retryWhen(isLockNotAvailableError, work, policy, onRetry);

/**
 * Runs one step in its own short transaction: waits at most `lockTimeoutMs` for a lock, so readers queued
 * behind it are not stalled, and retries on a lock timeout. Inside a transaction the caller opened
 * (single-transaction run) it runs inline. Statements must be safe to run twice.
 */
export async function withShortLock(
  queryRunner: QueryRunner,
  step: readonly string[],
  policy: Partial<LockRetryPolicy> = {}
): Promise<void> {
  if (queryRunner.isTransactionActive) {
    for (const sql of step) await queryRunner.query(sql);
    return;
  }
  const { lockTimeoutMs, ...retry } = { ...SHORT_LOCK_POLICY, ...policy };
  await retryOnLockTimeout(
    async () => {
      await queryRunner.startTransaction();
      try {
        await queryRunner.query(`SET LOCAL lock_timeout = ${Number(lockTimeoutMs)}`);
        // VALIDATE scans the table; a role statement_timeout must not cancel it.
        await queryRunner.query('SET LOCAL statement_timeout = 0');
        for (const sql of step) await queryRunner.query(sql);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      }
    },
    retry,
    (nextAttempt) =>
      console.warn(
        `[migrations] A step waited over ${lockTimeoutMs}ms for a table lock; retrying (attempt ${nextAttempt} of ${retry.attempts}).`
      )
  );
}

export async function setNotNull(queryRunner: QueryRunner, table: string, column: string): Promise<void> {
  const [{ server_version_num }] = await queryRunner.query('SHOW server_version_num');
  if (Number(server_version_num) < 120000) {
    throw new Error(`setNotNull needs PostgreSQL 12 or later (found ${server_version_num}).`);
  }
  const steps = notNullSteps(table, column);
  try {
    for (const step of steps) await withShortLock(queryRunner, step);
  } catch (error) {
    // A NOT VALID check still refuses new NULL writes from the release that is serving.
    if (!queryRunner.isTransactionActive) await withShortLock(queryRunner, [steps[2][1]]);
    throw error;
  }
}
