/** @group gitsync */
import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { closeTestApp, getDefaultDataSource, initTestApp } from 'test-helper';
import { AddPullCommitTrackingColumns1793250000600 } from '../../../../migrations/1793250000600-AddPullCommitTrackingColumns';

jest.setTimeout(60_000);

/**
 * The migration only adds nullable columns, so released code keeps working and no backfill is
 * needed: existing rows read as "commit unknown".
 *
 * The migration names its tables without a schema, so it runs here against session temp copies,
 * which shadow the real tables on this connection. Altering the real tables would need an
 * ACCESS EXCLUSIVE lock, and other spec files hold row locks on them in their suite transactions
 * for as long as they run, which deadlocks when Jest runs them side by side.
 */
describe('AddPullCommitTrackingColumns1793250000600 (TC-30)', () => {
  let nestApp: INestApplication;
  const migration = new AddPullCommitTrackingColumns1793250000600();
  const COLUMNS = {
    organization_git_sync_branches: ['workspace_pull_commit_sha', 'workspace_pull_commit_message', 'workspace_pull_at'],
    app_versions: ['synced_commit_sha', 'synced_commit_message', 'synced_at'],
  };
  const TABLES = Object.keys(COLUMNS) as (keyof typeof COLUMNS)[];

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  const columnsOf = async (queryRunner: QueryRunner, table: keyof typeof COLUMNS) =>
    (
      await queryRunner.query(
        `SELECT column_name, is_nullable, data_type FROM information_schema.columns
          WHERE table_schema = pg_my_temp_schema()::regnamespace::text
            AND table_name = $1 AND column_name = ANY($2::text[])
          ORDER BY column_name`,
        [table, COLUMNS[table]]
      )
    ).map((c: { column_name: string; is_nullable: string; data_type: string }) => ({
      name: c.column_name,
      nullable: c.is_nullable === 'YES',
      type: c.data_type,
    }));

  /**
   * Runs fn on a connection where both tables are temp copies of the real ones: same columns,
   * no rows, no constraints, so a bare row can stand in for an existing one. Dropped at the end.
   */
  const withTempTables = async (fn: (queryRunner: QueryRunner) => Promise<void>) => {
    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    try {
      for (const table of TABLES) {
        await queryRunner.query(`CREATE TEMP TABLE ${table} AS SELECT * FROM public.${table} WITH NO DATA`);
      }
      await fn(queryRunner);
    } finally {
      for (const table of TABLES) await queryRunner.query(`DROP TABLE IF EXISTS pg_temp.${table}`);
      await queryRunner.release();
    }
  };

  it('should remove the six columns on down and add them back as nullable on up', async () => {
    await withTempTables(async (queryRunner) => {
      await migration.down(queryRunner);
      expect(await columnsOf(queryRunner, 'organization_git_sync_branches')).toEqual([]);
      expect(await columnsOf(queryRunner, 'app_versions')).toEqual([]);

      await migration.up(queryRunner);
      expect(await columnsOf(queryRunner, 'organization_git_sync_branches')).toEqual([
        { name: 'workspace_pull_at', nullable: true, type: 'timestamp with time zone' },
        { name: 'workspace_pull_commit_message', nullable: true, type: 'text' },
        { name: 'workspace_pull_commit_sha', nullable: true, type: 'character varying' },
      ]);
      expect(await columnsOf(queryRunner, 'app_versions')).toEqual([
        { name: 'synced_at', nullable: true, type: 'timestamp with time zone' },
        { name: 'synced_commit_message', nullable: true, type: 'text' },
        { name: 'synced_commit_sha', nullable: true, type: 'character varying' },
      ]);
    });
  });

  it('should leave rows that existed before the migration null (no backfill)', async () => {
    await withTempTables(async (queryRunner) => {
      await migration.down(queryRunner);
      await queryRunner.query(`INSERT INTO app_versions (id) VALUES (gen_random_uuid())`);
      await queryRunner.query(`INSERT INTO organization_git_sync_branches (id) VALUES (gen_random_uuid())`);

      await migration.up(queryRunner);

      expect(
        await queryRunner.query(`SELECT synced_commit_sha, synced_commit_message, synced_at FROM app_versions`)
      ).toEqual([{ synced_commit_sha: null, synced_commit_message: null, synced_at: null }]);
      expect(
        await queryRunner.query(
          `SELECT workspace_pull_commit_sha, workspace_pull_commit_message, workspace_pull_at
             FROM organization_git_sync_branches`
        )
      ).toEqual([{ workspace_pull_commit_sha: null, workspace_pull_commit_message: null, workspace_pull_at: null }]);
    });
  });

  it('should be safe to run up twice', async () => {
    await withTempTables(async (queryRunner) => {
      await migration.up(queryRunner);
      await expect(migration.up(queryRunner)).resolves.toBeUndefined();
    });
  });
});
