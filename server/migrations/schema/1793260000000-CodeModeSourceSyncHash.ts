import { MigrationInterface, QueryRunner } from 'typeorm';

// migration-lint: allow-destructive replaces a check constraint with a wider one, so it stays valid for released code
// A stored source remembers the hash of the files last synced, and allows the 'git' revision origin.
export class CodeModeSourceSyncHash1793260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE code_mode_sources ADD COLUMN IF NOT EXISTS git_content_hash varchar(64) NULL DEFAULT NULL'
    );
    await queryRunner.query(
      'ALTER TABLE code_mode_source_revisions DROP CONSTRAINT IF EXISTS code_mode_source_revisions_origin_check'
    );
    await queryRunner.query(
      `ALTER TABLE code_mode_source_revisions ADD CONSTRAINT code_mode_source_revisions_origin_check CHECK (origin IN ('editor', 'import', 'restore', 'copy', 'git'))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE code_mode_source_revisions SET origin = 'import' WHERE origin = 'git'`);
    await queryRunner.query(
      'ALTER TABLE code_mode_source_revisions DROP CONSTRAINT IF EXISTS code_mode_source_revisions_origin_check'
    );
    await queryRunner.query(
      `ALTER TABLE code_mode_source_revisions ADD CONSTRAINT code_mode_source_revisions_origin_check CHECK (origin IN ('editor', 'import', 'restore', 'copy'))`
    );
    await queryRunner.query('ALTER TABLE code_mode_sources DROP COLUMN IF EXISTS git_content_hash');
  }
}
