import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUseEnvConfigToGitProviders1773649782353 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_git_sync"
        ADD COLUMN "use_env_config"   boolean NOT NULL DEFAULT false,
        ADD COLUMN "env_git_provider" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_git_sync" DROP COLUMN "use_env_config"`);
    await queryRunner.query(`ALTER TABLE "organization_git_sync" DROP COLUMN "env_git_provider"`);
  }
}
