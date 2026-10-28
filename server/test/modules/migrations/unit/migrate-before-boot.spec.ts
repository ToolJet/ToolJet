/**
 * Covers: migration-helpers/migrate-before-boot.ts, docker/LTS/cloud/cloud-entrypoint.sh
 * @group database
 */
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { migrateSchemaBeforeBoot } from 'src/migration-helpers/migrate-before-boot';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';

// --- Helpers ---

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
  describe('Cloud entrypoint: the commands it runs before the server starts', () => {
    const entrypoint = resolve(__dirname, '../../../../../docker/LTS/cloud/cloud-entrypoint.sh');
    let dir: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'cloud-entrypoint-'));
      mkdirSync(join(dir, 'bin'));
      mkdirSync(join(dir, 'server/scripts'), { recursive: true });
      // npm and wait-for-it only log, so nothing touches a database.
      writeFileSync(join(dir, 'bin/npm'), '#!/bin/bash\necho "npm $* phase=${MIGRATION_PHASE:-none}" >&2\n');
      writeFileSync(
        join(dir, 'server/scripts/wait-for-it.sh'),
        '#!/bin/bash\nwhile [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n'
      );
      chmodSync(join(dir, 'bin/npm'), 0o755);
      chmodSync(join(dir, 'server/scripts/wait-for-it.sh'), 0o755);
    });
    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    const runEntrypoint = (mode: string) => {
      const exported = execFileSync('bash', ['-c', `bash "${entrypoint}" printenv MIGRATION_SETUP_COMMAND 2>log`], {
        cwd: dir,
        env: { PATH: `${join(dir, 'bin')}:/usr/bin:/bin`, PG_HOST: 'localhost', MIGRATION_MODE: mode },
      }).toString();
      const log = readFileSync(join(dir, 'log'), 'utf8');
      return { exported: exported.trim().split('\n').pop(), log };
    };

    it('should hand the server a setup command that only migrates the database', () => {
      expect(runEntrypoint('async').exported).toBe('npm run db:setup');
    });

    it.each([
      ['async', 'npm run db:setup phase=schema'],
      ['blocking', 'npm run db:setup phase=none'],
    ])('should migrate the database before installing plugins in %s mode', (mode, setup) => {
      const lines = runEntrypoint(mode)
        .log.split('\n')
        .filter((line) => line.startsWith('npm run'));
      expect(lines).toEqual([
        setup,
        'npm run plugins:install phase=none',
        'npm run plugins:uninstall phase=none',
        'npm run plugins:reload phase=none',
      ]);
    });
  });

  describe('migrateSchemaBeforeBoot(): schema migrations before the server starts', () => {
    beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('should run nothing in blocking mode, because the entrypoint already migrated', async () => {
      await expect(migrateSchemaBeforeBoot({ MIGRATION_SETUP_COMMAND: 'exit 1' })).resolves.toBeUndefined();
    });

    it('should run only the schema migrations in async mode', async () => {
      await expect(
        migrateSchemaBeforeBoot({ MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: exitsZeroOnlyInSchemaPhase })
      ).resolves.toBeUndefined();
    });

    describe('on a fresh install: the full setup, not just the schema', () => {
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

    it('should stop the server from starting when the schema migrations fail', async () => {
      await expect(
        migrateSchemaBeforeBoot({ MIGRATION_MODE: 'async', MIGRATION_SETUP_COMMAND: 'exit 3' })
      ).rejects.toThrow('Migrations before boot failed (exit 3) and were rolled back.');
    });
  });
});
