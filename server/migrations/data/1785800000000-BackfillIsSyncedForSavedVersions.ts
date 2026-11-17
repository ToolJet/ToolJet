import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Marks every saved (PUBLISHED) version as is_synced=true for orgs with git sync enabled.
 *
 * "Git sync enabled" is resolved the same way GitSyncConfigsUtilService.getDetails
 * (server/ee/git-sync-configs/util.service.ts) does: an organization_git_sync row exists, and
 * it's either env-config-driven (use_env_config=true) or has an enabled GitHub/GitLab provider
 * row (organization_git_https / organization_gitlab .is_enabled=true).
 */
export class BackfillIsSyncedForSavedVersions1785800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    await queryRunner.query(`
      UPDATE app_versions av
      SET is_synced = true
      FROM apps a
      WHERE av.app_id = a.id
        AND av.version_type = 'version'
        AND av.status = 'PUBLISHED'
        AND av.is_synced = false
        AND av.is_stub = false
        AND EXISTS (
          SELECT 1 FROM organization_git_sync ogs
          LEFT JOIN organization_git_https ghttps ON ghttps.config_id = ogs.id
          LEFT JOIN organization_gitlab glab ON glab.config_id = ogs.id
          WHERE ogs.organization_id = a.organization_id
            AND (
              ogs.use_env_config = true
              OR ghttps.is_enabled = true
              OR glab.is_enabled = true
            )
        )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No reverse: which rows this flipped true vs. were already true before this migration ran
    // is not recoverable from the surviving column data.
  }
}
