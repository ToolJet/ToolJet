import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { VersionRepository } from './repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IVersionUtilService } from './interfaces/IUtilService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, Not } from 'typeorm';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { VersionsCreateService } from './services/create.service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { RequestContext } from '@modules/request-context/service';
import { VersionCreateDto } from './dto';
import { decamelizeKeys } from 'humps';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { ACTION_TYPE } from '@modules/app-history/constants';
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
    return;
  }

  async fetchVersions(appId: string): Promise<AppVersion[]> {
    return await this.versionRepository.find({
      where: { appId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // async createVersion(
  //   app: App,
  //   user: User,
  //   versionCreateDto: VersionCreateDto,
  //   manager?: EntityManager
  // ): Promise<AppVersion> {
  //   const { versionName, versionFromId, versionDescription, versionType } = versionCreateDto;
  //   if (!versionName || versionName.trim().length === 0) {
  //     // need to add logic to get the version name -> from the version created at from
  //     throw new BadRequestException('Version name cannot be empty.');
  //   }
  //   const { organizationId } = user;
  //   const organizationGit = await this.organizationGitSyncRepository.findOrgGitByOrganizationId(
  //     organizationId,
  //     manager
  //   );

  //   if (organizationGit && organizationGit.isBranchingEnabled) {
  //     // Only allow one draft version of type 'version' (not branch)
  //     // Branch versions can have multiple drafts
  //     // If versionType is not provided or is not BRANCH, check for existing draft
  //     const isCreatingBranchVersion = versionType === AppVersionType.BRANCH;

  //     if (!isCreatingBranchVersion) {
  //       const existingDraftVersion = await this.versionRepository.findOne({
  //         where: {
  //           appId: app.id,
  //           status: AppVersionStatus.DRAFT,
  //           versionType: Not(AppVersionType.BRANCH),
  //         },
  //       });

  //       if (existingDraftVersion) {
  //         throw new BadRequestException('Only one draft version is allowed when branching is enabled.');
  //       }
  //     }
  //   }
  //   return await dbTransactionWrap(async (manager: EntityManager) => {
  //     const versionFrom = await manager.findOneOrFail(AppVersion, {
  //       where: { id: versionFromId, appId: app.id },
  //       relations: ['dataSources', 'dataSources.dataQueries', 'dataSources.dataSourceOptions'],
  //     });

  //     const firstPriorityEnv = await this.appEnvironmentUtilService.get(organizationId, null, true, manager);

  //     const appVersion = await manager.save(
  //       AppVersion,
  //       manager.create(AppVersion, {
  //         name: versionName,
  //         appId: app.id,
  //         definition: versionFrom?.definition,
  //         currentEnvironmentId: firstPriorityEnv?.id,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         status: AppVersionStatus.DRAFT,
  //         parentVersionId: versionCreateDto.versionFromId ? versionFromId : null,
  //         description: versionDescription ? versionDescription : null,
  //         versionType: versionType ? versionType : AppVersionType.VERSION,
  //         createdBy: user.id,
  //       })
  //     );

  //     await this.createVersionService.setupNewVersion(appVersion, versionFrom, organizationId, manager);

  //     //APP_VERSION_CREATE audit
  //     RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
  //       userId: user.id,
  //       organizationId: user.organizationId,
  //       resourceId: app.id,
  //       resourceName: app.name,
  //       metadata: {
  //         data: {
  //           updatedAppVersionName: versionCreateDto.versionName,
  //           updatedAppVersionFrom: versionCreateDto.versionFromId,
  //           updatedAppVersionEnvironment: versionCreateDto.environmentId,
  //         },
  //       },
  //     });

  //     return decamelizeKeys(appVersion);
  //   }, manager);
  // }

  async createVersion(app: App, user: User, versionCreateDto: VersionCreateDto, manager?: EntityManager) {
    const { versionName, versionFromId, versionDescription, versionType } = versionCreateDto;
    if (!versionName || versionName.trim().length === 0) {
      // need to add logic to get the version name -> from the version created at from
      throw new BadRequestException('Version name cannot be empty.');
    }
    const { organizationId } = user;
    const organizationGit = await this.organizationGitSyncRepository.findOrgGitByOrganizationId(
      organizationId,
      manager
    );
    if (organizationGit && organizationGit.isBranchingEnabled) {
      // Only allow one draft version of type 'version' (not branch)
      // Branch versions can have multiple drafts
      // If versionType is not provided or is not BRANCH, check for existing draft
      const isCreatingBranchVersion = versionType === AppVersionType.BRANCH;

      if (!isCreatingBranchVersion) {
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

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      const versionFrom = await manager.findOneOrFail(AppVersion, {
        where: { id: versionFromId, appId: app.id },
        relations: ['dataSources', 'dataSources.dataQueries', 'dataSources.dataSourceOptions'],
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

    // Queue initial history capture for the created version
    try {
      await this.appHistoryUtilService.queueHistoryCapture(
        result.id,
        ACTION_TYPE.INITIAL_SNAPSHOT,
        {
          operation: 'version_create',
          versionName: versionCreateDto.versionName,
          versionFromId: versionCreateDto.versionFromId,
          appId: app.id,
          appName: app.name,
        },
        false,
        user.id
      );
    } catch (error) {
      console.error('Failed to queue initial history capture for version creation:', error);
    }

    return result;
  }

  async deleteVersion(app: App, user: User, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const numVersions = await this.versionRepository.getCount(app.id);

      if (numVersions <= 1) {
        throw new ForbiddenException('Cannot delete only version of app');
      }

      if (app.currentVersionId === app.appVersions[0].id) {
        throw new BadRequestException('You cannot delete a released version');
      }

      await this.versionRepository.deleteById(app.appVersions[0].id, manager);

      // TODO: Add audit logs
      return;
    }, manager);
  }
  async deleteVersionGit(app: App, version: AppVersion, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (app.currentVersionId && app.currentVersionId === app.appVersions[0].id) {
        throw new BadRequestException('You cannot delete a released version');
      }
      await this.versionRepository.deleteById(version.id, manager);

      // TODO: Add audit logs
      return;
    }, manager);
  }
}
