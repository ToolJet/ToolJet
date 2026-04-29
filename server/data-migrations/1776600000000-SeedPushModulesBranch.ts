import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { MigrationProgress } from '@helpers/migration.helper';
import { AppModule } from '@modules/app/module';
import { getImportPath } from '@modules/app/constants';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { APP_TYPES } from '@modules/apps/constants';
// Types only — runtime instances resolve via dynamic import matching SubModule.getProviders
// path, otherwise the compile-time class reference doesn't match the DI-registered token.
// Pattern copied from 1752749046662-EncrpyGoogleCalendarClientSecret.ts.
import type { DataSourceBranchUtil } from 'ee/app-git/shared/datasource-branch.util';
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

    const nonDefaultBranches = await em.find(WorkspaceBranch, {
      where: { organizationId: defaultBranch.organizationId, isDefault: false },
    });

    // Step 1: seed module BRANCH versions on every non-default branch. The app
    // remap pass below depends on these rows existing on the target branch.
    for (const moduleApp of modules) {
      for (const targetBranch of nonDefaultBranches) {
        await this.cloneVersionToBranch(
          em,
          versionsCreate,
          moduleApp,
          targetBranch,
          defaultBranch.organizationId,
          /* stampModuleReferenceId */ true
        );
      }
      if (orgGit) await this.ensureAppGitSyncRow(em, moduleApp, orgGit.id);
    }

    // Step 2: seed BRANCH versions for non-module apps that contain at least one
    // ModuleViewer, then rewrite each viewer's moduleVersionId.value from the
    // default-branch module_reference_id to the freshly-stamped branch-version
    // module_reference_id. Apps without a ModuleViewer aren't relevant to this
    // migration's purpose (module-pin reconciliation across branches).
    const appsWithModuleViewers = await this.findAppsWithModuleViewers(em, defaultBranch.organizationId);
    for (const app of appsWithModuleViewers) {
      // Lock the source version ONCE per app, before the per-branch loop. Without
      // this, after iter 1 creates a BRANCH version, the per-branch helper's
      // "latest by created_at" fallback in cloneVersionToBranch would pick up that
      // fresh BRANCH row as the source — and its already-remapped pin (a DRAFT
      // module_reference_id on the new branch row) would cause iter 2's remap to
      // fall into the defensive "DRAFT → unpin" path. Net effect: only iter 1's
      // clone keeps a correct pin; iter 2+ end up empty, and the empty value
      // propagates to subsequent iterations as the source updates each loop.
      const lockedSource = await this.findStableAppSource(em, app, defaultBranch.id);
      for (const targetBranch of nonDefaultBranches) {
        const newAppVersion = await this.cloneVersionToBranch(
          em,
          versionsCreate,
          app,
          targetBranch,
          defaultBranch.organizationId,
          /* stampModuleReferenceId */ false,
          lockedSource
        );
        if (newAppVersion) {
          await this.remapModuleViewerPins(em, newAppVersion.id, targetBranch.id, defaultBranch.organizationId);
        }
      }
    }
  }

  /**
   * Resolve the source version to clone from, locked to a stable choice that won't
   * shift across loop iterations even as new BRANCH rows are created.
   *
   * Order:
   *   1. Default-branch VERSION-type row (status irrelevant — even DRAFT is correct)
   *   2. App.currentVersionId, if set (normally points at the released VERSION row)
   *   3. OLDEST version on the app — never "latest", because the loop creates new
   *      BRANCH rows each iteration; picking "latest" would bind the next clone
   *      to the freshly-created BRANCH row whose pin has already been mutated
   *      by remapModuleViewerPins.
   *
   * Returns null if the app has no version at all (skip cloning entirely).
   */
  private async findStableAppSource(
    em: EntityManager,
    app: App,
    defaultBranchId: string
  ): Promise<AppVersion | null> {
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
   * resolving via currentVersionId / latest-by-created_at. Step 2 (apps loop) passes
   * a stable, default-branch-locked source so subsequent loop iterations don't pick
   * up the freshly-created BRANCH rows we're emitting.
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

  /**
   * Walks ModuleViewer components inside a freshly-cloned app BRANCH version and
   * rewrites moduleVersionId.value to the target branch's BRANCH-version
   * module_reference_id.
   *
   * Pre-condition: 1776470400000-GenerateCoRelationIdForModules has run, so the
   * cloned-in value is one of:
   *   ''     was DRAFT-pinned on default; leave unpinned.
   *   <uuid> a default-branch module_reference_id (non-DRAFT); remap to the
   *          target-branch BRANCH-version's module_reference_id.
   *   other  orphan; unpin.
   *
   * The defensive sourceVersion.status check exists because between 1776470400000
   * and this migration a hand-edit could re-introduce a DRAFT pin.
   */
  private async remapModuleViewerPins(
    em: EntityManager,
    appVersionId: string,
    targetBranchId: string,
    organizationId: string
  ): Promise<void> {
    type ViewerRow = { id: string; moduleAppId: string | null; moduleVersionId: string | null };

    const viewers: ViewerRow[] = await em.query(
      `SELECT c.id,
              c.properties->'moduleAppId'->>'value' AS "moduleAppId",
              c.properties->'moduleVersionId'->>'value' AS "moduleVersionId"
       FROM components c
       JOIN pages p ON p.id = c.page_id
       WHERE p.app_version_id = $1
         AND c.type = 'ModuleViewer'`,
      [appVersionId]
    );
    if (viewers.length === 0) return;

    for (const viewer of viewers) {
      // Already unpinned (1776470400000 collapsed DRAFT pins to ''); leave alone.
      if (!viewer.moduleVersionId) continue;
      // No moduleAppId → can't resolve; leave the existing value rather than guess.
      if (!viewer.moduleAppId) continue;

      const moduleApp = await em.findOne(App, {
        where: { co_relation_id: viewer.moduleAppId, type: APP_TYPES.MODULE, organizationId },
      });
      if (!moduleApp) {
        await this.setModuleVersionIdValue(em, viewer.id, '');
        continue;
      }

      const sourceVersion = await em.findOne(AppVersion, {
        where: { appId: moduleApp.id, moduleReferenceId: viewer.moduleVersionId },
      });
      if (!sourceVersion || sourceVersion.status === AppVersionStatus.DRAFT) {
        await this.setModuleVersionIdValue(em, viewer.id, '');
        continue;
      }

      const branchModuleVersion = await em.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          branchId: targetBranchId,
          versionType: AppVersionType.BRANCH,
          isStub: false,
        },
      });
      // No branch row yet — leave the default-branch UUID; resolveModuleRef falls
      // back to default for unmatched pins, so behavior stays correct.
      if (!branchModuleVersion?.moduleReferenceId) continue;

      await this.setModuleVersionIdValue(em, viewer.id, branchModuleVersion.moduleReferenceId);
    }
  }

  private async setModuleVersionIdValue(em: EntityManager, componentId: string, value: string): Promise<void> {
    await em.query(
      `UPDATE components
       SET properties = jsonb_set(properties::jsonb, '{moduleVersionId,value}', to_jsonb($1::text))::json
       WHERE id = $2`,
      [value, componentId]
    );
  }

  private async ensureAppGitSyncRow(em: EntityManager, moduleApp: App, organizationGitId: string): Promise<void> {
    const existing = await em.findOne(AppGitSync, { where: { appId: moduleApp.id } });
    if (existing) return;

    await em.save(
      AppGitSync,
      em.create(AppGitSync, {
        appId: moduleApp.id,
        organizationGitId,
        gitAppName: moduleApp.name,
        gitAppId: moduleApp.id,
        allowEditing: true,
      })
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op. Once orgs push content to push-modules, rolling back destroys real data.
    // Reversal is manual if ever needed.
  }
}
