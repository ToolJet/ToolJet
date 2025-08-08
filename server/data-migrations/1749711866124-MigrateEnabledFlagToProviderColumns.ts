import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateEnabledFlagToProviderColumns1749711866124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`
      UPDATE "organization_gitlab" gitlab
      SET "is_enabled" = TRUE 
      FROM "organization_git_sync" git_sync 
      WHERE gitlab."config_id" = git_sync."id" 
        AND git_sync."is_enabled" = TRUE 
        AND git_sync."git_type" = 'gitlab';
    `);
    await queryRunner.dropColumn('organization_git_sync', 'is_enabled');
    await queryRunner.dropColumn('organization_git_sync', 'git_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
