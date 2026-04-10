import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { VersionRepository } from './repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IVersionUtilService } from './interfaces/IUtilService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, IsNull, Not } from 'typeorm';
import { App } from '@entities/app.entity';
import { Component } from '@entities/component.entity';
import { User } from '@entities/user.entity';
import { VersionsCreateService } from './services/create.service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { RequestContext } from '@modules/request-context/service';
import { VersionCreateDto } from './dto';
import { decamelizeKeys } from 'humps';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';

@Injectable()
export class VersionUtilService implements IVersionUtilService {
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

  async updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto) {
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

    await this.versionRepository.update(appVersion.id, editableParams);
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
      const results = await manager
        .createQueryBuilder(Component, 'component')
        .innerJoin('component.page', 'page')
        .innerJoin('page.appVersion', 'appVersion')
        .innerJoin(App, 'app', 'app.id = appVersion.appId')
        .select('DISTINCT app.name', 'appName')
        .where('component.type = :type', { type: 'ModuleViewer' })
        .andWhere("component.properties::jsonb -> 'moduleVersionId' ->> 'value' = :versionId", { versionId })
        .getRawMany();

      const appNames = results.map((r) => r.appName).filter(Boolean);
      if (appNames.length > 0) {
        throw new BadRequestException(
          `Cannot delete this version.\nUsed by:\n${appNames.join('\n')}`
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to check if module version is in use');
    }
  }

  async deleteVersion(app: App, user: User, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const versionToDelete = app.appVersions[0];
      const branchId = versionToDelete?.branchId ?? null;

      // For platform git sync apps, count only versions on the same branch so that
      // versions on other branches don't inflate the count and bypass the guard.
      // For all other apps (branchId=null), fall back to the original count across
      // all versions — behaviour is unchanged.
      const numVersions = branchId
        ? await manager.count(AppVersion, { where: { appId: app.id, branchId } })
        : await this.versionRepository.getCount(app.id);

      if (numVersions <= 1) {
        throw new ForbiddenException('Cannot delete only version of app');
      }

      if (app.currentVersionId === app.appVersions[0].id) {
        throw new BadRequestException('You cannot delete a released version');
      }

      if (app.type === 'module') {
        await this.checkModuleVersionInUse(app.appVersions[0].id, manager);
      }

      await this.versionRepository.deleteById(app.appVersions[0].id, manager);
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
      await this.versionRepository.deleteById(version.id, manager);
    }, manager);
  }
}
