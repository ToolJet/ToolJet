import { MigrationInterface, QueryRunner } from 'typeorm';

// Records which stored source a dev bundle and a library revision were built from, and allows the 'copy' revision
// origin.
export class AddCodeModeFreezeColumns1792500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE custom_component_dev_bundles ADD COLUMN IF NOT EXISTS source_content_hash varchar(64)`
    );
    await queryRunner.query(
      `ALTER TABLE custom_component_library_revisions ADD COLUMN IF NOT EXISTS code_mode_source_revision integer`
    );
    await queryRunner.query(
      `ALTER TABLE custom_component_library_revisions ADD COLUMN IF NOT EXISTS code_mode_source_content_hash varchar(64)`
    );
    // 'copy': a revision copied from another version's source.
    await queryRunner.query('ALTER TABLE code_mode_source_revisions DROP CONSTRAINT IF EXISTS code_mode_source_revisions_origin_check');
    await queryRunner.query(
      `ALTER TABLE code_mode_source_revisions ADD CONSTRAINT code_mode_source_revisions_origin_check CHECK (origin IN ('editor', 'import', 'restore', 'copy'))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE code_mode_source_revisions DROP CONSTRAINT IF EXISTS code_mode_source_revisions_origin_check');
    await queryRunner.query(
      `ALTER TABLE code_mode_source_revisions ADD CONSTRAINT code_mode_source_revisions_origin_check CHECK (origin IN ('editor', 'import', 'restore'))`
    );
    await queryRunner.query(`ALTER TABLE custom_component_library_revisions DROP COLUMN IF EXISTS code_mode_source_content_hash`);
    await queryRunner.query(`ALTER TABLE custom_component_library_revisions DROP COLUMN IF EXISTS code_mode_source_revision`);
    await queryRunner.query(`ALTER TABLE custom_component_dev_bundles DROP COLUMN IF EXISTS source_content_hash`);
  }
}
