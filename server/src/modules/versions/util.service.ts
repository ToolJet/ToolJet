import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
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
    }
    if (
      appVersionUpdateDto?.description !== undefined &&
      appVersionUpdateDto?.description !== null &&
      appVersion.description !== appVersionUpdateDto.description
    ) {
      editableParams['description'] = appVersionUpdateDto.description;
    }

    if (manager) {
      await manager.update(AppVersion, { id: appVersion.id }, editableParams);
    } else {
      await this.versionRepository.update(appVersion.id, editableParams);
    }
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
    const { versionName, versionFromId, versionDescription, versionType, branchId } = versionCreateDto;
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
      // moduleVersionId.value stores either a DB UUID (legacy) or version name (post-migration)
      const results = await manager
        .createQueryBuilder(Component, 'component')
        .innerJoin('component.page', 'page')
        .innerJoin('page.appVersion', 'appVersion')
        .innerJoin(App, 'app', 'app.id = appVersion.appId')
        .select('DISTINCT app.name', 'appName')
        .where('component.type = :type', { type: 'ModuleViewer' })
        .andWhere(
          `(component.properties::jsonb -> 'moduleVersionId' ->> 'value') = :versionId
           OR EXISTS (
             SELECT 1 FROM app_versions av
             WHERE av.id::text = :versionId
               AND (component.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.name
           )`,
          { versionId }
        )
        .getRawMany();

      const appNames = results.map((r) => r.appName).filter(Boolean);
      if (appNames.length > 0) {
        throw new BadRequestException(`Cannot delete this version.\nUsed by:\n${appNames.join('\n')}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to check if module version is in use', error?.stack || error);
      throw new BadRequestException('Failed to check if module version is in use');
    }
  }

  async checkDraftModulesInApp(
    versionId: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<void> {
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
          const versionName = m.resolved?.versionName ?? 'draft';
          return `Module "${name}" version "${versionName}" is still in draft. Save the module first.`;
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
        throw new ForbiddenException(`Cannot delete only version of ${app.type === 'module' ? 'module' : 'app'}`);
      }

      if (app.currentVersionId === app.appVersions[0].id) {
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
