import { MigrationInterface, QueryRunner } from 'typeorm';

/** Index ban lookups and backfill existing bans; runtime invalidation is application-owned. */
export class RevokeMcpOAuthOnInstanceBan1792627200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE INDEX mcp_oauth_pending_clients_idx ON mcp_oauth_clients (created_at, id) WHERE first_authorized_at IS NULL;
      CREATE INDEX mcp_oauth_user_ban_email_idx ON user_ban_list (lower(email));
      -- Also revoke credentials for bans that predate this migration.
      UPDATE mcp_oauth_grants SET revoked_at = now() WHERE revoked_at IS NULL AND user_id IN
        (SELECT u.id FROM users u JOIN user_ban_list b ON lower(b.email) = lower(u.email));
      UPDATE user_personal_access_tokens SET expires_at = LEAST(expires_at, now()) WHERE user_id IN
        (SELECT u.id FROM users u JOIN user_ban_list b ON lower(b.email) = lower(u.email));
    `);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP INDEX mcp_oauth_pending_clients_idx; DROP INDEX mcp_oauth_user_ban_email_idx;`);
  }
}
