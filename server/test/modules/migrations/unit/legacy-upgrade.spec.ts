/** @group database */
import { readdirSync } from 'fs';
import { join } from 'path';
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';
import { BackfillMigration } from 'src/migration-helpers/migration-mode';
import { ContractLegacyBranchModel1793300000000 } from '../../../../migrations/contract/1793300000000-ContractLegacyBranchModel';
import {
  LEGACY_VARIANTS,
  useLegacyVariants,
  legacyUpgradePending,
  loosenStep,
  restoreSteps,
  LEGACY_UPGRADE_MARKER,
} from 'src/migration-helpers/legacy-upgrade';

describe('migration-helpers/legacy-upgrade | async upgrade from 3.21.58', () => {
  it('should run only while the 3.21.58 backfill is pending', () => {
    expect(legacyUpgradePending(['Other1700000000000', LEGACY_UPGRADE_MARKER])).toBe(true);
    expect(legacyUpgradePending(['Other1700000000000'])).toBe(false);
  });

  it.each([
    ['check', 'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk'],
    ['index', 'DROP INDEX IF EXISTS chk'],
  ] as const)('should save a %s before dropping it, keeping the first saved copy', (kind, drop) => {
    const [save, dropSql] = loosenStep({ name: 'chk', kind, table: 'app_versions' });
    expect(save).toMatch(/^INSERT INTO legacy_upgrade_dropped_rules .* ON CONFLICT \(name\) DO NOTHING$/s);
    expect(dropSql).toBe(drop);
  });

  it('should add a check back NOT VALID first, then validate it', () => {
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

  describe('variants', () => {
    const BACKFILL = join(__dirname, '../../../../migrations/backfill');
    const originals: BackfillMigration[] = readdirSync(BACKFILL)
      .filter((file) => LEGACY_VARIANTS.has(file.replace(/^(\d+)-(\w+)\.ts$/, '$2$1')))
      .map((file) => {
        const exports: Record<string, new () => MigrationInterface> = require(join(BACKFILL, file));
        return new (Object.values(exports)[0])();
      });

    const recorded = async (step: (queryRunner: QueryRunner) => Promise<void>): Promise<string[]> => {
      const statements: string[] = [];
      await step({ query: async (sql: string) => void statements.push(sql) } as unknown as QueryRunner);
      return statements;
    };

    it('should cover every variant with its original migration', () => {
      expect(originals).toHaveLength(LEGACY_VARIANTS.size);
    });

    it('should change rows and function bodies only in up(), leaving table locks to beforeCommit() and contract', async () => {
      useLegacyVariants({ migrations: originals } as unknown as DataSource);
      const ups = (await Promise.all(originals.map((migration) => recorded((qr) => migration.up(qr))))).flat();
      expect(ups.filter((sql) => /\b(DROP|ALTER TABLE|CREATE (UNIQUE )?INDEX|CREATE TRIGGER)\b/i.test(sql))).toEqual(
        []
      );
      const beforeCommitSteps = (
        await Promise.all(
          originals.filter((m) => m.beforeCommit).map((migration) => recorded((qr) => migration.beforeCommit(qr)))
        )
      ).flat();
      expect(beforeCommitSteps.slice(-1)[0]).toMatch(
        /ALTER TABLE app_versions\s+DROP CONSTRAINT IF EXISTS fk_app_versions_branch/
      );
    });
  });

  it.each(['data_source_versions', 'app_versions', 'folder_apps'])(
    'should give branchless %s rows a branch before contract sets NOT NULL',
    async (table) => {
      const statements: string[] = [];
      const queryRunner = {
        isTransactionActive: true,
        query: async (sql: string) => {
          statements.push(sql.replace(/\s+/g, ' ').replace(/"/g, ''));
          return [{ server_version_num: '160000' }];
        },
      } as unknown as QueryRunner;
      await new ContractLegacyBranchModel1793300000000().up(queryRunner);

      const notNull = statements.findIndex((sql) =>
        sql.includes(`ALTER TABLE ${table} ALTER COLUMN branch_id SET NOT NULL`)
      );
      const fixes = statements.filter(
        (sql, i) => i < notNull && new RegExp(`^ ?(UPDATE|DELETE FROM) ${table}\\b.*branch_id IS NULL`).test(sql)
      );
      expect(notNull).toBeGreaterThan(-1);
      expect(fixes).toEqual(expect.arrayContaining([expect.stringMatching(/SET branch_id = wb\.id/)]));
    }
  );
});
