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

    await queryRunner.query(`
      UPDATE "organization_git_ssh" git_ssh
      SET "is_enabled" = TRUE 
      FROM "organization_git_sync" git_sync 
      WHERE git_ssh."config_id" = git_sync."id" 
        AND git_sync."is_enabled" = TRUE 
        AND git_sync."git_type" = 'github_ssh';
    `);

    await queryRunner.query(`
      UPDATE "organization_git_https" git_https
      SET "is_enabled" = TRUE 
      FROM "organization_git_sync" git_sync 
      WHERE git_https."config_id" = git_sync."id" 
        AND git_sync."is_enabled" = TRUE 
        AND git_sync."git_type" = 'github_https';
    `);

    await queryRunner.commitTransaction();
    await queryRunner.startTransaction();

    await queryRunner.query(`
      UPDATE "organization_gitlab" gitlab
      SET "is_enabled" = TRUE 
      FROM "organization_git_sync" git_sync 
      WHERE gitlab."config_id" = git_sync."id" 
        AND git_sync."is_enabled" = TRUE 
        AND git_sync."git_type" = 'gitlab';
    `);

    // Delete is enabled column from the parent table
    await queryRunner.dropColumn('organization_git_sync', 'is_enabled');
    await queryRunner.dropColumn('organization_git_sync', 'git_type');
    // Pending : remove git type colum nfrom the organization_git_sync table
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
