import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWorkspaceBranchData1772568627000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create default 'main' branch for every org that has git sync configured
    await queryRunner.query(`
      INSERT INTO workspace_branches (organization_id, name, is_default)
      SELECT organization_id, 'main', true
      FROM organization_git_sync
      ON CONFLICT (organization_id, name) DO NOTHING;
    `);

    // 2. Set active_branch_id on organization_git_sync
    await queryRunner.query(`
      UPDATE organization_git_sync ogs
      SET active_branch_id = wb.id
      FROM workspace_branches wb
      WHERE wb.organization_id = ogs.organization_id
        AND wb.is_default = true
        AND ogs.active_branch_id IS NULL;
    `);

    // 3. Create data_source_versions for all global DS
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, branch_id, name, is_active)
      SELECT ds.id, wb.id, ds.name, true
      FROM data_sources ds
      JOIN workspace_branches wb ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_id, branch_id) DO NOTHING;
    `);

    // 4. Copy data_source_options → data_source_version_options for global DS
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT dsv.id, dso.environment_id, COALESCE(dso.options, '{}'::json)::jsonb
      FROM data_source_options dso
      JOIN data_sources ds ON ds.id = dso.data_source_id
      JOIN data_source_versions dsv ON dsv.data_source_id = ds.id
      JOIN workspace_branches wb ON wb.id = dsv.branch_id AND wb.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING;
    `);

    // 5. Create organization_constant_versions for all constants
    await queryRunner.query(`
      INSERT INTO organization_constant_versions (organization_constant_id, branch_id, is_active)
      SELECT oc.id, wb.id, true
      FROM organization_constants oc
      JOIN workspace_branches wb ON wb.organization_id = oc.organization_id AND wb.is_default = true
      ON CONFLICT (organization_constant_id, branch_id) DO NOTHING;
    `);

    // 6. Copy org_environment_constant_values → organization_constant_version_values
    await queryRunner.query(`
      INSERT INTO organization_constant_version_values (constant_version_id, environment_id, value)
      SELECT ocv.id, oecv.environment_id, COALESCE(oecv.value, '')
      FROM org_environment_constant_values oecv
      JOIN organization_constants oc ON oc.id = oecv.organization_constant_id
      JOIN organization_constant_versions ocv ON ocv.organization_constant_id = oc.id
      JOIN workspace_branches wb ON wb.id = ocv.branch_id AND wb.is_default = true
      ON CONFLICT (constant_version_id, environment_id) DO NOTHING;
    `);

    // 7. Create folder_branch_entries for all folders
    await queryRunner.query(`
      INSERT INTO folder_branch_entries (folder_id, branch_id, is_active)
      SELECT f.id, wb.id, true
      FROM folders f
      JOIN workspace_branches wb ON wb.organization_id = f.organization_id AND wb.is_default = true
      ON CONFLICT (folder_id, branch_id) DO NOTHING;
    `);

    // 8. Copy folder_apps → folder_app_branch_entries
    await queryRunner.query(`
      INSERT INTO folder_app_branch_entries (folder_branch_entry_id, app_id)
      SELECT fbe.id, fa.app_id
      FROM folder_apps fa
      JOIN folder_branch_entries fbe ON fbe.folder_id = fa.folder_id
      JOIN workspace_branches wb ON wb.id = fbe.branch_id AND wb.is_default = true
      ON CONFLICT (folder_branch_entry_id, app_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM folder_app_branch_entries`);
    await queryRunner.query(`DELETE FROM folder_branch_entries`);
    await queryRunner.query(`DELETE FROM organization_constant_version_values`);
    await queryRunner.query(`DELETE FROM organization_constant_versions`);
    await queryRunner.query(`DELETE FROM data_source_version_options`);
    await queryRunner.query(`DELETE FROM data_source_versions`);
    await queryRunner.query(`UPDATE organization_git_sync SET active_branch_id = NULL`);
    await queryRunner.query(`DELETE FROM workspace_branches`);
  }
}
