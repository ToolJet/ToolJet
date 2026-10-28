import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add webhook_enabled and webhook_secret columns to organization_git_sync
 * for the auto-sync via webhooks feature.
 *
 * - webhook_enabled: controls whether incoming webhooks are processed
 * - webhook_secret: HMAC-SHA256 secret for verifying GitHub/GitLab webhook signatures
 */
export class AddWebhookColumnsToOrgGitSync1783400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
        ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(64) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
        DROP COLUMN IF EXISTS webhook_secret,
        DROP COLUMN IF EXISTS webhook_enabled
    `);
  }
}
