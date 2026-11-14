import { MigrationInterface, QueryRunner } from 'typeorm';

// Per-workspace lists of extra allowed origins per Content Security Policy directive, one row per workspace.
export class AddCodePageSecuritySettings1792440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_page_security_settings (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
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
