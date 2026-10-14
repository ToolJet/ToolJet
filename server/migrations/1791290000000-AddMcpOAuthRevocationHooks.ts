import { MigrationInterface, QueryRunner } from 'typeorm';

/** Revoke consent durably at the same transaction boundary as local access/policy changes. */
export class AddMcpOAuthRevocationHooks1791290000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX mcp_oauth_grants_active_workspace_idx
        ON mcp_oauth_grants(organization_id) WHERE revoked_at IS NULL;
      CREATE INDEX mcp_oauth_grants_active_client_idx
        ON mcp_oauth_grants(client_id) WHERE revoked_at IS NULL;

      CREATE FUNCTION mcp_oauth_lock_grant_creation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        -- Consent rechecks policy after INSERT while holding this shared lock. Security changes
        -- acquire the exclusive lock below, so concurrent changes cannot miss a new grant.
        PERFORM pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'));
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER mcp_oauth_grant_creation_lock BEFORE INSERT ON mcp_oauth_grants
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_lock_grant_creation();

      CREATE FUNCTION mcp_oauth_revoke_on_security_change() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE
        previous jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
        current_row jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE '{}'::jsonb END;
        previous_config jsonb;
        current_config jsonb;
        user_ids uuid[];
        client_ids text[];
        workspace_ids uuid[];
        revoke_all boolean := false;
      BEGIN
        IF TG_TABLE_NAME = 'users' THEN
          IF previous->'status' IS NOT DISTINCT FROM current_row->'status' THEN RETURN NULL; END IF;
          user_ids := ARRAY[(previous->>'id')::uuid];
        ELSIF TG_TABLE_NAME = 'organizations' THEN
          IF ROW(previous->'status', previous->'slug', previous->'domain', previous->'password_allowed_domains',
                 previous->'password_restricted_domains', previous->'inherit_sso') IS NOT DISTINCT FROM
             ROW(current_row->'status', current_row->'slug', current_row->'domain', current_row->'password_allowed_domains',
                 current_row->'password_restricted_domains', current_row->'inherit_sso') THEN RETURN NULL; END IF;
          workspace_ids := ARRAY[(previous->>'id')::uuid];
        ELSIF TG_TABLE_NAME = 'organization_users' THEN
          IF TG_OP = 'UPDATE' AND ROW(previous->'status', previous->'user_id', previous->'organization_id')
            IS NOT DISTINCT FROM ROW(current_row->'status', current_row->'user_id', current_row->'organization_id')
            THEN RETURN NULL; END IF;
          user_ids := ARRAY[(previous->>'user_id')::uuid];
          workspace_ids := ARRAY[(previous->>'organization_id')::uuid];
        ELSIF TG_TABLE_NAME = 'workspace_ban_list' THEN
          IF TG_OP = 'UPDATE' AND previous->'organization_id' IS NOT DISTINCT FROM current_row->'organization_id'
            THEN RETURN NULL; END IF;
          workspace_ids := ARRAY[(previous->>'organization_id')::uuid, (current_row->>'organization_id')::uuid];
        ELSIF TG_TABLE_NAME = 'mcp_oauth_clients' THEN
          IF NOT (current_row->>'disabled')::boolean OR previous->'disabled' IS NOT DISTINCT FROM current_row->'disabled'
            THEN RETURN NULL; END IF;
          client_ids := ARRAY[previous->>'id'];
        ELSIF TG_TABLE_NAME = 'sso_configs' THEN
          -- Form-login rows can have SQL NULL configs (serialized as JSON null here).
          previous_config := previous->'configs';
          current_config := current_row->'configs';
          IF jsonb_typeof(previous_config) = 'object' THEN previous_config := previous_config - 'name'; END IF;
          IF jsonb_typeof(current_config) = 'object' THEN current_config := current_config - 'name'; END IF;
          -- Display-name-only and timestamp edits do not change the security policy.
          IF TG_OP = 'UPDATE' AND ROW(previous->'enabled', previous->'sso', previous->'config_scope',
                 previous->'organization_id', previous_config) IS NOT DISTINCT FROM
             ROW(current_row->'enabled', current_row->'sso', current_row->'config_scope',
                 current_row->'organization_id', current_config) THEN RETURN NULL; END IF;
          revoke_all := previous->>'config_scope' = 'instance' OR current_row->>'config_scope' = 'instance';
          workspace_ids := ARRAY[(previous->>'organization_id')::uuid, (current_row->>'organization_id')::uuid];
        ELSIF TG_TABLE_NAME = 'sso_config_oidc_group_sync' THEN
          IF TG_OP = 'UPDATE' AND ROW(previous->'sso_config_id', previous->'organization_id',
                 previous->'claim_name', previous->'group_mapping', previous->'enable_group_sync') IS NOT DISTINCT FROM
             ROW(current_row->'sso_config_id', current_row->'organization_id',
                 current_row->'claim_name', current_row->'group_mapping', current_row->'enable_group_sync')
            THEN RETURN NULL; END IF;
          revoke_all := (TG_OP <> 'INSERT' AND previous->>'organization_id' IS NULL)
                     OR (TG_OP <> 'DELETE' AND current_row->>'organization_id' IS NULL);
          workspace_ids := ARRAY[(previous->>'organization_id')::uuid, (current_row->>'organization_id')::uuid];
        ELSIF TG_TABLE_NAME = 'instance_settings' THEN
          IF NOT (COALESCE(current_row->>'key', '') IN (
            'ALLOWED_DOMAINS', 'PASSWORD_ALLOWED_DOMAINS', 'PASSWORD_RESTRICTED_DOMAINS',
            'ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'MFA_ENABLED') OR COALESCE(previous->>'key', '') IN (
            'ALLOWED_DOMAINS', 'PASSWORD_ALLOWED_DOMAINS', 'PASSWORD_RESTRICTED_DOMAINS',
            'ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'MFA_ENABLED')) THEN RETURN NULL; END IF;
          IF TG_OP = 'UPDATE' AND ROW(previous->'key', previous->'value') IS NOT DISTINCT FROM
             ROW(current_row->'key', current_row->'value') THEN RETURN NULL; END IF;
          revoke_all := true;
        ELSE
          RETURN NULL;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtext('mcp-oauth-security-policy'));
        IF revoke_all THEN
          UPDATE mcp_oauth_grants SET revoked_at = now() WHERE revoked_at IS NULL;
        ELSIF client_ids IS NOT NULL THEN
          UPDATE mcp_oauth_grants SET revoked_at = now() WHERE client_id = ANY(client_ids) AND revoked_at IS NULL;
        ELSIF user_ids IS NOT NULL AND workspace_ids IS NOT NULL THEN
          UPDATE mcp_oauth_grants SET revoked_at = now()
            WHERE user_id = ANY(user_ids) AND organization_id = ANY(workspace_ids) AND revoked_at IS NULL;
        ELSIF user_ids IS NOT NULL THEN
          UPDATE mcp_oauth_grants SET revoked_at = now() WHERE user_id = ANY(user_ids) AND revoked_at IS NULL;
        ELSE
          UPDATE mcp_oauth_grants SET revoked_at = now()
            WHERE organization_id = ANY(workspace_ids) AND revoked_at IS NULL;
        END IF;
        RETURN NULL;
      END;
      $$;

      CREATE TRIGGER mcp_oauth_user_security AFTER UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_workspace_security AFTER UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_membership_security AFTER UPDATE OR DELETE ON organization_users
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_ban_security AFTER INSERT OR UPDATE OR DELETE ON workspace_ban_list
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_client_security AFTER UPDATE ON mcp_oauth_clients
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_sso_security AFTER INSERT OR UPDATE OR DELETE ON sso_configs
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_group_sync_security AFTER INSERT OR UPDATE OR DELETE ON sso_config_oidc_group_sync
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
      CREATE TRIGGER mcp_oauth_instance_security AFTER INSERT OR UPDATE OR DELETE ON instance_settings
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_on_security_change();
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS mcp_oauth_client_security ON mcp_oauth_clients;
      DROP TRIGGER IF EXISTS mcp_oauth_ban_security ON workspace_ban_list;
      DROP TRIGGER mcp_oauth_instance_security ON instance_settings;
      DROP TRIGGER mcp_oauth_group_sync_security ON sso_config_oidc_group_sync;
      DROP TRIGGER mcp_oauth_sso_security ON sso_configs;
      DROP TRIGGER mcp_oauth_membership_security ON organization_users;
      DROP TRIGGER mcp_oauth_workspace_security ON organizations;
      DROP TRIGGER mcp_oauth_user_security ON users;
      DROP TRIGGER mcp_oauth_grant_creation_lock ON mcp_oauth_grants;
      DROP FUNCTION mcp_oauth_revoke_on_security_change();
      DROP FUNCTION mcp_oauth_lock_grant_creation();
      DROP INDEX mcp_oauth_grants_active_workspace_idx;
      DROP INDEX IF EXISTS mcp_oauth_grants_active_client_idx;
    `);
  }
}
