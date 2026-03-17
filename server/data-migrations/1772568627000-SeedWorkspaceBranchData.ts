import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWorkspaceBranchData1772568627000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create default branch for every org that has git sync configured
    //    Uses the actual branch name from the provider config (HTTPS / SSH / GitLab),
    //    falling back to 'main' only if no provider config exists.
    await queryRunner.query(`
      INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
      SELECT
        ogs.organization_id,
        COALESCE(
          ogh.github_branch,
          ogsh.git_branch,
          ogl.gitlab_branch,
          'main'
        ),
        true
      FROM organization_git_sync ogs
      LEFT JOIN organization_git_https ogh ON ogh.config_id = ogs.id
      LEFT JOIN organization_git_ssh ogsh ON ogsh.config_id = ogs.id
      LEFT JOIN organization_gitlab ogl ON ogl.config_id = ogs.id
      ON CONFLICT (organization_id, branch_name) DO NOTHING;
    `);

    // 1b. Create workspace branches for pre-existing app-scoped branches.
    //     Old model: branches were app_versions with version_type='branch' and name = branch name.
    //     New model: workspace-scoped branches in organization_git_sync_branches.
    //     For each distinct (org, branch_name) combination, create a workspace branch entry
    //     with source_branch_id pointing to the default branch.
    //     ON CONFLICT skips if the name matches the default branch already created above.
    await queryRunner.query(`
      INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default, source_branch_id)
      SELECT DISTINCT
        a.organization_id,
        av.name,
        false,
        wb_default.id
      FROM app_versions av
      JOIN apps a ON a.id = av.app_id
      JOIN organization_git_sync ogs ON ogs.organization_id = a.organization_id
      JOIN organization_git_sync_branches wb_default
        ON wb_default.organization_id = a.organization_id AND wb_default.is_default = true
      WHERE av.version_type = 'branch'
      ON CONFLICT (organization_id, branch_name) DO NOTHING;
    `);

    // 2. Create data_source_versions for all global DS on the default branch (marked as default v1)
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active)
      SELECT ds.id, wb.id, ds.name, true, true
      FROM data_sources ds
      JOIN organization_git_sync_branches wb ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_id, branch_id) DO NOTHING;
    `);

    // 2b. Create data_source_versions for all global DS on non-default branches.
    //     Each feature branch gets its own DSV (non-default) copied from the default DSV.
    //     This enables per-branch DS configuration for old app-scoped branches.
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active, version_from_id)
      SELECT ds.id, wb.id, ds.name, false, true, default_dsv.id
      FROM data_sources ds
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = ds.organization_id AND wb.is_default = false
      JOIN data_source_versions default_dsv
        ON default_dsv.data_source_id = ds.id AND default_dsv.is_default = true
      WHERE ds.scope = 'global'
        AND ds.app_version_id IS NULL
      ON CONFLICT (data_source_id, branch_id) DO NOTHING;
    `);

    // 3. Copy data_source_options → data_source_version_options for the default branch DSVs
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

    // 3b. Copy DSVO from default branch DSVs into non-default branch DSVs.
    //     Each feature branch starts with the same DS options as the default branch
    //     (matching the pre-migration behavior where all branches shared the same options).
    //     After migration, users can independently modify DS config per branch.
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT branch_dsv.id, default_dsvo.environment_id, default_dsvo.options
      FROM data_source_versions branch_dsv
      JOIN organization_git_sync_branches wb
        ON wb.id = branch_dsv.branch_id AND wb.is_default = false
      JOIN data_source_versions default_dsv
        ON default_dsv.data_source_id = branch_dsv.data_source_id AND default_dsv.is_default = true
      JOIN data_source_version_options default_dsvo
        ON default_dsvo.data_source_version_id = default_dsv.id
      WHERE branch_dsv.is_default = false
        AND branch_dsv.app_version_id IS NULL
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING;
    `);

    // 4a. Backfill branch_id on branch-type app_versions by matching name → workspace branch.
    //     This preserves branch identity: feature-auth → feature-auth workspace branch.
    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a, organization_git_sync_branches wb
      WHERE av.app_id = a.id
        AND wb.organization_id = a.organization_id
        AND wb.branch_name = av.name
        AND av.version_type = 'branch'
        AND av.branch_id IS NULL;
    `);

    // 4b. Assign remaining app_versions (version-type, or any unmatched) to the default branch.
    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
        AND av.branch_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM data_source_version_options`);
    await queryRunner.query(`DELETE FROM data_source_versions`);
    await queryRunner.query(`DELETE FROM organization_git_sync_branches`);
  }
}
