import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add webhook_events column to organization_git_sync.
 * Stores the array of event types the user has enabled for auto-sync (e.g. ['push','pull_request','delete']).
 * Default is all events enabled for backwards-compat.
 */
export class AddWebhookEventsColumn1783400000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_git_sync"
        ADD COLUMN IF NOT EXISTS "webhook_events" jsonb NOT NULL DEFAULT '["push","pull_request","delete"]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_git_sync" DROP COLUMN IF EXISTS "webhook_events"
    `);
  }
}
