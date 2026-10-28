/**
 * Covers: migration-helpers/lock-probe.ts
 * @group database
 */
import { classifyLocks, phaseOfMigrationFile } from 'src/migration-helpers/lock-probe';

describe('migration-helpers/lock-probe', () => {
  describe('classifyLocks() and phaseOfMigrationFile(): which table locks each phase may take', () => {
    it.each([
      { phase: 'schema', part: 'up', sql: 'ADD COLUMN', lock: 'AccessExclusiveLock', verdict: 'allow' },
      { phase: 'schema', part: 'up', sql: 'CREATE INDEX', lock: 'ShareLock', verdict: 'reject' },
      { phase: 'data', part: 'up', sql: 'UPDATE', lock: 'RowExclusiveLock', verdict: 'allow' },
      { phase: 'data', part: 'up', sql: 'CREATE INDEX', lock: 'ShareLock', verdict: 'reject' },
      { phase: 'data', part: 'up', sql: 'DROP or SET NOT NULL', lock: 'AccessExclusiveLock', verdict: 'reject' },
      { phase: 'data', part: 'beforeCommit', sql: 'CREATE INDEX', lock: 'ShareLock', verdict: 'allow' },
      {
        phase: 'data',
        part: 'beforeCommit',
        sql: 'CREATE TRIGGER or FOREIGN KEY',
        lock: 'ShareRowExclusiveLock',
        verdict: 'allow',
      },
      { phase: 'data', part: 'beforeCommit', sql: 'DROP', lock: 'AccessExclusiveLock', verdict: 'reject' },
      { phase: 'cleanup', part: 'up', sql: 'DROP via withShortLock', lock: 'AccessExclusiveLock', verdict: 'allow' },
    ] as const)(
      "should $verdict $sql ($lock on an existing table) in a $phase migration's $part()",
      ({ phase, part, lock, verdict }) => {
        const locks = [{ table: 'apps', mode: lock, existed: true }];

        expect(classifyLocks(phase, part, locks)).toEqual(verdict === 'reject' ? [`apps: ${lock}`] : []);
      }
    );

    it('should allow any lock on a table the same run created', () => {
      expect(classifyLocks('data', 'up', [{ table: 'apps', mode: 'AccessExclusiveLock', existed: false }])).toEqual([]);
    });

    it.each([
      ['server/migrations/schema/1-A.ts', 'schema'],
      ['server/migrations/data/1-A.ts', 'data'],
      ['server/migrations/cleanup/1-A.ts', 'cleanup'],
    ])('should read the phase of %s as %s', (file, phase) => {
      expect(phaseOfMigrationFile(file)).toBe(phase);
    });
  });
});
