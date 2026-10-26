/** @group database */
import {
  END_USER_MESSAGE_MAX_LENGTH,
  endUserMessage,
  getMigrationMode,
  isMigrationTrafficGateDisabled,
  parseMigrationPhase,
} from 'src/migration-helpers/migration-status';

describe('migration-helpers/migration-status', () => {
  describe('getMigrationMode | who runs migrations', () => {
    it.each([
      [{}, 'blocking'],
      [{ MIGRATION_MODE: 'async' }, 'async'],
      [{ MIGRATION_MODE: 'later' }, 'blocking'],
      [{ MIGRATION_MODE: 'async', TOOLJET_EDITION: 'cloud' }, 'blocking'],
    ])('should read %j as %s', (env, mode) => {
      expect(getMigrationMode(env)).toBe(mode);
    });
  });

  describe('endUserMessage | operator text for released apps', () => {
    it('should read the variable for the state, trimmed', () => {
      const env = { MIGRATION_END_USER_MESSAGE_RUNNING: ' Back at 10pm. ', MIGRATION_END_USER_MESSAGE_FAILED: 'Running late.' };

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
      [undefined, 'joint'],
      ['', 'joint'],
      ['schema', 'schema'],
      ['data', 'data'],
    ])('should read %j as %s', (raw, phase) => {
      expect(parseMigrationPhase(raw)).toBe(phase);
    });

    it('should refuse anything else rather than fall back to a joint run', () => {
      expect(() => parseMigrationPhase('Schema')).toThrow("Unknown MIGRATION_PHASE 'Schema'");
    });
  });
});
