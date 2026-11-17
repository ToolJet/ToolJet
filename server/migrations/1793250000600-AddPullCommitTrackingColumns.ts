import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records which git commit a workspace pull and each app version were synced at.
 * organization_git_sync_branches.workspace_pull_commit_sha is the commit every app opens at;
 * app_versions.synced_commit_sha is the commit the version's content matches. Messages and
 * timestamps are for display only. All nullable, no backfill: a null means "unknown", and
 * the open path falls back to today's behaviour.
 */
export class AddPullCommitTrackingColumns1793250000600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
        ADD COLUMN IF NOT EXISTS workspace_pull_commit_sha varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS workspace_pull_commit_message text NULL,
        ADD COLUMN IF NOT EXISTS workspace_pull_at timestamptz NULL
    `);
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD COLUMN IF NOT EXISTS synced_commit_sha varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS synced_commit_message text NULL,
        ADD COLUMN IF NOT EXISTS synced_at timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_versions
        DROP COLUMN IF EXISTS synced_at,
        DROP COLUMN IF EXISTS synced_commit_message,
        DROP COLUMN IF EXISTS synced_commit_sha
    `);
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
        DROP COLUMN IF EXISTS workspace_pull_at,
        DROP COLUMN IF EXISTS workspace_pull_commit_message,
        DROP COLUMN IF EXISTS workspace_pull_commit_sha
    `);
  }
}
