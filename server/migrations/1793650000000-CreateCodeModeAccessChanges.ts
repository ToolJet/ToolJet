import { MigrationInterface, QueryRunner } from 'typeorm';

// One row per change to who can open a page or run a query of an app version, for the app's history.
export class CreateCodeModeAccessChanges1793650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_access_changes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        app_version_id uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
        kind varchar(16) NOT NULL,
        owner_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        before jsonb NOT NULL,
        after jsonb NOT NULL,
        summary varchar(300) NOT NULL,
        created_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS code_mode_access_changes_version_idx ON code_mode_access_changes (app_version_id, created_at)'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_access_changes');
  }
}
