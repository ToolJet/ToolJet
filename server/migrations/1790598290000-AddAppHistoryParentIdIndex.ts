import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppHistoryParentIdIndex1790598290000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Self-FK check on every app_history delete; unindexed, it scans the table per deleted row.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_history_parent_id"
      ON "app_history" ("parent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_history_parent_id"`);
  }
}
