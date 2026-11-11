import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnabledColumnProviderTable1747923859030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization_git_ssh" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT FALSE;
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_git_https" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT FALSE;
    `);

    await queryRunner.query(`
      ALTER TABLE "organization_gitlab" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT FALSE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
