import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAppVersionState1790140781181 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Keys to users, apps and app_versions are added by AddUserAppVersionStateForeignKeys1795153679000: adding them
    // here would stop writes to those tables while old pods serve.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_app_version_state (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        app_id UUID NOT NULL,
        version_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT uq_user_app_version_state_user_app UNIQUE (user_id, app_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_app_version_state_version_id
        ON user_app_version_state(version_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_app_version_state`);
  }
}
