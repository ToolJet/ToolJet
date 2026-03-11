import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWorkspaceBranchData1772568627000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create default 'main' branch for every org that has git sync configured
    await queryRunner.query(`
      INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
      SELECT organization_id, 'main', true
      FROM organization_git_sync
      ON CONFLICT (organization_id, branch_name) DO NOTHING;
    `);

    // 2. Create data_source_versions for all global DS (marked as default v1)
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active)
      SELECT ds.id, wb.id, ds.name, true, true
      FROM data_sources ds
      JOIN organization_git_sync_branches wb ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_id, branch_id) DO NOTHING;
    `);

    // 3. Copy data_source_options → data_source_version_options for global DS
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT dsv.id, dso.environment_id, COALESCE(dso.options, '{}'::json)::jsonb
      FROM data_source_options dso
      JOIN data_sources ds ON ds.id = dso.data_source_id
      JOIN data_source_versions dsv ON dsv.data_source_id = ds.id
      JOIN organization_git_sync_branches wb ON wb.id = dsv.branch_id AND wb.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM data_source_version_options`);
    await queryRunner.query(`DELETE FROM data_source_versions`);
    await queryRunner.query(`DELETE FROM organization_git_sync_branches`);
  }
}
