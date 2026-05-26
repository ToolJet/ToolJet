import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppVersionsBranchIdIndex1779800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Partial — only branched rows indexed.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_versions_branch_id"
      ON "app_versions" ("branch_id")
      WHERE "branch_id" IS NOT NULL
    `);

    // Composite for per-app branch existence probes.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_versions_app_id_branch_id"
      ON "app_versions" ("app_id", "branch_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_versions_app_id_branch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_versions_branch_id"`);
  }
}
