import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMcpOAuthClientAuthentication1791763200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE mcp_oauth_clients
      ADD COLUMN token_endpoint_auth_method varchar(32) NOT NULL DEFAULT 'none',
      ADD COLUMN client_secret_hash char(64),
      ADD COLUMN first_authorized_at timestamptz,
      ADD CONSTRAINT mcp_oauth_client_auth_check CHECK (
        (token_endpoint_auth_method = 'none' AND client_secret_hash IS NULL) OR
        (token_endpoint_auth_method IN ('client_secret_basic','client_secret_post')
          AND client_secret_hash IS NOT NULL AND client_secret_hash ~ '^[0-9a-f]{64}$')
      )`);
    // Preserve every existing cached registration; older schemas did not record consent history.
    await queryRunner.query('UPDATE mcp_oauth_clients SET first_authorized_at = created_at');
    await queryRunner.query(`CREATE INDEX mcp_oauth_pending_clients_idx
      ON mcp_oauth_clients (created_at, id) WHERE first_authorized_at IS NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Never downgrade a confidential client to a public client during rollback.
    await queryRunner.query(`UPDATE mcp_oauth_clients SET disabled = true
      WHERE token_endpoint_auth_method <> 'none'`);
    await queryRunner.query(`UPDATE mcp_oauth_grants SET revoked_at = now()
      WHERE revoked_at IS NULL AND client_id IN
        (SELECT id FROM mcp_oauth_clients WHERE token_endpoint_auth_method <> 'none')`);
    await queryRunner.query('DROP INDEX mcp_oauth_pending_clients_idx');
    await queryRunner.query(`ALTER TABLE mcp_oauth_clients
      DROP CONSTRAINT mcp_oauth_client_auth_check,
      DROP COLUMN client_secret_hash,
      DROP COLUMN first_authorized_at,
      DROP COLUMN token_endpoint_auth_method`);
  }
}
