import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { MigrationProgress } from '@helpers/migration.helper';
import { AppModule } from '@modules/app/module';
import { getImportPath } from '@modules/app/constants';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
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

    const nestApp = await NestFactory.createApplicationContext(
      await AppModule.register({ IS_GET_CONTEXT: true })
    );

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
          console.error(
            `${MIGRATION_NAME}: org=${defaultBranch.organizationId} failed; continuing.`,
            err
          );
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

    for (const moduleApp of modules) {
      await this.cloneReleasedVersionToBranch(
        em,
        versionsCreate,
        moduleApp,
        branch,
        defaultBranch.organizationId
      );
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
    const existing = await em.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        branchId: targetBranch.id,
        versionType: AppVersionType.BRANCH,
      },
    });
    if (existing) return;

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

    const newVersion = em.create(AppVersion, {
      appId: moduleApp.id,
      name: BRANCH_NAME,
      definition: {},
      status: AppVersionStatus.DRAFT,
      versionType: AppVersionType.BRANCH,
      branchId: targetBranch.id,
      parentVersionId: sourceVersion.id,
      currentEnvironmentId: sourceVersion.currentEnvironmentId,
      isStub: false,
    });

    await versionsCreate.setupNewVersion(newVersion, sourceVersion, organizationId, em);
  }

  private async ensureAppGitSyncRow(
    em: EntityManager,
    moduleApp: App,
    organizationGitId: string
  ): Promise<void> {
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
