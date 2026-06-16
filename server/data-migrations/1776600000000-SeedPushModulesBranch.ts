import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { MigrationProgress } from '@helpers/migration.helper';
import { AppModule } from '@modules/app/module';
import { getImportPath } from '@modules/app/constants';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { APP_TYPES } from '@modules/apps/constants';
// Types only — runtime instances resolve via dynamic import matching SubModule.getProviders
// path, otherwise the compile-time class reference doesn't match the DI-registered token.
// Pattern copied from 1752749046662-EncrpyGoogleCalendarClientSecret.ts.
import type { DataSourceBranchUtil } from '@modules/app-git/shared/datasource-branch.util';
import type { VersionsCreateService } from '@modules/versions/services/create.service';

const BRANCH_NAME = 'push-modules';
const MIGRATION_NAME = 'SeedPushModulesBranch1776600000000';

export class SeedPushModulesBranch1776600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const em = queryRunner.manager;

    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    // Load the service classes from the same path AppModule used so the class
    // references match the DI-registered tokens. SubModule.getProviders() does
    // `await import(<getImportPath()>/<module>/<path>)` — we mirror it exactly.
    const importPath = await getImportPath(true);
    const { VersionsCreateService: VersionsCreateServiceClass } = await import(
      `${importPath}/versions/services/create.service`
    );
    const { DataSourceBranchUtil: DataSourceBranchUtilClass } = await import(
      `${importPath}/app-git/shared/datasource-branch.util`
    );

    const versionsCreate: VersionsCreateService = nestApp.get(VersionsCreateServiceClass, { strict: false });
    const dataSourceBranchUtil: DataSourceBranchUtil = nestApp.get(DataSourceBranchUtilClass, { strict: false });

    try {
      const defaultBranches = await em.find(WorkspaceBranch, { where: { isDefault: true } });

      if (defaultBranches.length === 0) {
        console.log(`${MIGRATION_NAME}: no orgs with a default workspace branch; skipping.`);
        return;
      }

      const progress = new MigrationProgress(MIGRATION_NAME, defaultBranches.length);

      for (const defaultBranch of defaultBranches) {
        try {
          await this.seedForOrg(em, versionsCreate, dataSourceBranchUtil, defaultBranch);
        } catch (err) {
          console.error(`${MIGRATION_NAME}: org=${defaultBranch.organizationId} failed; continuing.`, err);
        }
        progress.show();
      }

      // 1776470400000 created this staging table to pass module origin
      // branch_ids across the migration boundary. Drop it now that all orgs
      // have been processed.
      await em.query(`DROP TABLE IF EXISTS module_origin_branch_staging`);
    } finally {
      await nestApp.close();
    }
  }

  private async seedForOrg(
    em: EntityManager,
    versionsCreate: VersionsCreateService,
    dataSourceBranchUtil: DataSourceBranchUtil,
    defaultBranch: WorkspaceBranch
  ): Promise<void> {
    let branch = await em.findOne(WorkspaceBranch, {
      where: { organizationId: defaultBranch.organizationId, name: BRANCH_NAME },
    });

    if (!branch) {
      branch = await em.save(
        WorkspaceBranch,
        em.create(WorkspaceBranch, {
          organizationId: defaultBranch.organizationId,
          name: BRANCH_NAME,
          sourceBranchId: defaultBranch.id,
          isDefault: false,
          createdBy: null,
        })
      );

      await dataSourceBranchUtil.cloneDataSourceVersions(defaultBranch.id, branch.id, em);
    }

    const modules = await em
      .createQueryBuilder(App, 'app')
      .where('app.organizationId = :orgId', { orgId: defaultBranch.organizationId })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE })
      .getMany();

    if (modules.length === 0) return;

    const orgGit = await em.findOne(OrganizationGitSync, {
      where: { organizationId: defaultBranch.organizationId },
    });

    // Step 1: seed module BRANCH versions on the push-modules branch only.
    // The app remap pass below depends on these rows existing on that branch.
    for (const moduleApp of modules) {
      await this.cloneVersionToBranch(
        em,
        versionsCreate,
        moduleApp,
        branch,
        defaultBranch.organizationId,
        /* stampModuleReferenceId */ true
      );
      if (orgGit) await this.ensureAppGitSyncRow(em, moduleApp, orgGit.id);
    }

    // Step 1b: restore module BRANCH presence on each module's origin feature
    // branch. 1776470400000 captured these origins before normalizing the
    // VERSION-row branch_id to default. Cloning here means users who created
    // a module on a feature branch still see it when opening that branch.
    // cloneVersionToBranch is idempotent — if a BRANCH row already exists on
    // the origin branch, this is a no-op.
    const originRows: Array<{ app_id: string; origin_branch_id: string }> = await em.query(
      `SELECT mobs.app_id, mobs.origin_branch_id
       FROM module_origin_branch_staging mobs
       JOIN apps a ON a.id = mobs.app_id
       WHERE a.organization_id = $1`,
      [defaultBranch.organizationId]
    );
    for (const { app_id, origin_branch_id } of originRows) {
      const moduleApp = modules.find((m) => m.id === app_id);
      if (!moduleApp) continue;
      const originBranch = await em.findOne(WorkspaceBranch, { where: { id: origin_branch_id } });
      if (!originBranch) continue;
      await this.cloneVersionToBranch(
        em,
        versionsCreate,
        moduleApp,
        originBranch,
        defaultBranch.organizationId,
        /* stampModuleReferenceId */ true
      );
    }

    // Step 2: seed a push-modules BRANCH version for non-module apps that contain
    // at least one ModuleViewer. No post-clone pin remap is needed — by the time
    // this runs, 1776470400000 has already corrected every ModuleViewer pin to
    // either the default-branch released module_reference_id or '' (unpinned).
    // The clone copies components verbatim from a stable source via
    // setupNewVersion, so the new BRANCH version inherits the correct pin
    // without further action.
    const appsWithModuleViewers = await this.findAppsWithModuleViewers(em, defaultBranch.organizationId);
    for (const app of appsWithModuleViewers) {
      // Resolve a stable default-branch source so cloneVersionToBranch's
      // "latest by created_at" fallback can't accidentally pick up an
      // existing BRANCH row.
      const lockedSource = await this.findStableAppSource(em, app, defaultBranch.id);
      await this.cloneVersionToBranch(
        em,
        versionsCreate,
        app,
        branch,
        defaultBranch.organizationId,
        /* stampModuleReferenceId */ false,
        lockedSource
      );
    }
  }

  /**
   * Resolve a stable default-branch source version to clone from, so that
   * cloneVersionToBranch's "latest by created_at" fallback can't accidentally
   * pick up a pre-existing BRANCH row as the source.
   *
   * Order:
   *   1. Default-branch VERSION-type row (status irrelevant — even DRAFT is correct)
   *   2. App.currentVersionId, if set (normally points at the released VERSION row)
   *   3. OLDEST version on the app — never "latest", because picking "latest"
   *      could bind the clone to a pre-existing BRANCH row that may have a
   *      different shape (e.g. different home page, different content) than the
   *      canonical default-branch version we want the clone to match.
   *
   * Returns null if the app has no version at all (skip cloning entirely).
   */
  private async findStableAppSource(em: EntityManager, app: App, defaultBranchId: string): Promise<AppVersion | null> {
    const defaultBranchVersion = await em.findOne(AppVersion, {
      where: {
        appId: app.id,
        branchId: defaultBranchId,
        versionType: AppVersionType.VERSION,
        isStub: false,
      },
      order: { createdAt: 'DESC' },
      relations: ['dataSources'],
    });
    if (defaultBranchVersion) return defaultBranchVersion;

    if (app.currentVersionId) {
      const byCurrent = await em.findOne(AppVersion, {
        where: { id: app.currentVersionId },
        relations: ['dataSources'],
      });
      if (byCurrent) return byCurrent;
    }

    return em.findOne(AppVersion, {
      where: { appId: app.id, isStub: false },
      order: { createdAt: 'ASC' },
      relations: ['dataSources'],
    });
  }

  /**
   * Clone the source app's released (or latest) default-branch version onto the
   * target branch as a hydrated DRAFT BRANCH version. Returns the freshly-created
   * row, or null if a hydrated BRANCH version already exists (idempotent — never
   * overwrites pre-existing branch content).
   *
   * stampModuleReferenceId: stamp a fresh UUID on the new row's module_reference_id.
   * True for type='module' apps so cross-instance pin resolution works; false for
   * regular apps (the column only carries meaning for module versions).
   *
   * presetSourceVersion: when supplied, use this row as the clone source instead of
   * resolving via currentVersionId / latest-by-created_at. Step 2 (apps with
   * ModuleViewers) passes a default-branch-locked source so the fallback can't
   * pick up a pre-existing BRANCH row.
   */
  private async cloneVersionToBranch(
    em: EntityManager,
    versionsCreate: VersionsCreateService,
    sourceApp: App,
    targetBranch: WorkspaceBranch,
    organizationId: string,
    stampModuleReferenceId: boolean,
    presetSourceVersion?: AppVersion | null
  ): Promise<AppVersion | null> {
    const existing = await em.findOne(AppVersion, {
      where: {
        appId: sourceApp.id,
        branchId: targetBranch.id,
        versionType: AppVersionType.BRANCH,
        isStub: false,
      },
    });
    if (existing) return null;

    await em.delete(AppVersion, {
      appId: sourceApp.id,
      branchId: targetBranch.id,
      versionType: AppVersionType.BRANCH,
      isStub: true,
    });

    const sourceVersion =
      presetSourceVersion ??
      (sourceApp.currentVersionId
        ? await em.findOne(AppVersion, {
            where: { id: sourceApp.currentVersionId },
            relations: ['dataSources'],
          })
        : await em.findOne(AppVersion, {
            where: { appId: sourceApp.id },
            order: { createdAt: 'DESC' },
            relations: ['dataSources'],
          }));
    if (!sourceVersion) return null;

    const existingWithBranchName = await em.findOne(AppVersion, {
      where: { appId: sourceApp.id, name: targetBranch.name },
    });
    const versionName = existingWithBranchName ? `${targetBranch.name}_${Date.now()}` : targetBranch.name;

    const devEnv = await em.findOne(AppEnvironment, {
      where: { organizationId, priority: 1 },
    });

    const newVersion = em.create(AppVersion, {
      appId: sourceApp.id,
      name: versionName,
      definition: {},
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.BRANCH,
      branchId: targetBranch.id,
      parentVersionId: sourceVersion.id,
      currentEnvironmentId: devEnv?.id ?? sourceVersion.currentEnvironmentId,
      isStub: false,
      moduleReferenceId: stampModuleReferenceId ? randomUUID() : null,
    });

    await versionsCreate.setupNewVersion(newVersion, sourceVersion, organizationId, em);
    return newVersion;
  }

  /**
   * Apps (type != 'module') that contain at least one ModuleViewer in any of their
   * versions. DISTINCT on app id — versions with multiple viewers would otherwise
   * pull the same app in many times.
   */
  private async findAppsWithModuleViewers(em: EntityManager, organizationId: string): Promise<App[]> {
    const rows: { id: string }[] = await em.query(
      `SELECT DISTINCT a.id
       FROM apps a
       JOIN app_versions av ON av.app_id = a.id
       JOIN pages p ON p.app_version_id = av.id
       JOIN components c ON c.page_id = p.id
       WHERE a.organization_id = $1
         AND a.type <> 'module'
         AND c.type = 'ModuleViewer'`,
      [organizationId]
    );
    if (rows.length === 0) return [];
    return em.find(App, { where: { id: In(rows.map((r) => r.id)) } });
  }

  private async ensureAppGitSyncRow(em: EntityManager, moduleApp: App, organizationGitId: string): Promise<void> {
    // Raw SQL: the AppGitSync entity has been removed in the same release that
    // adds DropAppGitSyncTable1779500000000. Schema migrations (including the
    // drop) run before data-migrations, so on fresh installs the table is gone
    // by the time this seed executes — guard with to_regclass and bail out
    // silently. On upgrades where this seed already ran in the past, this
    // function is not re-executed; the guard is purely a fresh-install safety.
    const tableCheck = await em.query(`SELECT to_regclass('public.app_git_sync') AS oid`);
    if (!tableCheck?.[0]?.oid) return;

    const existing = await em.query(`SELECT id FROM app_git_sync WHERE app_id = $1 LIMIT 1`, [moduleApp.id]);
    if (existing.length > 0) return;

    await em.query(
      `INSERT INTO app_git_sync (app_id, organization_git_id, git_app_name, git_app_id, allow_editing)
       VALUES ($1, $2, $3, $4, $5)`,
      [moduleApp.id, organizationGitId, moduleApp.name, moduleApp.id, true]
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op. Once orgs push content to push-modules, rolling back destroys real data.
    // Reversal is manual if ever needed.
  }
}
