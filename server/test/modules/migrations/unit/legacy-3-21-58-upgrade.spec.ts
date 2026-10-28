/**
 * Covers: migration-helpers/legacy-3-21-58-upgrade.ts
 * @group database
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';
import { DataMigration } from 'src/migration-helpers/migration-mode';
import { CleanupLegacyBranchModel1793300000000 } from '@migrations/cleanup/1793300000000-CleanupLegacyBranchModel';
import {
  LEGACY_VARIANTS,
  useLegacyVariants,
  loosenStep,
  restoreSteps,
} from 'src/migration-helpers/legacy-3-21-58-upgrade';

describe('migration-helpers/legacy-3-21-58-upgrade', () => {
  it.each([
    ['check', 'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk'],
    ['index', 'DROP INDEX IF EXISTS chk'],
  ] as const)('should save a copy of a %s before dropping it, and keep the first copy when run again', (kind, drop) => {
    const [save, dropSql] = loosenStep({ name: 'chk', kind, table: 'app_versions' });
    expect(save).toMatch(/^INSERT INTO legacy_upgrade_dropped_rules .* ON CONFLICT \(name\) DO NOTHING$/s);
    expect(dropSql).toBe(drop);
  });

  it('should add a dropped check back without checking old rows, then check them in a second step', () => {
    const steps = restoreSteps({
      name: 'chk',
      kind: 'check',
      table_name: 'app_versions',
      definition: 'CHECK ((branch_id IS NULL)) NOT VALID',
    });
    expect(steps).toEqual([
      [
        'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk, ADD CONSTRAINT chk CHECK ((branch_id IS NULL)) NOT VALID',
      ],
      ['ALTER TABLE app_versions VALIDATE CONSTRAINT chk'],
    ]);
  });

  it('should rebuild an index only if it is missing', () => {
    const definition = 'CREATE UNIQUE INDEX idx ON public.app_versions USING btree (app_id)';
    expect(restoreSteps({ name: 'idx', kind: 'index', table_name: 'app_versions', definition })).toEqual([
      ['CREATE UNIQUE INDEX IF NOT EXISTS idx ON public.app_versions USING btree (app_id)'],
    ]);
  });

  describe('useLegacyVariants(): stand-ins for the data migrations a 3.21.58 database needs', () => {
    const BACKFILL = join(__dirname, '../../../../migrations/data');
    const originals: DataMigration[] = readdirSync(BACKFILL)
      .filter((file) => LEGACY_VARIANTS.has(file.replace(/^(\d+)-(\w+)\.ts$/, '$2$1')))
      .map((file) => {
        const exports: Record<string, new () => MigrationInterface> = require(join(BACKFILL, file));
        return new (Object.values(exports)[0])();
      });

    const statementsRunBy = async (step: (queryRunner: QueryRunner) => Promise<void>): Promise<string[]> => {
      const statements: string[] = [];
      await step({ query: async (sql: string) => void statements.push(sql) } as unknown as QueryRunner);
      return statements;
    };

    it('should find the original migration file for every stand-in', () => {
      expect(originals).toHaveLength(LEGACY_VARIANTS.size);
    });

    it('should only change rows and functions in up(), and leave table locks to beforeCommit() and cleanup', async () => {
      useLegacyVariants({ migrations: originals } as unknown as DataSource);

      const upStatements = (
        await Promise.all(originals.map((migration) => statementsRunBy((qr) => migration.up(qr))))
      ).flat();
      const beforeCommitStatements = (
        await Promise.all(
          originals
            .filter((m) => m.beforeCommit)
            .map((migration) => statementsRunBy((qr) => migration.beforeCommit(qr)))
        )
      ).flat();

      expect(
        upStatements.filter((sql) => /\b(DROP|ALTER TABLE|CREATE (UNIQUE )?INDEX|CREATE TRIGGER)\b/i.test(sql))
      ).toEqual([]);
      expect(beforeCommitStatements.slice(-1)[0]).toMatch(
        /ALTER TABLE app_versions\s+DROP CONSTRAINT IF EXISTS fk_app_versions_branch/
      );
    });
  });

  it.each(['data_source_versions', 'app_versions', 'folder_apps'])(
    'should give %s rows that have no branch a branch before cleanup makes the column required',
    async (table) => {
      const statements = await cleanupStatements();

      const setNotNullAt = statements.findIndex((sql) =>
        sql.includes(`ALTER TABLE ${table} ALTER COLUMN branch_id SET NOT NULL`)
      );
      const branchFixesBeforeIt = statements.filter(
        (sql, i) => i < setNotNullAt && new RegExp(`^ ?(UPDATE|DELETE FROM) ${table}\\b.*branch_id IS NULL`).test(sql)
      );

      expect(setNotNullAt).toBeGreaterThan(-1);
      expect(branchFixesBeforeIt).toEqual(expect.arrayContaining([expect.stringMatching(/SET branch_id = wb\.id/)]));
    }
  );
});

/** The SQL the real cleanup migration runs, whitespace collapsed and quotes dropped. */
async function cleanupStatements(): Promise<string[]> {
  const statements: string[] = [];
  const queryRunner = {
    isTransactionActive: true,
    query: async (sql: string) => {
      statements.push(sql.replace(/\s+/g, ' ').replace(/"/g, ''));
      return [{ server_version_num: '160000' }];
    },
  } as unknown as QueryRunner;
  await new CleanupLegacyBranchModel1793300000000().up(queryRunner);
  return statements;
}
