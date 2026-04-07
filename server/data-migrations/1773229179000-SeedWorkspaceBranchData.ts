import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWorkspaceBranchData1773229179000 implements MigrationInterface {
  private readonly BATCH_SIZE = 100;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Create default branches for orgs with git sync (batched by org)
    // ─────────────────────────────────────────────────────────────────────────
    const orgsWithGitSync: { organization_id: string; branch_name: string }[] = await queryRunner.query(`
      SELECT
        ogs.organization_id,
        COALESCE(ogh.github_branch, ogsh.git_branch, ogl.gitlab_branch, 'main') as branch_name
      FROM organization_git_sync ogs
      LEFT JOIN organization_git_https ogh ON ogh.config_id = ogs.id
      LEFT JOIN organization_git_ssh ogsh ON ogsh.config_id = ogs.id
      LEFT JOIN organization_gitlab ogl ON ogl.config_id = ogs.id
    `);

    const totalOrgs = orgsWithGitSync.length;
    console.log(`[START] Creating default workspace branches | Total: ${totalOrgs}`);

    for (let i = 0; i < totalOrgs; i += this.BATCH_SIZE) {
      const batch = orgsWithGitSync.slice(i, i + this.BATCH_SIZE);
      for (const org of batch) {
        await queryRunner.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, $2, true)
           ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [org.organization_id, org.branch_name]
        );
      }
      console.log(`[PROGRESS] Default branches: ${Math.min(i + this.BATCH_SIZE, totalOrgs)}/${totalOrgs}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1b: Create workspace branches for pre-existing app-scoped branches
    // ─────────────────────────────────────────────────────────────────────────
    const appBranches: { organization_id: string; branch_name: string; default_branch_id: string }[] =
      await queryRunner.query(`
        SELECT DISTINCT
          a.organization_id,
          av.name as branch_name,
          wb_default.id as default_branch_id
        FROM app_versions av
        JOIN apps a ON a.id = av.app_id
        JOIN organization_git_sync ogs ON ogs.organization_id = a.organization_id
        JOIN organization_git_sync_branches wb_default
          ON wb_default.organization_id = a.organization_id AND wb_default.is_default = true
        WHERE av.version_type = 'branch'
      `);

    const totalAppBranches = appBranches.length;
    console.log(`[START] Creating workspace branches from app branches | Total: ${totalAppBranches}`);

    for (let i = 0; i < totalAppBranches; i += this.BATCH_SIZE) {
      const batch = appBranches.slice(i, i + this.BATCH_SIZE);
      for (const branch of batch) {
        await queryRunner.query(
          `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default, source_branch_id)
           VALUES ($1, $2, false, $3)
           ON CONFLICT (organization_id, branch_name) DO NOTHING`,
          [branch.organization_id, branch.branch_name, branch.default_branch_id]
        );
      }
      console.log(`[PROGRESS] App branches: ${Math.min(i + this.BATCH_SIZE, totalAppBranches)}/${totalAppBranches}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Create isDefault DSVs (branch_id = NULL) for global data sources
    // ─────────────────────────────────────────────────────────────────────────
    const globalDataSources: { id: string; name: string }[] = await queryRunner.query(`
      SELECT ds.id, ds.name
      FROM data_sources ds
      WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
    `);

    const totalDS = globalDataSources.length;
    console.log(`[START] Creating isDefault DSVs | Total: ${totalDS}`);

    for (let i = 0; i < totalDS; i += this.BATCH_SIZE) {
      const batch = globalDataSources.slice(i, i + this.BATCH_SIZE);
      for (const ds of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active)
           VALUES ($1, NULL, $2, true, true)
           ON CONFLICT DO NOTHING`,
          [ds.id, ds.name]
        );
      }
      console.log(`[PROGRESS] isDefault DSVs: ${Math.min(i + this.BATCH_SIZE, totalDS)}/${totalDS}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2b: Create main branch DSVs
    // ─────────────────────────────────────────────────────────────────────────
    const mainBranchDSData: { ds_id: string; branch_id: string; ds_name: string }[] = await queryRunner.query(`
      SELECT ds.id as ds_id, wb.id as branch_id, ds.name as ds_name
      FROM data_sources ds
      JOIN organization_git_sync_branches wb ON wb.organization_id = ds.organization_id AND wb.is_default = true
      WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
    `);

    const totalMainDSV = mainBranchDSData.length;
    console.log(`[START] Creating main branch DSVs | Total: ${totalMainDSV}`);

    for (let i = 0; i < totalMainDSV; i += this.BATCH_SIZE) {
      const batch = mainBranchDSData.slice(i, i + this.BATCH_SIZE);
      for (const item of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active)
           VALUES ($1, $2, $3, false, true)
           ON CONFLICT (data_source_id, branch_id) DO NOTHING`,
          [item.ds_id, item.branch_id, item.ds_name]
        );
      }
      console.log(`[PROGRESS] Main branch DSVs: ${Math.min(i + this.BATCH_SIZE, totalMainDSV)}/${totalMainDSV}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2c: Create feature branch DSVs
    // ─────────────────────────────────────────────────────────────────────────
    const featureBranchDSData: { ds_id: string; branch_id: string; ds_name: string; default_dsv_id: string }[] =
      await queryRunner.query(`
        SELECT ds.id as ds_id, wb.id as branch_id, ds.name as ds_name, default_dsv.id as default_dsv_id
        FROM data_sources ds
        JOIN organization_git_sync_branches wb
          ON wb.organization_id = ds.organization_id AND wb.is_default = false
        JOIN data_source_versions default_dsv
          ON default_dsv.data_source_id = ds.id AND default_dsv.is_default = true
        WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
      `);

    const totalFeatureDSV = featureBranchDSData.length;
    console.log(`[START] Creating feature branch DSVs | Total: ${totalFeatureDSV}`);

    for (let i = 0; i < totalFeatureDSV; i += this.BATCH_SIZE) {
      const batch = featureBranchDSData.slice(i, i + this.BATCH_SIZE);
      for (const item of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_versions (data_source_id, branch_id, name, is_default, is_active, version_from_id)
           VALUES ($1, $2, $3, false, true, $4)
           ON CONFLICT (data_source_id, branch_id) DO NOTHING`,
          [item.ds_id, item.branch_id, item.ds_name, item.default_dsv_id]
        );
      }
      console.log(
        `[PROGRESS] Feature branch DSVs: ${Math.min(i + this.BATCH_SIZE, totalFeatureDSV)}/${totalFeatureDSV}`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Copy data_source_options → data_source_version_options (isDefault)
    // ─────────────────────────────────────────────────────────────────────────
    const dsOptions: { dsv_id: string; environment_id: string; options: string }[] = await queryRunner.query(`
      SELECT dsv.id as dsv_id, dso.environment_id, COALESCE(dso.options, '{}')::text as options
      FROM data_source_options dso
      JOIN data_sources ds ON ds.id = dso.data_source_id
      JOIN data_source_versions dsv ON dsv.data_source_id = ds.id AND dsv.is_default = true
      WHERE ds.scope = 'global' AND ds.app_version_id IS NULL
    `);

    const totalDSOptions = dsOptions.length;
    console.log(`[START] Copying DS options to isDefault DSVOs | Total: ${totalDSOptions}`);

    for (let i = 0; i < totalDSOptions; i += this.BATCH_SIZE) {
      const batch = dsOptions.slice(i, i + this.BATCH_SIZE);
      for (const opt of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
           VALUES ($1, $2, $3::jsonb)
           ON CONFLICT (data_source_version_id, environment_id) DO NOTHING`,
          [opt.dsv_id, opt.environment_id, opt.options]
        );
      }
      console.log(`[PROGRESS] isDefault DSVOs: ${Math.min(i + this.BATCH_SIZE, totalDSOptions)}/${totalDSOptions}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3b: Copy DSVO to main branch DSVs
    // ─────────────────────────────────────────────────────────────────────────
    const mainBranchDSVO: { main_dsv_id: string; environment_id: string; options: string }[] = await queryRunner.query(`
        SELECT main_dsv.id as main_dsv_id, default_dsvo.environment_id, default_dsvo.options::text as options
        FROM data_source_versions main_dsv
        JOIN organization_git_sync_branches wb
          ON wb.id = main_dsv.branch_id AND wb.is_default = true
        JOIN data_source_versions default_dsv
          ON default_dsv.data_source_id = main_dsv.data_source_id AND default_dsv.is_default = true
        JOIN data_source_version_options default_dsvo
          ON default_dsvo.data_source_version_id = default_dsv.id
        WHERE main_dsv.is_default = false AND main_dsv.app_version_id IS NULL
      `);

    const totalMainDSVO = mainBranchDSVO.length;
    console.log(`[START] Copying DS options to main branch DSVOs | Total: ${totalMainDSVO}`);

    for (let i = 0; i < totalMainDSVO; i += this.BATCH_SIZE) {
      const batch = mainBranchDSVO.slice(i, i + this.BATCH_SIZE);
      for (const opt of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
           VALUES ($1, $2, $3::jsonb)
           ON CONFLICT (data_source_version_id, environment_id) DO NOTHING`,
          [opt.main_dsv_id, opt.environment_id, opt.options]
        );
      }
      console.log(`[PROGRESS] Main branch DSVOs: ${Math.min(i + this.BATCH_SIZE, totalMainDSVO)}/${totalMainDSVO}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3c: Copy DSVO to feature branch DSVs
    // ─────────────────────────────────────────────────────────────────────────
    const featureBranchDSVO: { branch_dsv_id: string; environment_id: string; options: string }[] =
      await queryRunner.query(`
        SELECT branch_dsv.id as branch_dsv_id, default_dsvo.environment_id, default_dsvo.options::text as options
        FROM data_source_versions branch_dsv
        JOIN organization_git_sync_branches wb
          ON wb.id = branch_dsv.branch_id AND wb.is_default = false
        JOIN data_source_versions default_dsv
          ON default_dsv.data_source_id = branch_dsv.data_source_id AND default_dsv.is_default = true
        JOIN data_source_version_options default_dsvo
          ON default_dsvo.data_source_version_id = default_dsv.id
        WHERE branch_dsv.is_default = false AND branch_dsv.app_version_id IS NULL
      `);

    const totalFeatureDSVO = featureBranchDSVO.length;
    console.log(`[START] Copying DS options to feature branch DSVOs | Total: ${totalFeatureDSVO}`);

    for (let i = 0; i < totalFeatureDSVO; i += this.BATCH_SIZE) {
      const batch = featureBranchDSVO.slice(i, i + this.BATCH_SIZE);
      for (const opt of batch) {
        await queryRunner.query(
          `INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
           VALUES ($1, $2, $3::jsonb)
           ON CONFLICT (data_source_version_id, environment_id) DO NOTHING`,
          [opt.branch_dsv_id, opt.environment_id, opt.options]
        );
      }
      console.log(
        `[PROGRESS] Feature branch DSVOs: ${Math.min(i + this.BATCH_SIZE, totalFeatureDSVO)}/${totalFeatureDSVO}`
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4a: Backfill branch_id on branch-type app_versions
    // ─────────────────────────────────────────────────────────────────────────
    const branchAppVersions: { av_id: string; branch_id: string }[] = await queryRunner.query(`
      SELECT av.id as av_id, wb.id as branch_id
      FROM app_versions av
      JOIN apps a ON a.id = av.app_id
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.branch_name = av.name
      WHERE av.version_type = 'branch' AND av.branch_id IS NULL
    `);

    const totalBranchAV = branchAppVersions.length;
    console.log(`[START] Backfilling branch_id on branch-type app_versions | Total: ${totalBranchAV}`);

    for (let i = 0; i < totalBranchAV; i += this.BATCH_SIZE) {
      const batch = branchAppVersions.slice(i, i + this.BATCH_SIZE);
      for (const av of batch) {
        await queryRunner.query(`UPDATE app_versions SET branch_id = $1 WHERE id = $2`, [av.branch_id, av.av_id]);
      }
      console.log(`[PROGRESS] Branch app_versions: ${Math.min(i + this.BATCH_SIZE, totalBranchAV)}/${totalBranchAV}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4b: Assign remaining app_versions to default branch
    // ─────────────────────────────────────────────────────────────────────────
    const remainingAppVersions: { av_id: string; default_branch_id: string }[] = await queryRunner.query(`
      SELECT av.id as av_id, wb.id as default_branch_id
      FROM app_versions av
      JOIN apps a ON a.id = av.app_id
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.branch_id IS NULL
    `);

    const totalRemainingAV = remainingAppVersions.length;
    console.log(`[START] Assigning remaining app_versions to default branch | Total: ${totalRemainingAV}`);

    for (let i = 0; i < totalRemainingAV; i += this.BATCH_SIZE) {
      const batch = remainingAppVersions.slice(i, i + this.BATCH_SIZE);
      for (const av of batch) {
        await queryRunner.query(`UPDATE app_versions SET branch_id = $1 WHERE id = $2`, [
          av.default_branch_id,
          av.av_id,
        ]);
      }
      console.log(
        `[PROGRESS] Remaining app_versions: ${Math.min(i + this.BATCH_SIZE, totalRemainingAV)}/${totalRemainingAV}`
      );
    }

    console.log(`[SUCCESS] SeedWorkspaceBranchData migration finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM data_source_version_options`);
    await queryRunner.query(`DELETE FROM data_source_versions`);
    await queryRunner.query(`DELETE FROM organization_git_sync_branches`);
  }
}
