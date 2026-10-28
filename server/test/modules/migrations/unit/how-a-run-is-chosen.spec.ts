/**
 * Covers: migration-helpers/migration-mode.ts, migrate-before-boot.ts, enum-value-additions.ts,
 * docker/LTS/cloud/cloud-entrypoint.sh
 * @group database
 */
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { Migration } from 'typeorm';
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
import { bareTypeName, extractEnumValueAdditions } from 'src/migration-helpers/enum-value-additions';
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

// Builds a Migration-shaped stub whose up().toString() contains `sql` as a literal,
// mimicking how real migrations embed SQL and how extractEnumValueAdditions reads it
// via Function.prototype.toString(). We override toString directly so the SQL lands in
// the source text verbatim (a closure variable would only show up as `${sql}`).
function migrationWithUpSql(name: string, sql: string): Migration {
  const up = (async () => undefined) as (...args: unknown[]) => Promise<unknown>;
  up.toString = () => `async up(queryRunner) { await queryRunner.query(\`${sql}\`); }`;
  return { name, instance: { up, down: async () => undefined } } as unknown as Migration;
}

describe('migration-helpers/migration-mode', () => {
  describe('Cloud entrypoint | what it runs before boot', () => {
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

    const boot = (mode: string) => {
      const exported = execFileSync('bash', ['-c', `bash "${entrypoint}" printenv MIGRATION_SETUP_COMMAND 2>log`], {
        cwd: dir,
        env: { PATH: `${join(dir, 'bin')}:/usr/bin:/bin`, PG_HOST: 'localhost', MIGRATION_MODE: mode },
      }).toString();
      const log = readFileSync(join(dir, 'log'), 'utf8');
      return { exported: exported.trim().split('\n').pop(), log };
    };

    it('should give the server a database-only setup command', () => {
      expect(boot('async').exported).toBe('npm run db:setup');
    });

    it.each([
      ['async', 'npm run db:setup phase=schema'],
      ['blocking', 'npm run db:setup phase=none'],
    ])('should apply the schema before the plugin steps in %s mode', (mode, setup) => {
      const lines = boot(mode)
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
      ['schema', 'schema', 'multi-transaction'],
      ['data', 'data', 'multi-transaction'],
      ['cleanup', 'cleanup', 'multi-transaction'],
    ])('should read %j as %s, run %s', (raw, phase, strategy) => {
      expect(parseMigrationPhase(raw)).toBe(phase);
      expect(runStrategy(parseMigrationPhase(raw))).toBe(strategy);
    });

    it.each(['Schema', 'joint', 'contract'])(
      'should refuse %j rather than fall back to a single-transaction run',
      (raw) => {
        expect(() => parseMigrationPhase(raw)).toThrow(`Unknown MIGRATION_PHASE '${raw}'`);
      }
    );
  });
  describe('planCleanup | removals wait until an earlier upgrade ran the release that stopped using them', () => {
    const cleanup = { name: 'DropOldIcon1799000000002', requires: 'StopReadingOldIcon1799000000001' };

    it.each([
      ['recorded by an earlier upgrade', new Map([['StopReadingOldIcon1799000000001', 40]]), 50, 'run'],
      [
        'recorded as the last migration before this upgrade',
        new Map([['StopReadingOldIcon1799000000001', 50]]),
        50,
        'run',
      ],
      [
        'recorded by this upgrade (a skipped release)',
        new Map([['StopReadingOldIcon1799000000001', 60]]),
        50,
        'deferred',
      ],
      ['not recorded yet', new Map<string, number>(), 50, 'deferred'],
      ['on a fresh install', new Map<string, number>(), 0, 'run'],
    ])('should %s → %s', (_when, recorded, baseline, outcome) => {
      const plan = planCleanup([cleanup], recorded, baseline);
      expect(outcome === 'run' ? plan.run : plan.deferred.map(({ name }) => name)).toEqual([cleanup.name]);
    });

    it('should hold back a cleanup that names no requires migration', () => {
      expect(planCleanup([{ name: cleanup.name }], new Map(), 50).deferred).toEqual([
        { name: cleanup.name, waitingFor: 'a requires migration' },
      ]);
    });
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
      const classes = ['migrations/schema', 'migrations/data'].flatMap((dir) =>
        readdirSync(join(root, dir))
          .filter((file) => file.endsWith('.ts'))
          .map((file) => readFileSync(join(root, dir, file), 'utf8').match(/export class (\w+)/)?.[1])
      );
      expect([...ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS].filter((name) => !classes.includes(name))).toEqual([]);
    });
  });
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

describe('migration-helpers/enum-value-additions', () => {
  describe('bareTypeName', () => {
    it('should return an unquoted, un-schema-qualified type name for every form', () => {
      expect(bareTypeName('source')).toBe('source');
      expect(bareTypeName('"resource_type"')).toBe('resource_type');
      expect(bareTypeName('"public"."resource_type"')).toBe('resource_type');
    });
  });

  describe('extractEnumValueAdditions', () => {
    // One case per real migration SQL form shipped in server/migrations, so a future
    // regex tweak that stops matching any variant fails here.
    it.each([
      [`ALTER TYPE source ADD VALUE 'openid'`, 'source', 'openid'],
      [`ALTER TYPE "page_type_enum" ADD VALUE 'custom';`, 'page_type_enum', 'custom'],
      [`ALTER TYPE "git_type" ADD VALUE 'gitlab';`, 'git_type', 'gitlab'],
      [`ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'folder';`, 'resource_type', 'folder'],
      [`ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow';`, 'resource_type', 'workflow'],
      [`ALTER TYPE "app_type" ADD VALUE IF NOT EXISTS 'module';`, 'app_type', 'module'],
      [
        `ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder';`,
        'resource_type',
        'workflow_folder',
      ],
    ])('should extract %s', (sql, typeName, value) => {
      const [addition, ...rest] = extractEnumValueAdditions([migrationWithUpSql('M1', sql)]);
      expect(rest).toHaveLength(0);
      expect(addition).toMatchObject({ typeName, value, migrationName: 'M1' });
    });

    it('should preserve the schema-qualified type expression verbatim for the ALTER statement', () => {
      const [addition] = extractEnumValueAdditions([
        migrationWithUpSql('M1', `ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder'`),
      ]);
      expect(addition.typeExpression).toBe('"public"."resource_type"');
    });

    it('should extract every addition when one migration adds several values', () => {
      const sql = `
        ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow';
        ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder';
      `;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toMatchObject([
        { value: 'workflow' },
        { value: 'workflow_folder' },
      ]);
    });

    it('should ignore CREATE TYPE — only ALTER TYPE ADD VALUE is pre-committed', () => {
      const sql = `CREATE TYPE "app_type" AS ENUM ('front-end', 'workflow');`;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toEqual([]);
    });

    it('should skip migrations without an up() implementation', () => {
      const noUp = { name: 'M1', instance: undefined } as unknown as Migration;
      expect(extractEnumValueAdditions([noUp])).toEqual([]);
    });

    it('should return nothing for a migration that touches no enum', () => {
      const sql = `ALTER TABLE "permission_groups" ADD COLUMN "workflow_folder_create" boolean NOT NULL DEFAULT false;`;
      expect(extractEnumValueAdditions([migrationWithUpSql('M1', sql)])).toEqual([]);
    });
  });
});
