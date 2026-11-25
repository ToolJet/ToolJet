import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * git_sync_webhook_events.provider was created with CHECK (provider IN ('github', 'gitlab')),
 * predating Bitbucket support. Every inbound Bitbucket webhook fails the audit-log insert with
 * a 23514 check-violation before it can be enqueued for processing.
 */
export class AllowBitbucketInGitSyncWebhookEventsCheck1788100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE git_sync_webhook_events
      DROP CONSTRAINT IF EXISTS git_sync_webhook_events_provider_check
    `);

    await queryRunner.query(`
      ALTER TABLE git_sync_webhook_events
      ADD CONSTRAINT git_sync_webhook_events_provider_check
      CHECK (provider IN ('github', 'gitlab', 'bitbucket'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE git_sync_webhook_events
      DROP CONSTRAINT IF EXISTS git_sync_webhook_events_provider_check
    `);

    await queryRunner.query(`
      ALTER TABLE git_sync_webhook_events
      ADD CONSTRAINT git_sync_webhook_events_provider_check
      CHECK (provider IN ('github', 'gitlab'))
    `);
  }
}
