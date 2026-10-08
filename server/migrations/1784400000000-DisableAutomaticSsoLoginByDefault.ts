import { MigrationInterface, QueryRunner } from 'typeorm';

export class DisableAutomaticSsoLoginByDefault1784400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Automatic SSO login is now gated behind the automaticSsoLogin license entitlement
    // (Enterprise plan only). Organizations/instances that currently have it enabled are
    // reset so end users are routed back to the ToolJet login page with the SSO button,
    // until an entitled org re-enables it from Workspace/Instance settings.
    await queryRunner.query(`UPDATE organizations SET automatic_sso_login = false WHERE automatic_sso_login = true`);
    await queryRunner.query(
      `UPDATE instance_settings SET value = 'false' WHERE key = 'AUTOMATIC_SSO_LOGIN' AND value = 'true'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
