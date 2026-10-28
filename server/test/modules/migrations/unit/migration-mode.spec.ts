/**
 * Covers: migration-helpers/migration-mode.ts
 * @group database
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS,
  blocksAsyncUpgrade,
  END_USER_MESSAGE_MAX_LENGTH,
  endUserMessage,
  getMigrationMode,
  isMigrationTrafficGateDisabled,
  parseMigrationPhase,
  planCleanup,
  runStrategy,
} from 'src/migration-helpers/migration-mode';

describe('migration-helpers/migration-mode', () => {
  describe('getMigrationMode(): blocking or async mode, read from the environment', () => {
    it.each([
      [{}, 'blocking'],
      [{ MIGRATION_MODE: 'async' }, 'async'],
      [{ MIGRATION_MODE: 'later' }, 'blocking'],
      [{ MIGRATION_MODE: 'async', TOOLJET_EDITION: 'cloud' }, 'async'],
      [{ TOOLJET_EDITION: 'cloud' }, 'blocking'],
    ])('should read %j as %s mode', (env, mode) => {
      expect(getMigrationMode(env)).toBe(mode);
    });
  });

  describe('endUserMessage(): the message app users see while an upgrade runs or after it fails', () => {
    // `KEY=` in a compose file is common, and must keep the default message.
    it.each([
      ['keep the default message when the configured one is blank', '   ', undefined],
      [
        'cut a long message to the maximum length',
        'a'.repeat(END_USER_MESSAGE_MAX_LENGTH + 50),
        'a'.repeat(END_USER_MESSAGE_MAX_LENGTH),
      ],
    ])('should %s', (_case, configured, shown) => {
      expect(endUserMessage('failed', { MIGRATION_END_USER_MESSAGE_FAILED: configured })).toBe(shown);
    });
  });

  describe('isMigrationTrafficGateDisabled(): opting out of pausing API traffic during an upgrade', () => {
    it('should opt out only when the variable is exactly "true"', () => {
      expect(isMigrationTrafficGateDisabled({ DISABLE_MIGRATION_TRAFFIC_GATE: 'true' })).toBe(true);
      expect(isMigrationTrafficGateDisabled({})).toBe(false);
      expect(isMigrationTrafficGateDisabled({ DISABLE_MIGRATION_TRAFFIC_GATE: 'false' })).toBe(false);
    });
  });

  describe('parseMigrationPhase(): which part of the upgrade a run applies', () => {
    it.each([
      [undefined, undefined, 'single-transaction'],
      ['', undefined, 'single-transaction'],
      ['schema', 'schema', 'multi-transaction'],
      ['data', 'data', 'multi-transaction'],
      ['cleanup', 'cleanup', 'multi-transaction'],
    ])('should read %j as phase %s, run as a %s run', (raw, phase, strategy) => {
      expect(parseMigrationPhase(raw)).toBe(phase);
      expect(runStrategy(parseMigrationPhase(raw))).toBe(strategy);
    });

    it.each(['Schema', 'joint', 'contract'])(
      'should reject the unknown phase %j instead of running everything in one transaction',
      (raw) => {
        expect(() => parseMigrationPhase(raw)).toThrow(`Unknown MIGRATION_PHASE '${raw}'`);
      }
    );
  });

  describe('planCleanup(): when a cleanup migration is allowed to run', () => {
    const cleanup = { name: 'DropOldIcon1799000000002', requires: 'StopReadingOldIcon1799000000001' };

    it.each([
      ['run', 'recorded by an earlier upgrade', new Map([['StopReadingOldIcon1799000000001', 40]]), 50],
      ['run', 'the last one recorded before this upgrade', new Map([['StopReadingOldIcon1799000000001', 50]]), 50],
      [
        'hold back',
        'recorded by this same upgrade (a release was skipped)',
        new Map([['StopReadingOldIcon1799000000001', 60]]),
        50,
      ],
      ['hold back', 'not recorded yet', new Map<string, number>(), 50],
      ['run', 'never recorded, because this is a fresh install', new Map<string, number>(), 0],
    ])(
      'should %s the cleanup when the migration it waits for was %s',
      (outcome, _when, recorded, lastBeforeUpgrade) => {
        const plan = planCleanup([cleanup], recorded, lastBeforeUpgrade);

        expect(outcome === 'run' ? plan.run : plan.deferred.map(({ name }) => name)).toEqual([cleanup.name]);
      }
    );

    it('should hold back a cleanup that does not say which migration it waits for', () => {
      expect(planCleanup([{ name: cleanup.name }], new Map(), 50).deferred).toEqual([
        { name: cleanup.name, waitingFor: 'a requires migration' },
      ]);
    });
  });

  describe('blocksAsyncUpgrade(): which pending migrations force the whole upgrade into one transaction', () => {
    it.each([
      ['LegacyWitness1700000000004', true],
      ['CopyWorkflowAppMetaToAppVersions1782250000000', false],
      ['ValidatePatWorkspaceShape1793100000000', false],
    ])('should say whether %s forces a single-transaction upgrade: %s', (name, blocks) => {
      expect(blocksAsyncUpgrade(name)).toBe(blocks);
    });

    it('should list only migrations that exist, so renaming one cannot quietly let an old database upgrade in async mode', () => {
      const root = join(__dirname, '../../../..');
      const classes = ['migrations/schema', 'migrations/data'].flatMap((dir) =>
        readdirSync(join(root, dir))
          .filter((file) => file.endsWith('.ts'))
          .map((file) => readFileSync(join(root, dir, file), 'utf8').match(/export class (\w+)/)?.[1])
      );
      expect([...ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS].filter((name) => !classes.includes(name))).toEqual([]);
    });
  });
});
