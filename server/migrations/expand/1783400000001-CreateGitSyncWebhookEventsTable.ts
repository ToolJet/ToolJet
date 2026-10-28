import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create the git_sync_webhook_events table for audit logging
 * of all incoming webhook events (processed, skipped, failed).
 */
export class CreateGitSyncWebhookEventsTable1783400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS git_sync_webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        delivery_id VARCHAR(255) NOT NULL,
        provider VARCHAR(20) NOT NULL CHECK (provider IN ('github', 'gitlab')),
        event_type VARCHAR(50) NOT NULL,
        branch_name VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'received'
          CHECK (status IN ('received', 'queued', 'processing', 'processed', 'skipped', 'failed', 'dead')),
        error_message TEXT,
        duration_ms INTEGER,
        attempts INTEGER DEFAULT 0,
        payload_summary JSONB,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

        CONSTRAINT fk_webhook_events_org
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_org_delivery
        ON git_sync_webhook_events(organization_id, delivery_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_org_status
        ON git_sync_webhook_events(organization_id, status, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_created
        ON git_sync_webhook_events(created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS git_sync_webhook_events`);
  }
}
