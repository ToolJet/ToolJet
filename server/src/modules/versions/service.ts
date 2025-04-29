import { App } from '@entities/app.entity';
import { BadRequestException, ForbiddenException, Injectable, NotAcceptableException } from '@nestjs/common';
import { VersionRepository } from './repository';
import { AppVersion } from '@entities/app_version.entity';
import { PromoteVersionDto, VersionCreateDto } from './dto';
import { User } from '@entities/user.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { EntityManager, MoreThan } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { VersionsCreateService } from './services/create.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { MODULES } from '@modules/app/constants/modules';
import { PageService } from '@modules/apps/services/page.service';
import { EventsService } from '@modules/apps/services/event.service';
import { AppsUtilService } from '@modules/apps/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { OrganizationThemesUtilService } from '@modules/organization-themes/util.service';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { VersionUtilService } from './util.service';
import { AppEnvironment } from '@entities/app_environments.entity';
import { IVersionService } from './interfaces/IService';

@Injectable()
export class VersionService implements IVersionService {
  constructor(
    protected readonly versionRepository: VersionRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly createVersionService: VersionsCreateService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly pageService: PageService,
    protected readonly eventsService: EventsService,
    protected readonly appUtilService: AppsUtilService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly organizationThemesUtilService: OrganizationThemesUtilService,
    protected readonly versionsUtilService: VersionUtilService
  ) {}
  async getAllVersions(app: App): Promise<{ versions: Array<AppVersion> }> {
    const result = await this.versionRepository.getVersionsInApp(app.id);

    if (result?.length) {
      result[0].isCurrentEditingVersion = true;
    }
    return { versions: result };
  }

  async createVersion(app: App, user: User, versionCreateDto: VersionCreateDto) {
    const { versionName, versionFromId } = versionCreateDto;
    const { organizationId } = user;

    return await dbTransactionWrap(async (manager: EntityManager) => {
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
        })
      );

      await this.createVersionService.setupNewVersion(appVersion, versionFrom, organizationId, manager);

      this.eventEmitter.emit('auditLogEntry', {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceType: MODULES.APP,
        resourceName: app.name,
        actionType: MODULE_INFO.VERSION.CREATE,
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

  async getVersion(app: App, user: User): Promise<any> {
    const prepareResponse = async (app: App, versionId: string) => {
      let appVersion,
        updatedVersionId = versionId;
      if (updatedVersionId) {
        appVersion = await this.versionRepository.findVersion(updatedVersionId);
      } else {
        appVersion = await this.versionRepository.findVersionsFromApp(app);
        appVersion = appVersion[0];
        updatedVersionId = appVersion.id;
      }

      const pagesForVersion = await this.pageService.findPagesForVersion(updatedVersionId);
      const eventsForVersion = await this.eventsService.findEventsForVersion(updatedVersionId);

      const appCurrentEditingVersion = JSON.parse(JSON.stringify(appVersion));

      if (
        appCurrentEditingVersion &&
        !(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT))
      ) {
        const developmentEnv = await this.appEnvironmentUtilService.getByPriority(user.organizationId);
        appCurrentEditingVersion['currentEnvironmentId'] = developmentEnv.id;
      }

      let shouldFreezeEditor = false;
      if (appCurrentEditingVersion) {
        const hasMultiEnvLicense = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
        if (hasMultiEnvLicense) {
          const currentEnvironment = await this.appEnvironmentUtilService.get(
            user.organizationId,
            appCurrentEditingVersion['currentEnvironmentId']
          );
          shouldFreezeEditor = currentEnvironment.priority > 1;
        } else {
          const developmentEnv = await this.appEnvironmentUtilService.getByPriority(user.organizationId);
          appCurrentEditingVersion['currentEnvironmentId'] = developmentEnv.id;
        }
      }

      delete appCurrentEditingVersion['app'];

      const appData = {
        ...app,
      };

      delete appData['editingVersion'];

      const editingVersion = camelizeKeys(appCurrentEditingVersion);

      // Inject app theme
      const appTheme = await this.organizationThemesUtilService.getTheme(
        user.organizationId,
        editingVersion?.globalSettings?.theme?.id
      );

      editingVersion['globalSettings']['theme'] = appTheme;

      return {
        ...appData,
        editing_version: editingVersion,
        pages: this.appUtilService.mergeDefaultComponentData(pagesForVersion),
        events: eventsForVersion,
        should_freeze_editor: app.creationMode === 'GIT' || shouldFreezeEditor,
      };
    };

    const response = await prepareResponse(app, app.appVersions?.[0]?.id);
    const modules = await this.appUtilService.fetchModules(app, false, undefined);

    response['modules'] = await Promise.all(modules.map((module) => prepareResponse(module, undefined)));

    return response;
  }

  async update(app: App, user: User, appVersionUpdateDto: AppVersionUpdateDto) {
    const appVersion = await this.versionRepository.findById(app.appVersions[0].id, app.id);

    await this.versionsUtilService.updateVersion(appVersion, appVersionUpdateDto);

    if (app.type === 'workflow') {
      await this.appUtilService.updateWorflowVersion(appVersion, appVersionUpdateDto, app);
    }

    this.eventEmitter.emit('auditLogEntry', {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: app.id,
      resourceType: MODULES.APP,
      resourceName: app.name,
      actionType: MODULE_INFO.APP.UPDATE,
      metadata: { data: { updatedAppVersionName: appVersionUpdateDto.name, version: app.appVersions[0] } },
    });
    return;
  }

  async updateSettings(app: App, user: User, appVersionUpdateDto: AppVersionUpdateDto) {
    const appVersion = await this.versionRepository.findById(app.appVersions[0].id, app.id);

    await this.versionsUtilService.updateVersion(appVersion, appVersionUpdateDto);

    this.eventEmitter.emit('auditLogEntry', {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: app.id,
      resourceType: MODULES.APP,
      resourceName: app.name,
      actionType: MODULE_INFO.APP.UPDATE,
      metadata: { data: { updatedGlobalSettings: appVersion } },
    });
    return;
  }

  promoteVersion(app: App, user: User, promoteVersionDto: PromoteVersionDto) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const { currentEnvironmentId } = promoteVersionDto;
      const editableParams = {};
      //check if the user is trying to promote the environment & raise an error if the currentEnvironmentId is not correct
      if (currentEnvironmentId) {
        const version = app.appVersions[0];
        let currentEnvironment: AppEnvironment;

        if (currentEnvironmentId) {
          currentEnvironment = await AppEnvironment.findOne({
            where: { id: version.currentEnvironmentId },
          });
        }

        if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT))) {
          throw new BadRequestException('You do not have permissions to perform this action');
        }

        if (version.currentEnvironmentId !== currentEnvironmentId) {
          throw new NotAcceptableException();
        }

        const nextEnvironment = await AppEnvironment.findOneOrFail({
          where: {
            priority: MoreThan(currentEnvironment.priority),
            organizationId: user.organizationId,
          },
          order: { priority: 'ASC' },
        });
        editableParams['currentEnvironmentId'] = nextEnvironment.id;

        if (version.promotedFrom) {
          /* 
        should make this field null. 
        otherwise unreleased versions will demote back to promoted_from when the user go back to base plan again. 
        (this query will only run one time after the user buys a paid plan)
        */
          editableParams['promotedFrom'] = null;
        }

        editableParams['updatedAt'] = new Date();
        await this.versionRepository.update(version.id, editableParams);
        const environments = await this.appEnvironmentUtilService.getAll(user.organizationId, app.id, manager);

        this.eventEmitter.emit('auditLogEntry', {
          userId: user.id,
          organizationId: user.organizationId,
          resourceId: app.id,
          resourceType: MODULES.APP,
          resourceName: app.name,
          actionType: MODULE_INFO.APP.UPDATE,
          metadata: {
            data: {
              name: 'Version Promoted',
              versionId: version.id,
              currentEnvironmentId: promoteVersionDto.currentEnvironmentId,
            },
          },
        });

        return { editorEnvironment: nextEnvironment, environments };
      }
    });
  }
}
