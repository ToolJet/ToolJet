/** @group database */
import {
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
