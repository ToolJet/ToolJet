import { MigrationInterface, QueryRunner } from 'typeorm';

// Per-workspace lists of extra allowed origins per Content Security Policy directive, one row per workspace.
// Keys to existing tables (apps, app_versions, users, organizations) are added in the data phase by
// AddCodeModeAndReviewForeignKeys1794896718037: adding them here would stop writes to those tables while old pods serve.
export class AddCodePageSecuritySettings1792440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_page_security_settings (
        organization_id uuid PRIMARY KEY,
        allow jsonb NOT NULL DEFAULT '{}',
        updated_by uuid NULL,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS code_page_security_settings');
  }
}
