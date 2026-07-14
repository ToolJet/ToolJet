import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { VersionRepository } from './repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { IVersionUtilService } from './interfaces/IUtilService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { Component } from '@entities/component.entity';
import { User } from '@entities/user.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping } from '@entities/data_query_folder_mapping.entity';
import { EntityManager, IsNull, Not, In } from 'typeorm';
import { VersionsCreateService } from './services/create.service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { RequestContext } from '@modules/request-context/service';
import { VersionCreateDto } from './dto';
import { MODULE_VERSION_AUDIT_KEYS } from '@modules/modules/constants';
import { decamelizeKeys } from 'humps';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { v4 as uuid } from 'uuid';
import { APP_TYPES } from '@modules/apps/constants';
import { resolveAllModuleViewersForVersion, ResolvedModuleViewer } from './module-ref.util';

@Injectable()
export class VersionUtilService implements IVersionUtilService {
  private readonly logger = new Logger(VersionUtilService.name);

  constructor(
    protected readonly versionRepository: VersionRepository,
    protected readonly createVersionService: VersionsCreateService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly organizationGitSyncRepository: OrganizationGitSyncRepository,
    protected readonly appHistoryUtilService: AppHistoryUtilService
  ) {}
  protected mergeDeep(target, source, seen = new WeakMap()) {
    if (!this.isObject(target)) {
      target = {};
    }

    if (!this.isObject(source)) {
      return target;
    }

    if (seen.has(source)) {
      return seen.get(source);
    }
    seen.set(source, target);

    for (const key in source) {
      if (this.isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        this.mergeDeep(target[key], source[key], seen);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }

    return target;
  }

  protected isObject(obj) {
    return obj && typeof obj === 'object';
  }

  async updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto, manager?: EntityManager) {
    const editableParams = {};

    const { globalSettings, homePageId, pageSettings, name } = appVersion;

    if (appVersionUpdateDto?.homePageId && homePageId !== appVersionUpdateDto.homePageId) {
      editableParams['homePageId'] = appVersionUpdateDto.homePageId;
    }

    if (appVersionUpdateDto?.globalSettings) {
      editableParams['globalSettings'] = {
        ...globalSettings,
        ...appVersionUpdateDto.globalSettings,
      };
    }

    if (appVersionUpdateDto?.pageSettings) {
      editableParams['pageSettings'] = {
        ...this.mergeDeep(pageSettings, appVersionUpdateDto.pageSettings),
      };
    }

    if (typeof appVersionUpdateDto?.showViewerNavigation === 'boolean') {
      editableParams['showViewerNavigation'] = appVersionUpdateDto.showViewerNavigation;
    }

    if (appVersionUpdateDto?.name && name !== appVersionUpdateDto.name) {
      editableParams['name'] = appVersionUpdateDto.name;
    }

    if (appVersionUpdateDto?.status && appVersion.status !== appVersionUpdateDto.status) {
      editableParams['status'] = appVersionUpdateDto.status;
      // chk_app_versions_branched_implies_draft (1779300000000) requires
      // non-DRAFT rows to be branchless. Detach branch_id in the SAME UPDATE
      // as the status flip so the row never lands in the violating state
      // mid-transaction. handleDefaultBranchPublish below still fires for the
      // default-branch publish path; its own branch_id detach (line 245)
      // becomes an idempotent no-op once we've done it inline here.
      if (appVersionUpdateDto.status !== AppVersionStatus.DRAFT && appVersion.branchId) {
        editableParams['branchId'] = null;
      }
    }
    if (
      appVersionUpdateDto?.description !== undefined &&
      appVersionUpdateDto?.description !== null &&
      appVersion.description !== appVersionUpdateDto.description
    ) {
      editableParams['description'] = appVersionUpdateDto.description;
    }

    // DB write. Wrap in a transaction so the optional post-publish hook below
    // commits atomically with the status change.
    const runWrite = async (mgr: EntityManager) => {
      await this.versionRepository.updateVersion(appVersion.id, editableParams, mgr);

      // Post-publish hook: when a default-branch DRAFT VERSION row flips to
      // PUBLISHED, seed a new DRAFT on the same default branch and detach
      // branch_id from the just-published row. Mirrors the one-shot migration
      // `EnsureDefaultBranchDraftVersion1777970000000` and keeps the
      // invariant "every git-enabled app has a DRAFT on its default branch"
      // alive after every publish.
      const flippedToPublished =
        editableParams['status'] === AppVersionStatus.PUBLISHED && appVersion.status !== AppVersionStatus.PUBLISHED;
      if (flippedToPublished) {
        await this.handleDefaultBranchPublish(appVersion, mgr);
      }
    };

    if (manager) {
      await runWrite(manager);
    } else {
      await dbTransactionWrap(runWrite);
    }
  }

  /**
   * Fires when a VERSION-type DRAFT on the workspace's default branch
   * transitions to PUBLISHED. Two actions:
   *
   *   1. Insert a fresh minimal DRAFT row on the same default branch. Metadata
   *      (`app_name / slug / icon / is_public` / `co_relation_id`) is sourced
   *      from the **latest saved version row** for this app (ordered by
   *      updated_at DESC) — that's the just-published row in the normal flow,
   *      but querying for it explicitly keeps the hook robust against stale
   *      in-memory entities. Satisfies `chk_app_versions_branch_metadata` and
   *      preserves continuity for the user's next edit. No child entities
   *      (pages / queries / etc.) are cloned — same model as the migration.
   *   2. NULL out branch_id on the just-published row. Released snapshots
   *      become branchless in the new model.
   *
   * No-op when:
   *   - row isn't VERSION-type (sub-branch BRANCH publishes have their own flow)
   *   - row's branchId isn't the workspace's default branch (workflows, git-off
   *     non-workflow rows, etc.)
   *   - workspace has no default branch at all (git-off)
   *
   * DB operations go through repositories; only the orchestration lives here.
   */
  private async handleDefaultBranchPublish(appVersion: AppVersion, manager: EntityManager): Promise<void> {
    if (appVersion.versionType !== AppVersionType.VERSION) return;
    if (!appVersion.branchId) return;

    const parentApp = await manager.findOne(App, {
      where: { id: appVersion.appId },
      select: ['id', 'organizationId', 'type'],
    });
    if (!parentApp?.organizationId) return;

    const defaultBranch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId: parentApp.organizationId, isDefault: true },
      select: ['id'],
    });
    if (!defaultBranch || defaultBranch.id !== appVersion.branchId) return;

    // Source from the latest version row by updated_at — the just-published
    // row has the freshest updated_at after the UPDATE that triggered this
    // hook, so this picks it. Relations are eager-loaded because
    // setupNewVersion below walks `dataSources` + `dataSources.dataQueries`.
    const sourceVersion = await manager.findOne(AppVersion, {
      where: { appId: appVersion.appId },
      relations: ['dataSources', 'dataSources.dataQueries'],
      order: { updatedAt: 'DESC' },
    });

    // First-priority environment for the new DRAFT's currentEnvironmentId.
    // Mirrors `createVersion` (line 311) — every new DRAFT starts on the
    // org's lowest-priority (development) environment regardless of which
    // env the source was on. Falls back to the source's env if the lookup
    // fails so the column is never NULL on the inserted row.
    const firstPriorityEnv = await this.appEnvironmentUtilService.get(parentApp.organizationId, null, true, manager);

    // Step 1: random UUID name for the new draft. Mirrors branch-version
    // naming (apps/util.service.ts) — drafts are internal records that the
    // user names later via the save-version dialog, so any unique value is
    // fine. UUID is collision-free, so no _N suffix loop is needed.
    const newDraft = await manager.save(
      AppVersion,
      manager.create(AppVersion, {
        name: uuid(),
        appId: appVersion.appId,
        status: AppVersionStatus.DRAFT,
        versionType: AppVersionType.VERSION,
        branchId: defaultBranch.id,
        // Modules pin to a version via module_reference_id. Each new version gets a
        // fresh uuid (mirrors createVersion line 347) — never leave it NULL for a
        // module, or ModuleViewer pin resolution against this draft fails.
        ...(parentApp.type === APP_TYPES.MODULE && { moduleReferenceId: uuid() }),
        co_relation_id: sourceVersion?.co_relation_id ?? appVersion.co_relation_id,
        parentVersionId: sourceVersion?.id ?? appVersion.id,
        currentEnvironmentId: firstPriorityEnv?.id ?? sourceVersion?.currentEnvironmentId ?? null,
        isStub: false,
        appName: (sourceVersion as any)?.appName ?? (appVersion as any)?.appName ?? null,
        slug: (sourceVersion as any)?.slug ?? (appVersion as any)?.slug ?? null,
        icon: (sourceVersion as any)?.icon ?? (appVersion as any)?.icon ?? null,
        isPublic: (sourceVersion as any)?.isPublic ?? (appVersion as any)?.isPublic ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    // Step 1b: deep-clone content from the source. Mirrors `createVersion` —
    // copies globalSettings/pageSettings/showViewerNavigation onto the new
    // DRAFT and clones pages/components/layouts/queries/event handlers (and
    // workflow bundles for workflow apps) with id remapping. Every cloned
    // child carries its own `co_relation_id` forward (see
    // VersionsCreateService — Page line 492, Component line 521, Layout
    // line 593, DataSource line 130, DataQuery line 144, EventHandler
    // lines 160/194/512/611). The new row's own co_relation_id was already
    // inherited from the source above. Without this clone the new DRAFT has
    // NULL globalSettings/pageSettings, which crashes the editor on
    // `editingVersion.globalSettings.theme = ...`.
    if (sourceVersion) {
      await this.createVersionService.setupNewVersion(newDraft, sourceVersion, parentApp.organizationId, manager);
    }

    // Step 2: detach branch_id from the just-published row. Delegated via the
    // repository to keep the DB write centralised.
    await this.versionRepository.updateVersion(appVersion.id, { branchId: null }, manager);
  }

  async fetchVersions(appId: string): Promise<AppVersion[]> {
    return await this.versionRepository.find({
      where: { appId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async validateDraftVersionConstraints(
    app: App,
    versionType: AppVersionType,
    organizationId: string,
    manager?: EntityManager
  ): Promise<void> {
    const organizationGit = await this.organizationGitSyncRepository.findOrgGitByOrganizationId(
      organizationId,
      manager
    );

    if (organizationGit && organizationGit.isBranchingEnabled && versionType !== AppVersionType.BRANCH) {
      const existingDraftVersion = await this.versionRepository.findOne({
        where: {
          appId: app.id,
          status: AppVersionStatus.DRAFT,
          versionType: Not(AppVersionType.BRANCH),
        },
      });

      if (existingDraftVersion) {
        throw new BadRequestException('Only one draft version is allowed when branching is enabled.');
      }
    }
  }

  async createVersion(app: App, user: User, versionCreateDto: VersionCreateDto, manager?: EntityManager) {
    const { versionName, versionFromId, versionDescription, versionType } = versionCreateDto;
    // Workflows must always have branch_id NULL — they don't participate in branching.
    // The controller forwards the x-branch-id header into versionCreateDto.branchId
    // even for workflows; drop it here so the new row doesn't land with branch_id
    // set + app_name/slug NULL (which would trip chk_app_versions_branch_metadata,
    // since workflow versions don't carry those fields).
    const branchId = app.type === APP_TYPES.WORKFLOW ? undefined : versionCreateDto.branchId;
    if (!versionName || versionName.trim().length === 0) {
      throw new BadRequestException('Version name cannot be empty.');
    }
    const { organizationId } = user;
    const organizationGit = await this.organizationGitSyncRepository.findOrgGitByOrganizationId(
      organizationId,
      manager
    );
    if (organizationGit && organizationGit.isBranchingEnabled) {
      // Only allow one draft version of type 'version' (not branch) per branch.
      // Scoping by branchId ensures drafts on different branches don't conflict.
      const isCreatingBranchVersion = versionType === AppVersionType.BRANCH;

      if (!isCreatingBranchVersion) {
        const existingDraftVersion = await this.versionRepository.findOne({
          where: {
            appId: app.id,
            status: AppVersionStatus.DRAFT,
            versionType: Not(AppVersionType.BRANCH),
            branchId: branchId ?? IsNull(),
          },
        });
        if (existingDraftVersion) {
          throw new BadRequestException('Only one draft version is allowed when branching is enabled.');
        }
      }
    }

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      const versionFrom = await manager.findOneOrFail(AppVersion, {
        where: { id: versionFromId, appId: app.id },
        relations: ['dataSources', 'dataSources.dataQueries'],
      });

      const firstPriorityEnv = await this.appEnvironmentUtilService.get(organizationId, null, true, manager);

      // Non-workflow metadata (slug/appName/icon/isPublic) lives on app_versions and
      // every row carries the same values for a given branch. Carry them over from the
      // parent version so the new row stays consistent with the rest of the app — the
      // dashboard / overlay helpers can pick any row and get the right metadata.
      // Workflows keep these on apps.*; their version rows leave them null.
      const isWorkflow = app.type === APP_TYPES.WORKFLOW;
      const appVersion = await manager.save(
        AppVersion,
        manager.create(AppVersion, {
          name: versionName,
          appId: app.id,
          definition: versionFrom?.definition,
          currentEnvironmentId: firstPriorityEnv?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: AppVersionStatus.DRAFT,
          parentVersionId: versionCreateDto.versionFromId ? versionFromId : null,
          description: versionDescription ? versionDescription : null,
          versionType: versionType ? versionType : AppVersionType.VERSION,
          createdBy: user.id,
          co_relation_id: app.co_relation_id,
          ...(app.type === APP_TYPES.MODULE && { moduleReferenceId: uuid() }),
          ...(branchId && { branchId }),
          ...(!isWorkflow && {
            slug: versionFrom?.slug ?? null,
            appName: versionFrom?.appName ?? null,
            icon: versionFrom?.icon ?? null,
            isPublic: versionFrom?.isPublic ?? false,
          }),
        })
      );

      await this.createVersionService.setupNewVersion(appVersion, versionFrom, organizationId, manager);

      //APP_VERSION_CREATE audit
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
        ...(app.type === 'module' && { actionType: MODULE_VERSION_AUDIT_KEYS.CREATE }),
        metadata: {
          data: {
            updatedAppVersionName: versionCreateDto.versionName,
            updatedAppVersionFrom: versionCreateDto.versionFromId,
            updatedAppVersionEnvironment: versionCreateDto.environmentId,
          },
        },
      });

      return decamelizeKeys(appVersion);
    });
    return result;
  }

  protected async checkModuleVersionInUse(versionId: string, manager: EntityManager): Promise<void> {
    try {
      // moduleVersionId.value stores the module_reference_id (current), the app_version id (legacy), or version name (legacy)
      const results = await manager
        .createQueryBuilder(Component, 'component')
        .innerJoin('component.page', 'page')
        .innerJoin('page.appVersion', 'appVersion')
        .innerJoin(App, 'app', 'app.id = appVersion.appId')
        .select('DISTINCT app.name', 'appName')
        .where('component.type = :type', { type: 'ModuleViewer' })
        .andWhere('appVersion.isStub = false')
        .andWhere(
          `(component.properties::jsonb -> 'moduleVersionId' ->> 'value') IN (
             SELECT unnest(ARRAY[av.id::text, av.module_reference_id::text, av.name])
             FROM app_versions av WHERE av.id = :versionId
           )`,
          { versionId }
        )
        .getRawMany();

      if (results.length > 0) {
        const appNames = results.map((r) => r.appName).filter(Boolean);
        const nameList = appNames.length > 0 ? appNames.join('\n') : 'one or more apps';
        throw new BadRequestException(`Cannot delete this version.\nUsed by:\n${nameList}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to check if module version is in use', error?.stack || error);
      throw new BadRequestException('Failed to check if module version is in use');
    }
  }

  async checkDraftModulesInApp(versionId: string, organizationId: string, manager: EntityManager): Promise<void> {
    try {
      // Resolve pins to runtime rows. Strict policy — block:
      //   no-row             — module unusable (zero candidate rows or module app missing)
      //   orphan-fallback    — UUID pin matched no row; runtime drifts to active draft
      //   unpinned-fallback  — pin empty; runtime drifts to active draft
      //   pin-hit + DRAFT    — pin points directly at the editing draft
      const resolved = await resolveAllModuleViewersForVersion(manager, versionId, organizationId);
      const offenders = resolved.filter(
        (v) =>
          v.matchKind === 'no-row' ||
          v.matchKind === 'orphan-fallback' ||
          v.matchKind === 'unpinned-fallback' ||
          (v.resolved && v.resolved.status === AppVersionStatus.DRAFT)
      );

      if (offenders.length > 0) {
        const seen = new Set<string>();
        const unique: ResolvedModuleViewer[] = [];
        for (const o of offenders) {
          // componentId tiebreaker — prevents malformed components collapsing to one bucket.
          const key = o.moduleName ?? (o.moduleAppCoRel || o.componentId);
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(o);
        }
        const formatEntry = (m: ResolvedModuleViewer) => {
          const name = m.moduleName ?? 'unknown module';
          if (m.matchKind === 'no-row') {
            return `Module "${name}" has no saved version yet. Save the module first.`;
          }
          if (m.matchKind === 'orphan-fallback') {
            return `Module "${name}" pin is invalid. Pin a saved version.`;
          }
          if (m.matchKind === 'unpinned-fallback') {
            return `Module "${name}" has active draft pinned. Pin a saved version.`;
          }
          // pin-hit + DRAFT remaining.
          return `Module "${name}" has active draft pinned. Pin a saved version.`;
        };
        const moduleList = unique.map(formatEntry).join(' ');
        const message =
          unique.length === 1
            ? `Save blocked - ${formatEntry(unique[0])}`
            : `Save blocked - ${unique.length} modules need saving. ${moduleList}`;
        throw new BadRequestException({
          message: { error: message, details: moduleList },
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to check draft modules in app', error?.stack || error);
      throw new BadRequestException('Failed to validate module versions');
    }
  }

  async checkModulesPromotableToEnvironment(
    versionId: string,
    targetEnvironmentName: string,
    targetPriority: number,
    organizationId: string,
    manager: EntityManager
  ): Promise<void> {
    try {
      // Resolve pins; flag row below target env priority. Strict: no-row, orphan-fallback,
      // unpinned-fallback also block — runtime fallback isn't a stable promote target.
      const resolved = await resolveAllModuleViewersForVersion(manager, versionId, organizationId);
      const offenders = resolved.filter((v) => {
        if (
          v.matchKind === 'no-row' ||
          v.matchKind === 'orphan-fallback' ||
          v.matchKind === 'unpinned-fallback' ||
          !v.resolved
        ) {
          return true;
        }
        const priority = v.resolved.envPriority;
        return priority === null || priority < targetPriority;
      });

      if (offenders.length > 0) {
        const seen = new Set<string>();
        const unique: ResolvedModuleViewer[] = [];
        for (const o of offenders) {
          // componentId tiebreaker — prevents malformed components collapsing to one bucket.
          const key = o.moduleName ?? (o.moduleAppCoRel || o.componentId);
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(o);
        }
        const formatEntry = (m: ResolvedModuleViewer) => {
          const name = m.moduleName ?? 'unknown module';
          if (m.matchKind === 'no-row') {
            return `Module "${name}" has no saved version. Save the module first.`;
          }
          if (m.matchKind === 'orphan-fallback') {
            return `Module "${name}" pin is invalid. Pin a saved version.`;
          }
          if (m.matchKind === 'unpinned-fallback') {
            return `Module "${name}" has active draft pinned. Pin a saved version.`;
          }
          // pin-hit + env priority below target.
          const versionName = m.resolved?.versionName ?? 'unresolved';
          return `Module "${name}" version "${versionName}" not promoted to ${targetEnvironmentName} yet.`;
        };
        const moduleList = unique.map(formatEntry).join(' ');
        const message =
          unique.length === 1
            ? `Promote blocked - ${formatEntry(unique[0])}`
            : `Promote blocked - ${unique.length} dependent modules need attention. ${moduleList}`;
        throw new BadRequestException({
          message: { error: message, details: moduleList },
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to check module environment availability', error?.stack || error);
      throw new BadRequestException('Failed to validate module versions for promote');
    }
  }

  async deleteVersion(app: App, user: User, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const versionToDelete = app.appVersions[0];
      const branchId = versionToDelete?.branchId ?? null;

      // For platform git sync apps, count only versions on the same branch so that
      // versions on other branches don't inflate the count and bypass the guard.
      // For all other apps (branchId=null), fall back to the original count across
      // all versions - behaviour is unchanged.
      const numVersions = branchId
        ? await manager.count(AppVersion, { where: { appId: app.id, branchId } })
        : await this.versionRepository.getCount(app.id);

      if (numVersions <= 1) {
        if (branchId) {
          const branch = await manager.findOne(WorkspaceBranch, { where: { id: branchId }, select: ['name'] });
          const branchName = branch?.name ?? 'this';
          throw new ForbiddenException(
            `${branchName} (Draft) version is the head of the ${branchName} branch and cannot be deleted`
          );
        }
        throw new ForbiddenException(`Cannot delete only version of ${app.type === 'module' ? 'module' : 'app'}`);
      }

      if (app.currentVersionId === app.appVersions[0].id || app.appVersions[0].status === AppVersionStatus.RELEASED) {
        throw new BadRequestException('You cannot delete a released version');
      }

      const versionId = app.appVersions[0].id;

      if (app.type === 'module') {
        await this.checkModuleVersionInUse(versionId, manager);
      }

      await this.cleanupQueryFolderData(manager, versionId);
      await this.versionRepository.deleteById(versionId, manager);
    }, manager);
  }

  async deleteVersionGit(app: App, version: AppVersion, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (app.currentVersionId && app.currentVersionId === version.id) {
        throw new BadRequestException('You cannot delete a released version');
      }
      if (app.type === 'module') {
        await this.checkModuleVersionInUse(version.id, manager);
      }

      await this.cleanupQueryFolderData(manager, version.id);
      await this.versionRepository.deleteById(version.id, manager);
    }, manager);
  }

  // DataQuery has CASCADE on AppVersion, but DataQueryFolder and
  // DataQueryFolderMapping do not — delete them explicitly to avoid orphans.
  private async cleanupQueryFolderData(manager: EntityManager, versionId: string): Promise<void> {
    const folders = await manager.find(DataQueryFolder, { where: { appVersionId: versionId } });
    const folderIds = folders.map((f) => f.id);
    const queries = await manager.find(DataQuery, { select: ['id'], where: { appVersionId: versionId } });
    const queryIds = queries.map((q) => q.id);
    const allChildIds = [...folderIds, ...queryIds];

    if (allChildIds.length > 0) {
      await manager.delete(DataQueryFolderMapping, { childId: In(allChildIds) });
    }
    if (folderIds.length > 0) {
      await manager.delete(DataQueryFolder, { appVersionId: versionId });
    }
  }
}
