import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateGroupSyncData1752624000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Filter rows with config_scope='organization'
    const ssoConfigs = await queryRunner.query(
      `SELECT id, configs FROM sso_configs WHERE config_scope = 'organization'`
    );
    for (const config of ssoConfigs) {
      const { id: ssoConfigId, configs } = config;

      // Parse the configs JSON
      let parsedConfigs;
      try {
        parsedConfigs = JSON.parse(configs);
      } catch (error) {
        console.error(`Failed to parse configs for sso_config_id: ${ssoConfigId}`);
        continue;
      }

      const { claimName, groupMapping, enableGroupSync } = parsedConfigs;

      // Only migrate if group sync is enabled and groupMapping exists
      if (enableGroupSync && groupMapping && claimName) {
        await queryRunner.query(
          `INSERT INTO sso_config_oidc_group_sync (sso_config_id, claim_name, group_mappings, is_group_sync_enabled, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [ssoConfigId, claimName, groupMapping, enableGroupSync]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all rows from the sso_config_oidc_group_sync table
    await queryRunner.query(`DELETE FROM sso_config_oidc_group_sync`);
  }
}
