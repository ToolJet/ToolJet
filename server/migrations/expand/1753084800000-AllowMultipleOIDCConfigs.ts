import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleOIDCConfigs1753084800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old unique constraint that prevents multiple SSO configs per organization
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CONFIG_SCOPE_ORG_SSO";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the original unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_CONFIG_SCOPE_ORG_SSO"
      ON "sso_configs" ("config_scope", "organization_id", "sso")
      WHERE "organization_id" IS NOT NULL;
    `);
  }
}
