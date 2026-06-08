import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppsCoRelationIdIndex1779900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Partial — co_relation_id lookups always imply NOT NULL.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_apps_co_relation_id"
      ON "apps" ("co_relation_id")
      WHERE "co_relation_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_apps_co_relation_id"`);
  }
}
