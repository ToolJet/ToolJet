/** @group database */
import { classifyLocks, phaseOfMigrationFile } from 'src/migration-helpers/lock-probe';

const lock = (mode: string, existed = true) => ({ table: 'apps', mode, existed });

describe('migration-helpers/lock-probe', () => {
  describe('classifyLocks | which locks would stall the release that is serving', () => {
    it.each([
      ['schema', 'up', 'AccessExclusiveLock', []],
      ['schema', 'up', 'ShareLock', ['apps: ShareLock']],
      ['data', 'up', 'RowExclusiveLock', []],
      ['data', 'up', 'ShareLock', ['apps: ShareLock']],
      ['data', 'up', 'AccessExclusiveLock', ['apps: AccessExclusiveLock']],
      ['data', 'beforeCommit', 'ShareLock', []],
      ['data', 'beforeCommit', 'ShareRowExclusiveLock', []],
      ['data', 'beforeCommit', 'AccessExclusiveLock', ['apps: AccessExclusiveLock']],
      ['cleanup', 'up', 'AccessExclusiveLock', []],
    ] as const)('should judge %s %s taking %s', (phase, part, mode, expected) => {
      expect(classifyLocks(phase, part, [lock(mode)])).toEqual(expected);
    });

    it('should allow any lock on a table the same run created', () => {
      expect(classifyLocks('data', 'up', [lock('AccessExclusiveLock', false)])).toEqual([]);
    });
  });

  describe('phaseOfMigrationFile | the phase a file runs in', () => {
    it.each([
      ['server/migrations/schema/1-A.ts', 'schema'],
      ['server/migrations/data/1-A.ts', 'data'],
      ['server/migrations/cleanup/1-A.ts', 'cleanup'],
    ])('should read %s as %s', (file, phase) => {
      expect(phaseOfMigrationFile(file)).toBe(phase);
    });
  });
});
