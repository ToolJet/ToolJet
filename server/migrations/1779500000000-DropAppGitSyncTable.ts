import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the legacy app_git_sync table.
 *
 * Per-app git metadata (git_app_name, git_version_*, last_commit_*, last_push/pull_date,
 * allow_editing, organization_git_id) has been retired in favour of:
 *   - apps.co_relation_id for the stable cross-workspace identifier
 *   - app_versions.app_name for the branch-scoped display name
 *   - organization_git_sync (1:1 on organization_id) for the workspace-level
 *     git connection
 *   - hard-coded allowEditing = true (workspace-level git sync considers every
 *     app in a git-enabled org editable on a feature branch)
 *   - live git metadata (commit history, latest commit, branch list) read at
 *     request time instead of cached per-app
 *
 * down() recreates an empty table with the original column shape so a rollback
 * during a single release cycle can mount without crashing TypeORM. Data is not
 * restored — the rows were already drained of meaning before this drop.
 */
export class DropAppGitSyncTable1779500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS app_git_sync`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_git_sync (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_git_id   UUID NOT NULL,
        version_id            UUID,
        app_id                UUID NOT NULL,
        git_app_name          VARCHAR NOT NULL,
        git_version_name      VARCHAR,
        git_app_id            VARCHAR NOT NULL,
        git_version_id        VARCHAR,
        last_commit_message   VARCHAR,
        last_commit_user      VARCHAR,
        last_commit_id        VARCHAR,
        last_push_date        TIMESTAMP,
        last_pull_date        TIMESTAMP,
        allow_editing         BOOLEAN NOT NULL DEFAULT false,
        created_at            TIMESTAMP DEFAULT now(),
        updated_at            TIMESTAMP DEFAULT now()
      )
    `);
  }
}
