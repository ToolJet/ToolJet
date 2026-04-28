import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
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

    // No filter on currentVersionId: modules created AFTER
    // PromoteAndReleaseExistingModuleVersions1776419051000 ran won't have it set.
    // cloneReleasedVersionToBranch falls back to the latest version by created_at.
    const modules = await em
      .createQueryBuilder(App, 'app')
      .where('app.organizationId = :orgId', { orgId: defaultBranch.organizationId })
      .andWhere('app.type = :type', { type: APP_TYPES.MODULE })
      .getMany();

    if (modules.length === 0) return;

    const orgGit = await em.findOne(OrganizationGitSync, {
      where: { organizationId: defaultBranch.organizationId },
    });

    // NOTE: creationMode is an ORIGIN marker ('GIT' = materialized from a git pull,
    // 'DEFAULT' = created in UI). Backfilling legacy UI-created modules to 'GIT'
    // would lie about their origin. The frontend's LifecycleCTAButton visibility
    // issue should be fixed at the frontend check instead (participation signal,
    // not origin signal). Not mutating creationMode here.

    // Seed BRANCH-type DRAFT versions onto EVERY non-default workspace branch
    // that already existed when this migration runs. Without this, pre-existing
    // feature branches have no module version row, so AppsService.getOne falls
    // back to the default-branch released VERSION row — which the freeze logic
    // renders as read-only and hides the lifecycle CTA. New branches created
    // after this migration runs are handled by WorkspaceBranchesService.createBranch
    // (it calls pullModules at branch-creation time).
    const nonDefaultBranches = await em.find(WorkspaceBranch, {
      where: { organizationId: defaultBranch.organizationId, isDefault: false },
    });

    for (const moduleApp of modules) {
      for (const targetBranch of nonDefaultBranches) {
        await this.cloneReleasedVersionToBranch(
          em,
          versionsCreate,
          moduleApp,
          targetBranch,
          defaultBranch.organizationId
        );
      }
      if (orgGit) await this.ensureAppGitSyncRow(em, moduleApp, orgGit.id);
    }
  }

  private async cloneReleasedVersionToBranch(
    em: EntityManager,
    versionsCreate: VersionsCreateService,
    moduleApp: App,
    targetBranch: WorkspaceBranch,
    organizationId: string
  ): Promise<void> {
    // Idempotency: skip only if a HYDRATED (non-stub) BRANCH version already exists.
    // Stub rows left over from a failed earlier pull attempt would pass the loose
    // BRANCH-type-only check, but `AppsService.getOne` filters `isStub: false` when
    // picking the branch's editingVersion — so a pre-existing stub would leave the
    // frontend falling back to the default-branch PUBLISHED row (frozen editor).
    const existing = await em.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        branchId: targetBranch.id,
        versionType: AppVersionType.BRANCH,
        isStub: false,
      },
    });
    if (existing) return;

    // If only stub BRANCH versions exist on this branch, delete them before seeding
    // a real one. The stub is empty (no pages/queries) so cascade deletes are safe.
    await em.delete(AppVersion, {
      appId: moduleApp.id,
      branchId: targetBranch.id,
      versionType: AppVersionType.BRANCH,
      isStub: true,
    });

    // Prefer the released version when set; otherwise fall back to the latest version
    // on the module (matches PromoteAndReleaseExistingModuleVersions' "pick latest" rule,
    // and handles modules created before they've been released).
    const sourceVersion = moduleApp.currentVersionId
      ? await em.findOne(AppVersion, {
          where: { id: moduleApp.currentVersionId },
          relations: ['dataSources'],
        })
      : await em.findOne(AppVersion, {
          where: { appId: moduleApp.id },
          order: { createdAt: 'DESC' },
          relations: ['dataSources'],
        });
    if (!sourceVersion) return;

    // Branch-version naming: match `ensureBranchVersion` in app-git-operations.util.ts
    // — use the branch name, falling back to a timestamped suffix on conflict.
    // This is the convention for HYDRATED BRANCH versions. UUID naming is only used
    // for STUB versions (isStub=true) during pulls; this migration creates
    // isStub=false versions so we use the user-facing name.
    const existingWithBranchName = await em.findOne(AppVersion, {
      where: { appId: moduleApp.id, name: targetBranch.name },
    });
    const versionName = existingWithBranchName ? `${targetBranch.name}_${Date.now()}` : targetBranch.name;

    // Editable BRANCH versions must use Development (priority=1) as the
    // current environment — any higher-priority env freezes the editor via
    // shouldFreezeEditor. Copying sourceVersion.currentEnvironmentId would
    // pull in production (the released env) and render the module read-only.
    const devEnv = await em.findOne(AppEnvironment, {
      where: { organizationId, priority: 1 },
    });

    const newVersion = em.create(AppVersion, {
      appId: moduleApp.id,
      name: versionName,
      definition: {},
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.BRANCH,
      branchId: targetBranch.id,
      parentVersionId: sourceVersion.id,
      currentEnvironmentId: devEnv?.id ?? sourceVersion.currentEnvironmentId,
      isStub: false,
      // Module-only migration (caller filters type=='module'); stamp a fresh
      // module_reference_id so pinning + cross-instance resolve work for these
      // seeded branch-versions. setupNewVersion below just saves the entity as-is.
      moduleReferenceId: randomUUID(),
    });

    await versionsCreate.setupNewVersion(newVersion, sourceVersion, organizationId, em);
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
