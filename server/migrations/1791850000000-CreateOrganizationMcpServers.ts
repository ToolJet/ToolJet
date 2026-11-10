import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationMcpServers1791850000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE organization_mcp_servers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name varchar(50) NOT NULL,
      url text NOT NULL,
      encrypted_url_query text,
      auth_type varchar(16) NOT NULL DEFAULT 'header',
      header_name varchar(100),
      encrypted_header_value text,
      allow_write_tools boolean NOT NULL DEFAULT false,
      oauth_client_id text,
      encrypted_oauth_client_secret text,
      oauth_token_endpoint_auth_method varchar(32),
      oauth_metadata jsonb,
      enabled boolean NOT NULL DEFAULT true,
      created_by uuid,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UQ_ORG_MCP_SERVER_NAME" UNIQUE (organization_id, name),
      CONSTRAINT organization_mcp_servers_auth_type_check CHECK (auth_type IN ('none', 'header', 'oauth'))
    )`);
    await queryRunner.query(`CREATE TABLE user_mcp_server_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      server_id uuid NOT NULL REFERENCES organization_mcp_servers(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      encrypted_access_token text,
      encrypted_refresh_token text,
      expires_at timestamp,
      scope text,
      pending_state_hash char(64),
      encrypted_pending_verifier text,
      pending_expires_at timestamp,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UQ_USER_MCP_SERVER_TOKEN" UNIQUE (server_id, user_id)
    )`);
    await queryRunner.query(
      'CREATE UNIQUE INDEX user_mcp_server_tokens_pending_state_idx ON user_mcp_server_tokens (pending_state_hash) WHERE pending_state_hash IS NOT NULL'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE user_mcp_server_tokens');
    await queryRunner.query('DROP TABLE organization_mcp_servers');
  }
}
