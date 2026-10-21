import { MigrationInterface, QueryRunner } from 'typeorm';

/** Revocation and consent coordination now live in application code. Also remove
 * hooks if an earlier version of the preceding migration was applied already.
 * Databases that recorded ALL original migrations must explicitly run this cleanup;
 * editing an already-recorded migration does not cause TypeORM to run it again. */
export class ReduceMcpOAuthPolicyContention1792540800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS mcp_oauth_grant_creation_lock ON mcp_oauth_grants;
      DROP TRIGGER IF EXISTS mcp_oauth_user_security ON users;
      DROP TRIGGER IF EXISTS mcp_oauth_workspace_security ON organizations;
      DROP TRIGGER IF EXISTS mcp_oauth_membership_security ON organization_users;
      DROP TRIGGER IF EXISTS mcp_oauth_ban_security ON workspace_ban_list;
      DROP TRIGGER IF EXISTS mcp_oauth_client_security ON mcp_oauth_clients;
      DROP TRIGGER IF EXISTS mcp_oauth_sso_security ON sso_configs;
      DROP TRIGGER IF EXISTS mcp_oauth_group_sync_security ON sso_config_oidc_group_sync;
      DROP TRIGGER IF EXISTS mcp_oauth_instance_security ON instance_settings;
      DROP TRIGGER IF EXISTS mcp_oauth_instance_ban_security ON user_ban_list;
      DROP FUNCTION IF EXISTS mcp_oauth_lock_grant_creation();
      DROP FUNCTION IF EXISTS mcp_oauth_revoke_on_security_change();
      DROP FUNCTION IF EXISTS mcp_oauth_revoke_instance_ban();
    `);
  }
  async down(_queryRunner: QueryRunner): Promise<void> {
    // Earlier revised migrations also use application revocation. Do not restore hooks.
  }
}
