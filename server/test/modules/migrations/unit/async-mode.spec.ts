/** @group database */
import { migrateSchemaBeforeBoot } from 'src/migration-helpers/async-mode';

// The test database is migrated, so it is never a fresh install. The command stands in for setup.
const exitsZeroOnlyInSchemaPhase = `node -e "process.exit(process.env.MIGRATION_PHASE === 'schema' ? 0 : 7)"`;

describe('migration-helpers/async-mode', () => {
  describe('migrateSchemaBeforeBoot | schema before Nest boots', () => {
    beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('should run nothing in blocking mode: the entrypoint already migrated', async () => {
      await expect(migrateSchemaBeforeBoot({ MIGRATION_SETUP_COMMAND: 'exit 1' })).resolves.toBeUndefined();
    });

    it('should run setup with MIGRATION_PHASE=schema in async mode', async () => {
      await expect(
        migrateSchemaBeforeBoot({ MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: exitsZeroOnlyInSchemaPhase })
      ).resolves.toBeUndefined();
    });

    it('should fail the boot when the schema run fails', async () => {
      await expect(
        migrateSchemaBeforeBoot({ MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: 'exit 3' })
      ).rejects.toThrow('Schema migrations failed (exit 3).');
    });
  });
});
