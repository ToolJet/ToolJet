import { MigrationInterface, QueryRunner } from 'typeorm';

/** Indexes for application-owned revocation. No database triggers are installed. */
export class AddMcpOAuthRevocationHooks1791290000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX mcp_oauth_grants_active_workspace_idx
        ON mcp_oauth_grants(organization_id) WHERE revoked_at IS NULL;
      CREATE INDEX mcp_oauth_grants_active_client_idx
        ON mcp_oauth_grants(client_id) WHERE revoked_at IS NULL;
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX mcp_oauth_grants_active_workspace_idx;
      DROP INDEX mcp_oauth_grants_active_client_idx;
    `);
  }
}
