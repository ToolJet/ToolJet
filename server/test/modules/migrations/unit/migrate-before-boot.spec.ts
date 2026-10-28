/** @group database */
import { migrateSchemaBeforeBoot } from 'src/migration-helpers/migrate-before-boot';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';

// The test database is migrated, so it is never a fresh install. The command stands in for setup.
const exitsZeroOnlyInSchemaPhase = `node -e "process.exit(process.env.MIGRATION_PHASE === 'schema' ? 0 : 7)"`;
const exitsZeroOnlyWithoutPhase = `node -e "process.exit(process.env.MIGRATION_PHASE ? 7 : 0)"`;
const scratch = (database: string) => ({
  host: postgres.host,
  port: postgres.port,
  user: postgres.username,
  password: postgres.password,
  database,
});

describe('migration-helpers/migrate-before-boot', () => {
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

    describe('on a fresh install | full setup, no MIGRATION_PHASE', () => {
      const emptyDatabase = `tooljet_async_mode_empty_${process.pid}`;
      const freshSetup = { MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: exitsZeroOnlyWithoutPhase };

      afterAll(() => dropScratchDatabase(emptyDatabase), 60_000);

      it('should run the full setup when the database does not exist', async () => {
        await expect(
          migrateSchemaBeforeBoot(freshSetup, scratch(`tooljet_async_mode_missing_${process.pid}`))
        ).resolves.toBeUndefined();
      });

      it('should run the full setup when the database has no migrations table', async () => {
        await createScratchDatabase(emptyDatabase);
        await expect(migrateSchemaBeforeBoot(freshSetup, scratch(emptyDatabase))).resolves.toBeUndefined();
      }, 60_000);
    });

    it('should fail the boot when the schema run fails', async () => {
      await expect(
        migrateSchemaBeforeBoot({ MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: 'exit 3' })
      ).rejects.toThrow('Migrations before boot failed (exit 3) and were rolled back.');
    });
  });
});
