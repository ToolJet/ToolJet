/** @group database */
import { classifyLocks, phaseOfMigrationFile } from 'src/migration-helpers/lock-probe';

const lock = (mode: string, existed = true) => ({ table: 'apps', mode, existed });

describe('migration-helpers/lock-probe', () => {
  describe('classifyLocks | which locks would stall the release that is serving', () => {
    it.each([
      ['expand', 'up', 'AccessExclusiveLock', []],
      ['expand', 'up', 'ShareLock', ['apps: ShareLock']],
      ['backfill', 'up', 'RowExclusiveLock', []],
      ['backfill', 'up', 'ShareLock', ['apps: ShareLock']],
      ['backfill', 'up', 'AccessExclusiveLock', ['apps: AccessExclusiveLock']],
      ['backfill', 'tail', 'ShareLock', []],
      ['backfill', 'tail', 'ShareRowExclusiveLock', []],
      ['backfill', 'tail', 'AccessExclusiveLock', ['apps: AccessExclusiveLock']],
      ['contract', 'up', 'AccessExclusiveLock', []],
    ] as const)('should judge %s %s taking %s', (phase, part, mode, expected) => {
      expect(classifyLocks(phase, part, [lock(mode)])).toEqual(expected);
    });

    it('should allow any lock on a table the same run created', () => {
      expect(classifyLocks('backfill', 'up', [lock('AccessExclusiveLock', false)])).toEqual([]);
    });
  });

  describe('phaseOfMigrationFile | the phase a file runs in', () => {
    it.each([
      ['server/migrations/expand/1-A.ts', 'expand'],
      ['server/migrations/backfill/1-A.ts', 'backfill'],
      ['server/migrations/contract/1-A.ts', 'contract'],
    ])('should read %s as %s', (file, phase) => {
      expect(phaseOfMigrationFile(file)).toBe(phase);
    });
  });
});
