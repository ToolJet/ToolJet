/** @group gitsync */
import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { closeTestApp, getDefaultDataSource, initTestApp } from 'test-helper';
import { AddPullCommitTrackingColumns1793250000600 } from '../../../../migrations/1793250000600-AddPullCommitTrackingColumns';

jest.setTimeout(60_000);

/**
 * The migration only adds nullable columns, so released code keeps working and no backfill is
 * needed: existing rows read as "commit unknown". Driven through down()/up() inside a transaction
 * that is rolled back, so the shared test schema is untouched.
 */
describe('AddPullCommitTrackingColumns1793250000600 (TC-30)', () => {
  let nestApp: INestApplication;
  const migration = new AddPullCommitTrackingColumns1793250000600();
  const COLUMNS = {
    organization_git_sync_branches: ['workspace_pull_commit_sha', 'workspace_pull_commit_message', 'workspace_pull_at'],
    app_versions: ['synced_commit_sha', 'synced_commit_message', 'synced_at'],
  };

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60000);

  const columnsOf = async (queryRunner: QueryRunner, table: string) =>
    (
      await queryRunner.query(
        `SELECT column_name, is_nullable, data_type FROM information_schema.columns
          WHERE table_name = $1 AND column_name = ANY($2::text[]) ORDER BY column_name`,
        [table, COLUMNS[table as keyof typeof COLUMNS]]
      )
    ).map((c: { column_name: string; is_nullable: string; data_type: string }) => ({
      name: c.column_name,
      nullable: c.is_nullable === 'YES',
      type: c.data_type,
    }));

  const inRolledBackTransaction = async (fn: (queryRunner: QueryRunner) => Promise<void>) => {
    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await fn(queryRunner);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  };

  it('should remove the six columns on down and add them back as nullable on up', async () => {
    await inRolledBackTransaction(async (queryRunner) => {
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

  it('should leave existing rows null after up (no backfill)', async () => {
    await inRolledBackTransaction(async (queryRunner) => {
      await migration.down(queryRunner);
      await migration.up(queryRunner);
      const [{ filled }] = await queryRunner.query(
        `SELECT (SELECT count(*) FROM app_versions WHERE synced_commit_sha IS NOT NULL OR synced_at IS NOT NULL)
              + (SELECT count(*) FROM organization_git_sync_branches
                  WHERE workspace_pull_commit_sha IS NOT NULL OR workspace_pull_at IS NOT NULL) AS filled`
      );
      expect(Number(filled)).toBe(0);
    });
  });

  it('should be safe to run up twice', async () => {
    await inRolledBackTransaction(async (queryRunner) => {
      await expect(migration.up(queryRunner)).resolves.toBeUndefined();
    });
  });
});
