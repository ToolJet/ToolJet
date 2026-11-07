import { MigrationInterface, QueryRunner } from 'typeorm';

// Optional summary and kind on stored source revisions.
export class CodeModeRevisionSummary1792520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE code_mode_source_revisions ADD COLUMN IF NOT EXISTS summary varchar(200) NULL DEFAULT NULL'
    );
    await queryRunner.query(
      'ALTER TABLE code_mode_source_revisions ADD COLUMN IF NOT EXISTS kind varchar(16) NULL DEFAULT NULL'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE code_mode_source_revisions DROP COLUMN IF EXISTS kind');
    await queryRunner.query('ALTER TABLE code_mode_source_revisions DROP COLUMN IF EXISTS summary');
  }
}
