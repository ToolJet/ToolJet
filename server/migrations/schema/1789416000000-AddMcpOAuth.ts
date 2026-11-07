import { MigrationInterface, QueryRunner } from 'typeorm';

/** Additive: existing users, login configurations and PATs are not changed. */
export class AddMcpOAuth1789416000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE mcp_oauth_clients (
        id varchar(96) PRIMARY KEY,
        name varchar(120) NOT NULL,
        redirect_uris jsonb NOT NULL,
        disabled boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE mcp_oauth_grants (
        id uuid PRIMARY KEY,
        client_id varchar(96) NOT NULL REFERENCES mcp_oauth_clients(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        resource text NOT NULL,
        scopes jsonb NOT NULL,
        authentication jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz
      );
      CREATE INDEX mcp_oauth_grants_owner_idx ON mcp_oauth_grants(user_id, organization_id);
      CREATE INDEX mcp_oauth_grants_expiry_idx ON mcp_oauth_grants(expires_at);
      CREATE TABLE mcp_oauth_artifacts (
        id char(64) PRIMARY KEY,
        kind varchar(16) NOT NULL CHECK (kind IN ('interaction', 'code', 'access', 'refresh')),
        client_id varchar(96) NOT NULL REFERENCES mcp_oauth_clients(id) ON DELETE CASCADE,
        grant_id uuid REFERENCES mcp_oauth_grants(id) ON DELETE CASCADE,
        payload jsonb NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        CHECK ((kind = 'interaction' AND grant_id IS NULL) OR (kind <> 'interaction' AND grant_id IS NOT NULL))
      );
      CREATE INDEX mcp_oauth_artifacts_expiry_idx ON mcp_oauth_artifacts(expires_at);
      CREATE INDEX mcp_oauth_artifacts_grant_idx ON mcp_oauth_artifacts(grant_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE mcp_oauth_artifacts; DROP TABLE mcp_oauth_grants; DROP TABLE mcp_oauth_clients;',
    );
  }
}
