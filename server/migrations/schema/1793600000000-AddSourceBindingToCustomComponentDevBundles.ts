import { MigrationInterface, QueryRunner } from 'typeorm';

// migration-lint: allow-destructive down drops only the new columns
// What a dev upload claims: the source revision it was built from, and a digest of the bytes uploaded with that claim,
// so saving a version can refuse a build of another revision or a slot overwritten since.
export class AddSourceBindingToCustomComponentDevBundles1793600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE custom_component_dev_bundles
        ADD COLUMN IF NOT EXISTS source_revision integer NULL,
        ADD COLUMN IF NOT EXISTS source_bundle_digest varchar(64) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE custom_component_dev_bundles
        DROP COLUMN IF EXISTS source_revision,
        DROP COLUMN IF EXISTS source_bundle_digest
    `);
  }
}
