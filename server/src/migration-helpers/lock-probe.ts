import { MigrationPhase } from './migration-mode';

/** A table lock one migration took, and whether the table existed before the run. */
export interface ProbedLock {
  table: string;
  mode: string;
  existed: boolean;
}

export type MigrationPart = 'up' | 'beforeCommit';

/**
 * Locks that stall the release still serving, per phase. Schema may take ACCESS EXCLUSIVE briefly (lock_timeout
 * bounds the wait) but not scan under a write-blocking lock. A data migration holds its locks for the whole run, so up()
 * only writes rows; its beforeCommit(), just before commit, may block writes but not reads. Cleanup steps are short anyway.
 */
const FORBIDDEN_ON_EXISTING_TABLES: Record<MigrationPhase, Record<MigrationPart, readonly string[]>> = {
  schema: { up: ['ShareLock', 'ShareRowExclusiveLock', 'ExclusiveLock'], beforeCommit: [] },
  data: {
    up: ['ShareUpdateExclusiveLock', 'ShareLock', 'ShareRowExclusiveLock', 'ExclusiveLock', 'AccessExclusiveLock'],
    beforeCommit: ['ExclusiveLock', 'AccessExclusiveLock'],
  },
  cleanup: { up: [], beforeCommit: [] },
};

export function classifyLocks(phase: MigrationPhase, part: MigrationPart, locks: readonly ProbedLock[]): string[] {
  const forbidden = FORBIDDEN_ON_EXISTING_TABLES[phase][part];
  return locks
    .filter(({ mode, existed }) => existed && forbidden.includes(mode))
    .map(({ table, mode }) => `${table}: ${mode}`);
}

export function phaseOfMigrationFile(file: string): MigrationPhase {
  if (file.includes('/cleanup/')) return 'cleanup';
  if (file.includes('/data/')) return 'data';
  return 'schema';
}
