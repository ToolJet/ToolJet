import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceBranchTables1772568626000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. organization_git_sync_branches (renamed from workspace_branches)
    await queryRunner.query(`
      CREATE TABLE organization_git_sync_branches (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        branch_name             VARCHAR(255) NOT NULL,
        is_default              BOOLEAN NOT NULL DEFAULT false,
        source_branch_id        UUID REFERENCES organization_git_sync_branches(id) ON DELETE SET NULL,
        app_meta_hash           VARCHAR(64) DEFAULT NULL,
        data_source_meta_hash   VARCHAR(64) DEFAULT NULL,
        created_at              TIMESTAMP NOT NULL DEFAULT now(),
        updated_at              TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(organization_id, branch_name)
      );
    `);

    // 2. data_source_versions
    await queryRunner.query(`
      CREATE TABLE data_source_versions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_source_id   UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
        version_from_id  UUID REFERENCES data_source_versions(id) ON DELETE SET NULL,
        is_default       BOOLEAN NOT NULL DEFAULT false,
        name             VARCHAR(255) NOT NULL,
        is_active        BOOLEAN NOT NULL DEFAULT true,
        app_version_id   UUID REFERENCES app_versions(id) ON DELETE CASCADE,
        meta_timestamp   NUMERIC(15) DEFAULT NULL,
        branch_id        UUID REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE,
        pulled_at        TIMESTAMP DEFAULT NULL,
        created_at       TIMESTAMP NOT NULL DEFAULT now(),
        updated_at       TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(data_source_id, branch_id)
      );
    `);

    // Partial unique index: only one default version per data source
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_data_source_versions_one_default
      ON data_source_versions (data_source_id) WHERE is_default = true;
    `);

    // 4. data_source_version_options
    await queryRunner.query(`
      CREATE TABLE data_source_version_options (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_source_version_id  UUID NOT NULL REFERENCES data_source_versions(id) ON DELETE CASCADE,
        environment_id          UUID NOT NULL REFERENCES app_environments(id) ON DELETE CASCADE,
        options                 JSONB NOT NULL DEFAULT '{}',
        created_at              TIMESTAMP NOT NULL DEFAULT now(),
        updated_at              TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(data_source_version_id, environment_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_version_options`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_data_source_versions_one_default`);
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_git_sync_branches`);
  }
}
