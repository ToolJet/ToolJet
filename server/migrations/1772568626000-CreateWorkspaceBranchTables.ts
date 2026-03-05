import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceBranchTables1772568626000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. workspace_branches
    await queryRunner.query(`
      CREATE TABLE workspace_branches (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        is_default      BOOLEAN NOT NULL DEFAULT false,
        source_branch_id UUID REFERENCES workspace_branches(id) ON DELETE SET NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT now(),
        updated_at      TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(organization_id, name)
      );
    `);

    // 2. active_branch_id on organization_git_sync
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
      ADD COLUMN IF NOT EXISTS active_branch_id UUID REFERENCES workspace_branches(id) ON DELETE SET NULL;
    `);

    // 3. data_source_versions
    await queryRunner.query(`
      CREATE TABLE data_source_versions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_source_id  UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
        branch_id       UUID NOT NULL REFERENCES workspace_branches(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        is_active       BOOLEAN NOT NULL DEFAULT true,
        created_at      TIMESTAMP NOT NULL DEFAULT now(),
        updated_at      TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(data_source_id, branch_id)
      );
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

    // 5. organization_constant_versions
    await queryRunner.query(`
      CREATE TABLE organization_constant_versions (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_constant_id    UUID NOT NULL REFERENCES organization_constants(id) ON DELETE CASCADE,
        branch_id                   UUID NOT NULL REFERENCES workspace_branches(id) ON DELETE CASCADE,
        is_active                   BOOLEAN NOT NULL DEFAULT true,
        created_at                  TIMESTAMP NOT NULL DEFAULT now(),
        updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(organization_constant_id, branch_id)
      );
    `);

    // 6. organization_constant_version_values
    await queryRunner.query(`
      CREATE TABLE organization_constant_version_values (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        constant_version_id UUID NOT NULL REFERENCES organization_constant_versions(id) ON DELETE CASCADE,
        environment_id      UUID NOT NULL REFERENCES app_environments(id) ON DELETE CASCADE,
        value               TEXT NOT NULL DEFAULT '',
        created_at          TIMESTAMP NOT NULL DEFAULT now(),
        updated_at          TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(constant_version_id, environment_id)
      );
    `);

    // 7. folder_branch_entries
    await queryRunner.query(`
      CREATE TABLE folder_branch_entries (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_id   UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        branch_id   UUID NOT NULL REFERENCES workspace_branches(id) ON DELETE CASCADE,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        name        VARCHAR(255),
        created_at  TIMESTAMP NOT NULL DEFAULT now(),
        updated_at  TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(folder_id, branch_id)
      );
    `);

    // 8. folder_app_branch_entries
    await queryRunner.query(`
      CREATE TABLE folder_app_branch_entries (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_branch_entry_id  UUID NOT NULL REFERENCES folder_branch_entries(id) ON DELETE CASCADE,
        app_id                  UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        created_at              TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(folder_branch_entry_id, app_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS folder_app_branch_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS folder_branch_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_constant_version_values`);
    await queryRunner.query(`DROP TABLE IF EXISTS organization_constant_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_version_options`);
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_versions`);
    await queryRunner.query(`ALTER TABLE organization_git_sync DROP COLUMN IF EXISTS active_branch_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS workspace_branches`);
  }
}
