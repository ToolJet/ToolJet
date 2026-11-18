import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUseEnvConfigColumnToSsoConfigsTable1782900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sso_configs" ADD COLUMN IF NOT EXISTS "use_env_config" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sso_configs" DROP COLUMN IF EXISTS "use_env_config"`);
  }
}
