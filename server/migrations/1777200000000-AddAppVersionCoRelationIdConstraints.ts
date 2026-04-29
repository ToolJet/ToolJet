import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Locks `app_versions.co_relation_id` as NOT NULL and unique per (app_id, co_relation_id).
 *
 * Cross-branch sharing is allowed: the same logical version on different
 * branches has the same co_relation_id but different app_id (App rows fan out
 * per branch). Intra-app duplicates are not allowed.
 *
 * Requires the rationalization data migration to have run first.
 */
export class AddAppVersionCoRelationIdConstraints1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_versions
      ALTER COLUMN co_relation_id SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions
      ADD CONSTRAINT uq_app_versions_app_id_co_relation_id
      UNIQUE (app_id, co_relation_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app_versions
      DROP CONSTRAINT IF EXISTS uq_app_versions_app_id_co_relation_id;
    `);
    await queryRunner.query(`
      ALTER TABLE app_versions
      ALTER COLUMN co_relation_id DROP NOT NULL;
    `);
  }
}
