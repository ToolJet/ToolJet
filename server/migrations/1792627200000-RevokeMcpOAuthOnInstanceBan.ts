import { MigrationInterface, QueryRunner } from 'typeorm';

/** Revoke banned users' credentials without making revocation errors reject the ban. */
export class RevokeMcpOAuthOnInstanceBan1792627200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE INDEX mcp_oauth_pending_clients_idx ON mcp_oauth_clients (created_at, id) WHERE first_authorized_at IS NULL;
      CREATE INDEX mcp_oauth_user_ban_email_idx ON user_ban_list (lower(email));
      CREATE FUNCTION mcp_oauth_revoke_instance_ban() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM pg_advisory_xact_lock_shared(hashtext('mcp-oauth-security-policy'));
        PERFORM id FROM users WHERE lower(email) = lower(NEW.email) ORDER BY id FOR NO KEY UPDATE;
        BEGIN
          UPDATE mcp_oauth_grants SET revoked_at = now()
            WHERE revoked_at IS NULL AND user_id IN (SELECT id FROM users WHERE lower(email) = lower(NEW.email));
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'MCP OAuth instance-ban revocation skipped (SQLSTATE %)', SQLSTATE;
        END;
        BEGIN
          UPDATE user_personal_access_tokens SET expires_at = LEAST(expires_at, now())
            WHERE user_id IN (SELECT id FROM users WHERE lower(email) = lower(NEW.email));
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'PAT instance-ban expiry skipped (SQLSTATE %)', SQLSTATE;
        END;
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'External credential invalidation skipped for instance ban (SQLSTATE %)', SQLSTATE;
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER mcp_oauth_instance_ban_security AFTER INSERT OR UPDATE OF email ON user_ban_list
        FOR EACH ROW EXECUTE FUNCTION mcp_oauth_revoke_instance_ban();
      -- Also revoke credentials for bans that predate this migration.
      UPDATE mcp_oauth_grants SET revoked_at = now() WHERE revoked_at IS NULL AND user_id IN
        (SELECT u.id FROM users u JOIN user_ban_list b ON lower(b.email) = lower(u.email));
      UPDATE user_personal_access_tokens SET expires_at = LEAST(expires_at, now()) WHERE user_id IN
        (SELECT u.id FROM users u JOIN user_ban_list b ON lower(b.email) = lower(u.email));
    `);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP TRIGGER mcp_oauth_instance_ban_security ON user_ban_list;
      DROP INDEX mcp_oauth_pending_clients_idx; DROP FUNCTION mcp_oauth_revoke_instance_ban(); DROP INDEX mcp_oauth_user_ban_email_idx;`);
  }
}
