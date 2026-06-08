import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppsCoRelationIdIndex1779900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // co_relation_id is the cross-instance app lineage id, looked up by module loader
    // (co_relation_id IN (...)), git-sync, and import/export. High-cardinality, unindexed
    // → those queries seq-scan apps. Partial — lineage-less rows excluded; every lookup
    // filters co_relation_id = / IN, which implies NOT NULL, so the index stays eligible.
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
