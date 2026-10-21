import { MigrationInterface, QueryRunner } from 'typeorm';
import { MCP_OAUTH_ORIGINAL_CREATION_FUNCTION, MCP_OAUTH_ORIGINAL_REVOCATION_FUNCTION } from './1791290000000-AddMcpOAuthRevocationHooks';

/** Security updates share the policy lock; only new consent takes it exclusively.
 * Independent administrative changes can proceed concurrently, without per-row advisory
 * lock ordering or shared-to-exclusive upgrades. New approvals briefly serialize.
 * No tables or columns change. */
export class ReduceMcpOAuthPolicyContention1792540800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION mcp_oauth_lock_grant_creation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        -- Serialize approvals with each other and with all in-flight security updates.
        -- Consent rechecks policy after INSERT while holding this exclusive lock.
        PERFORM pg_advisory_xact_lock(hashtext('mcp-oauth-security-policy'));
        RETURN NEW;
      END;
      $$;
      ${MCP_OAUTH_ORIGINAL_REVOCATION_FUNCTION.replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION')
        .replace('pg_advisory_xact_lock(', 'pg_advisory_xact_lock_shared(')}

DROP TRIGGER mcp_oauth_user_security ON users;
DROP TRIGGER mcp_oauth_workspace_security ON organizations;
DROP TRIGGER mcp_oauth_membership_security ON organization_users;
DROP TRIGGER mcp_oauth_client_security ON mcp_oauth_clients;
      CREATE TRIGGER mcp_oauth_user_security AFTER UPDATE OF status ON users
        FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_workspace_security
        AFTER UPDATE OF status, slug, domain, password_allowed_domains, password_restricted_domains, inherit_sso ON organizations
        FOR EACH ROW WHEN (ROW(OLD.status, OLD.slug, OLD.domain, OLD.password_allowed_domains, OLD.password_restricted_domains, OLD.inherit_sso)
          IS DISTINCT FROM ROW(NEW.status, NEW.slug, NEW.domain, NEW.password_allowed_domains, NEW.password_restricted_domains, NEW.inherit_sso))
        EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_membership_security AFTER UPDATE OF status, user_id, organization_id OR DELETE ON organization_users
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_client_security AFTER UPDATE OF disabled ON mcp_oauth_clients
        FOR EACH ROW WHEN (NEW.disabled AND OLD.disabled IS DISTINCT FROM NEW.disabled)
        EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ${MCP_OAUTH_ORIGINAL_CREATION_FUNCTION.replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION')}
      ${MCP_OAUTH_ORIGINAL_REVOCATION_FUNCTION.replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION')}
DROP TRIGGER mcp_oauth_user_security ON users;
DROP TRIGGER mcp_oauth_workspace_security ON organizations;
DROP TRIGGER mcp_oauth_membership_security ON organization_users;
DROP TRIGGER mcp_oauth_client_security ON mcp_oauth_clients;
CREATE TRIGGER mcp_oauth_user_security AFTER UPDATE ON users FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
CREATE TRIGGER mcp_oauth_workspace_security AFTER UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
CREATE TRIGGER mcp_oauth_membership_security AFTER UPDATE OR DELETE ON organization_users FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
CREATE TRIGGER mcp_oauth_client_security AFTER UPDATE ON mcp_oauth_clients FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
    `);
  }
}
