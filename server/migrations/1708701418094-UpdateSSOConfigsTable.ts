import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSSOConfigsTable1708701418094 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`CREATE TYPE "config_scope_enum" AS ENUM('organization', 'instance');`);
    await queryRunner.query(`CREATE TYPE "sso_type_enum" AS ENUM('google', 'git', 'form', 'openid', 'ldap', 'saml');`);

    // Make organization_id nullable
    await queryRunner.query(`ALTER TABLE "sso_configs" ALTER COLUMN "organization_id" DROP NOT NULL;`);

    // Alter the 'sso' column type to use the new enum type, assuming direct cast is possible
    await queryRunner.query(
      `ALTER TABLE "sso_configs" ALTER COLUMN "sso" TYPE "sso_type_enum" USING "sso"::text::"sso_type_enum";`
    );

    // Add the 'config_scope' column with enum type
    await queryRunner.query(
      `ALTER TABLE "sso_configs" ADD "config_scope" "config_scope_enum" NOT NULL DEFAULT 'organization';`
    );

    // Add partial unique indexes
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_CONFIG_SCOPE_ORG_SSO" ON "sso_configs" ("config_scope", "organization_id", "sso")
            WHERE "organization_id" IS NOT NULL;
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_CONFIG_SCOPE_SSO" ON "sso_configs" ("config_scope", "sso")
            WHERE "organization_id" IS NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
