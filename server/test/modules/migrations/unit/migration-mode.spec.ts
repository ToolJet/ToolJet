/** @group database */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS } from 'src/migration-helpers/pre-cutoff-allowlist';
import {
  blocksAsyncUpgrade,
  END_USER_MESSAGE_MAX_LENGTH,
  endUserMessage,
  getMigrationMode,
  isMigrationTrafficGateDisabled,
  parseMigrationPhase,
  runStrategy,
} from 'src/migration-helpers/migration-mode';

describe('migration-helpers/migration-mode', () => {
  describe('getMigrationMode | who runs migrations', () => {
    it.each([
      [{}, 'blocking'],
      [{ MIGRATION_MODE: 'async' }, 'async'],
      [{ MIGRATION_MODE: 'later' }, 'blocking'],
      [{ MIGRATION_MODE: 'async', TOOLJET_EDITION: 'cloud' }, 'async'],
      [{ TOOLJET_EDITION: 'cloud' }, 'blocking'],
    ])('should read %j as %s', (env, mode) => {
      expect(getMigrationMode(env)).toBe(mode);
    });
  });

  describe('endUserMessage | operator text for released apps', () => {
    it('should read the variable for the state, trimmed', () => {
      const env = {
        MIGRATION_END_USER_MESSAGE_RUNNING: ' Back at 10pm. ',
        MIGRATION_END_USER_MESSAGE_FAILED: 'Running late.',
      };

      expect(endUserMessage('running', env)).toBe('Back at 10pm.');
      expect(endUserMessage('failed', env)).toBe('Running late.');
    });

    it('should keep the built-in text when unset, blank, or the state shows no banner', () => {
      expect(endUserMessage('running', {})).toBeUndefined();
      expect(endUserMessage('running', { MIGRATION_END_USER_MESSAGE_RUNNING: '   ' })).toBeUndefined();
      expect(endUserMessage('idle', { MIGRATION_END_USER_MESSAGE_RUNNING: 'x' })).toBeUndefined();
    });

    it('should cap the length', () => {
      const env = { MIGRATION_END_USER_MESSAGE_FAILED: 'a'.repeat(END_USER_MESSAGE_MAX_LENGTH + 50) };

      expect(endUserMessage('failed', env)).toHaveLength(END_USER_MESSAGE_MAX_LENGTH);
    });
  });

  describe('isMigrationTrafficGateDisabled | the opt-out', () => {
    it('should be on only for the literal true', () => {
      expect(isMigrationTrafficGateDisabled({ DISABLE_MIGRATION_TRAFFIC_GATE: 'true' })).toBe(true);
      expect(isMigrationTrafficGateDisabled({})).toBe(false);
    });
  });

  describe('parseMigrationPhase | which part a run applies', () => {
    it.each([
      [undefined, undefined, 'single-transaction'],
      ['', undefined, 'single-transaction'],
      ['expand', 'expand', 'multi-transaction'],
      ['backfill', 'backfill', 'multi-transaction'],
      ['contract', 'contract', 'multi-transaction'],
    ])('should read %j as %s, run %s', (raw, phase, strategy) => {
      expect(parseMigrationPhase(raw)).toBe(phase);
      expect(runStrategy(parseMigrationPhase(raw))).toBe(strategy);
    });

    it.each(['Expand', 'schema', 'data'])(
      'should refuse %j rather than fall back to a single-transaction run',
      (raw) => {
        expect(() => parseMigrationPhase(raw)).toThrow(`Unknown MIGRATION_PHASE '${raw}'`);
      }
    );
  });
  describe('blocksAsyncUpgrade | which pending migrations force the one-transaction upgrade', () => {
    it.each([
      ['LegacyWitness1700000000004', true],
      ['CopyWorkflowAppMetaToAppVersions1782250000000', false],
      ['DropGitSyncMetaHashColumns1782500000000', false],
      ['ValidatePatWorkspaceShape1793100000000', false],
    ])('should say %s blocks the split upgrade: %s', (name, blocks) => {
      expect(blocksAsyncUpgrade(name)).toBe(blocks);
    });

    it('should list only migrations that exist, so a rename cannot silently send old databases async', () => {
      const root = join(__dirname, '../../../..');
      const classes = ['migrations/expand', 'migrations/backfill'].flatMap((dir) =>
        readdirSync(join(root, dir))
          .filter((file) => file.endsWith('.ts'))
          .map((file) => readFileSync(join(root, dir, file), 'utf8').match(/export class (\w+)/)?.[1])
      );
      expect([...ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS].filter((name) => !classes.includes(name))).toEqual([]);
    });
  });
});
