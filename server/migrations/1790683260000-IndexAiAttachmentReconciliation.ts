import { MigrationInterface, QueryRunner } from 'typeorm';

/** Also upgrades environments that applied the earlier lifecycle migration before this index existed. */
export class IndexAiAttachmentReconciliation1790683260000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ai_attachments_reconcile
      ON ai_attachments(next_cleanup_at, id) WHERE state <> 'deleting'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_ai_attachments_reconcile');
  }
}
