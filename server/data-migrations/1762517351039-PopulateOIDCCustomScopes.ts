import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateOIDCCustomScopes1729870000000 implements MigrationInterface {
  name = 'PopulateOIDCCustomScopes1729870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const oidcCustomScopes = process.env.OIDC_CUSTOM_SCOPES;

    if (!oidcCustomScopes) {
      console.log('OIDC_CUSTOM_SCOPES not set — skipping migration');
      return;
    }

    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = jsonb_set(
        configs::jsonb,
        '{customScopes}',
        to_jsonb('${oidcCustomScopes}')
      )
      WHERE sso = 'openid';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ✅ Remove customScopes field if rollback happens
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = configs - 'customScopes'
      WHERE sso = 'openid';
    `);
  }
}
