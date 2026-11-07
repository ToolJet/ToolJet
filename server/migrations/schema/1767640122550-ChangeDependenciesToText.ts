import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDependenciesToText1767640122550 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change dependencies column from JSONB to TEXT
    // This allows storing both JSON (for JavaScript) and plain text (for Python requirements.txt)
    await queryRunner.query(`
      ALTER TABLE workflow_bundles
      ALTER COLUMN dependencies TYPE TEXT
      USING dependencies::TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to JSONB
    await queryRunner.query(`
      ALTER TABLE workflow_bundles
      ALTER COLUMN dependencies TYPE JSONB
      USING dependencies::JSONB
    `);
  }
}
