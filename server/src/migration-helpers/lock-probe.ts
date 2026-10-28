import { MigrationPhase } from './migration-mode';

/** A table lock one migration took, and whether the table existed before the run. */
export interface ProbedLock {
  table: string;
  mode: string;
  existed: boolean;
}

export type MigrationPart = 'up' | 'tail';

/**
 * Locks that stall the release still serving, per phase. Expand may take ACCESS EXCLUSIVE briefly (lock_timeout
 * bounds the wait) but not scan under a write-blocking lock. A backfill holds its locks for the whole run, so up()
 * only writes rows; its tail, just before commit, may block writes but not reads. Contract steps are short anyway.
 */
const FORBIDDEN_ON_EXISTING_TABLES: Record<MigrationPhase, Record<MigrationPart, readonly string[]>> = {
  expand: { up: ['ShareLock', 'ShareRowExclusiveLock', 'ExclusiveLock'], tail: [] },
  backfill: {
    up: ['ShareUpdateExclusiveLock', 'ShareLock', 'ShareRowExclusiveLock', 'ExclusiveLock', 'AccessExclusiveLock'],
    tail: ['ExclusiveLock', 'AccessExclusiveLock'],
  },
  contract: { up: [], tail: [] },
};

export function classifyLocks(phase: MigrationPhase, part: MigrationPart, locks: readonly ProbedLock[]): string[] {
  const forbidden = FORBIDDEN_ON_EXISTING_TABLES[phase][part];
  return locks
    .filter(({ mode, existed }) => existed && forbidden.includes(mode))
    .map(({ table, mode }) => `${table}: ${mode}`);
}

export function phaseOfMigrationFile(file: string): MigrationPhase {
  if (file.includes('/contract/')) return 'contract';
  if (file.includes('/backfill/')) return 'backfill';
  return 'expand';
}
