/** @group database */
import { getMigrationMode, isMigrationTrafficGateDisabled } from 'src/migration-helpers/migration-status';

describe('migration-helpers/migration-status', () => {
  describe('getMigrationMode | who runs migrations', () => {
    it.each([
      [{}, 'blocking'],
      [{ MIGRATION_MODE: 'async' }, 'async'],
      [{ MIGRATION_MODE: 'manual' }, 'manual'],
      [{ MIGRATION_MODE: 'later' }, 'blocking'],
      [{ MIGRATION_MODE: 'manual', TOOLJET_EDITION: 'cloud' }, 'blocking'],
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
});
