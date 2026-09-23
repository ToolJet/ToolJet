import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAppVersionState1790140781181 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_app_version_state (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        app_id UUID NOT NULL,
        version_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT uq_user_app_version_state_user_app UNIQUE (user_id, app_id),
        CONSTRAINT fk_user_app_version_state_user_id
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_app_version_state_app_id
          FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_app_version_state_version_id
          FOREIGN KEY (version_id) REFERENCES app_versions(id) ON DELETE SET NULL
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
