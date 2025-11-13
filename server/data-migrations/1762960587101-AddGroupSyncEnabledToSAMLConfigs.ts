import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupSyncEnabledToSAMLConfigs1731400000000 implements MigrationInterface {
  name = 'AddGroupSyncEnabledToSAMLConfigs1731400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Decide desired boolean to write based on env:
    // If DISABLE_SAML_GROUP_SYNC is present:
    //    'true'  => groupSyncEnabled = false
    //    anything else => groupSyncEnabled = true
    // If env not present => default to false (existing default)
    const envVal = process.env.DISABLE_SAML_GROUP_SYNC;
    const desiredBool = typeof envVal !== 'undefined'
      ? (envVal === 'true' ? false : true)
      : false;

    // Use SQL literal 'true' or 'false' accordingly
    const sqlBool = desiredBool ? 'true' : 'false';

    // Update SAML and (optionally) OPENID configs missing the key
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = jsonb_set(
        configs::jsonb,
        '{groupSyncEnabled}',
        '${sqlBool}'::jsonb,
        true
      )
      WHERE sso IN ('saml', 'openid')
        AND NOT (configs::jsonb ? 'groupSyncEnabled');
    `);

    // Remove legacy snake_case key if exists (optional cleanup)
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = configs::jsonb - 'group_sync_enabled'
      WHERE sso IN ('saml', 'openid') AND (configs::jsonb ? 'group_sync_enabled');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: remove the groupSyncEnabled key from SAML/OpenID configs
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = configs::jsonb - 'groupSyncEnabled'
      WHERE sso IN ('saml', 'openid');
    `);
  }
}
