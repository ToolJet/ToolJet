import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  AppCreateDto,
  AppListDto,
  AppUpdateDto,
  ValidateAppAccessDto,
  ValidateAppAccessResponseDto,
  VersionReleaseDto,
} from './dto';
import { APP_TYPES, FEATURE_KEY } from './constants';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { App } from '@entities/app.entity';
import { AppsUtilService } from './util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { plainToClass } from 'class-transformer';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from './repository';
import { FoldersUtilService } from '@modules/folders/util.service';
import { FolderAppsUtilService } from '@modules/folder-apps/util.service';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { AppVersion } from '@entities/app_version.entity';
import { PageService } from './services/page.service';
import { EventsService } from './services/event.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppEnvironment } from '@entities/app_environments.entity';
import { OrganizationThemesUtilService } from '@modules/organization-themes/util.service';
import { IAppsService } from './interfaces/IService';
import { AiUtilService } from '@modules/ai/util.service';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

@Injectable()
export class AppsService implements IAppsService {
  constructor(
    protected readonly appsUtilService: AppsUtilService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly versionRepository: VersionRepository,
    protected readonly appRepository: AppsRepository,
    protected readonly foldersUtilService: FoldersUtilService,
    protected readonly folderAppsUtilService: FolderAppsUtilService,
    protected readonly pageService: PageService,
    protected readonly eventService: EventsService,
    protected readonly organizationThemeUtilService: OrganizationThemesUtilService,
    protected readonly aiUtilService: AiUtilService
  ) {}
  async create(user: User, appCreateDto: AppCreateDto) {
    const { name, icon, type } = appCreateDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const app = await this.appsUtilService.create(name, user, type as APP_TYPES, manager);

      const appUpdateDto = new AppUpdateDto();
      appUpdateDto.name = name;
      appUpdateDto.slug = app.id;
      appUpdateDto.icon = icon;
      await this.appsUtilService.update(app, appUpdateDto, null, manager);

      // Setting data for audit logs
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
      });

      return decamelizeKeys(app);
    });
  }

  async validatePrivateAppAccess(app: App, ability: AppAbility, validateAppAccessDto: ValidateAppAccessDto) {
    const { versionName, environmentName, versionId, envId } = validateAppAccessDto;
    const response = {
      id: app.id,
      slug: app.slug,
      type: app.type,
    };
    /* If the request comes from preview which needs version id */
    if (versionName || environmentName || (versionId && envId)) {
      if (!ability.can(FEATURE_KEY.UPDATE, App, app.id)) {
        throw new ForbiddenException(
          JSON.stringify({
            organizationId: app.organizationId,
          })
        );
      }

      /* Adding backward compatibility for old URLs */
      const version = versionId
        ? await this.versionRepository.findById(versionId, app.id)
        : versionName
        ? await this.versionRepository.findByName(versionName, app.id)
        : // Handle version retrieval based on env
          await this.versionRepository.findLatestVersionForEnvironment(
            app.id,
            envId,
            environmentName,
            app.organizationId
          );

      if (!version) {
        throw new NotFoundException("Couldn't found app version. Please check the version name");
      }
      const environment = await this.appsUtilService.validateVersionEnvironment(
        environmentName,
        envId,
        version.currentEnvironmentId,
        app.organizationId
      );
      if (version) response['versionName'] = version.name;
      if (envId) response['environmentName'] = environment.name;
      response['versionId'] = version.id;
      response['environmentId'] = environment.id;
    }
    return plainToClass(ValidateAppAccessResponseDto, response);
  }

  validateReleasedApp(ability: AppAbility, app: App): { id: string; slug: string } {
    if (!app.currentVersionId) {
      const editPermission = ability.can(FEATURE_KEY.UPDATE, App, app.id);
      const errorResponse = {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        error: 'App is not released yet',
        message: { error: 'App is not released yet', editPermission },
      };
      throw new HttpException(errorResponse, HttpStatus.NOT_IMPLEMENTED);
    }

    const { id, slug } = app;
    return {
      slug: slug,
      id: id,
    };
  }

  async update(app: App, appUpdateDto: AppUpdateDto, user: User) {
    const { id: userId, organizationId } = user;
    // const prevName = app.name;
    const { name } = appUpdateDto;

    const result = await this.appsUtilService.update(app, appUpdateDto, organizationId);
    if (name && app.creationMode != 'GIT' && name != app.name) {
      // Can use event emitter
      //this.appGitUtilService.renameAppOrVersion(user, app.id, prevName);
    }

    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId,
      organizationId,
      resourceId: app.id,
      resourceName: app.name,
      metadata: { updateParams: { app: appUpdateDto } },
    });

    const response = decamelizeKeys(result);
    return response;
  }

  async delete(app: App, user: User) {
    const { organizationId } = user;
    const { id } = app;

    await this.appRepository.delete({ id, organizationId });

    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: id,
      organizationId: user.organizationId,
      resourceId: app.id,
      resourceName: app.name,
    });
  }

  async getAllApps(user: User, appListDto: AppListDto): Promise<any> {
    let apps = [];
    let totalFolderCount = 0;

    const { folderId, page, searchKey, type } = appListDto;

    return dbTransactionWrap(async (manager: EntityManager) => {
      if (appListDto.folderId) {
        const folder = await this.foldersUtilService.findOne(appListDto.folderId, manager);
        const { viewableApps, totalCount } = await this.folderAppsUtilService.getAppsFor(
          user,
          folder,
          parseInt(page || '1'),
          searchKey,
          type as APP_TYPES
        );
        apps = viewableApps;
        totalFolderCount = totalCount;
      } else {
        apps = await this.appsUtilService.all(user, parseInt(page || '1'), searchKey, type);
      }

      const totalCount = await this.appsUtilService.count(user, searchKey, type as APP_TYPES);

      const totalPageCount = folderId ? totalFolderCount : totalCount;

      const meta = {
        total_pages: Math.ceil(totalPageCount / 9),
        total_count: totalCount,
        folder_count: totalFolderCount,
        current_page: parseInt(page || '1'),
      };

      const response = {
        meta,
        apps,
      };

      return decamelizeKeys(response);
    });
  }

  async findTooljetDbTables(appId: string): Promise<{ table_id: string }[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const tooljetDbDataQueries = await manager
        .createQueryBuilder(DataQuery, 'data_queries')
        .innerJoin(DataSource, 'data_sources', 'data_queries.data_source_id = data_sources.id')
        .innerJoin(AppVersion, 'app_versions', 'app_versions.id = data_sources.app_version_id')
        .where('app_versions.app_id = :appId', { appId })
        .andWhere('data_sources.kind = :kind', { kind: 'tooljetdb' })
        .getMany();

      const uniqTableIds = new Set();
      tooljetDbDataQueries.forEach((dq) => {
        if (dq.options?.operation === 'join_tables') {
          const joinOptions = dq.options?.join_table?.joins ?? [];
          (joinOptions || []).forEach((join) => {
            const { table, conditions } = join;
            if (table) uniqTableIds.add(table);
            conditions?.conditionsList?.forEach((condition) => {
              const { leftField, rightField } = condition;
              if (leftField?.table) {
                uniqTableIds.add(leftField?.table);
              }
              if (rightField?.table) {
                uniqTableIds.add(rightField?.table);
              }
            });
          });
        }
        if (dq.options.table_id) uniqTableIds.add(dq.options.table_id);
      });

      return [...uniqTableIds].map((table_id) => {
        return { table_id };
      });
    });
  }

  async getOne(app: App, user: User): Promise<any> {
    const response = decamelizeKeys(app);

    const seralizedQueries = [];
    const dataQueriesForVersion = app.editingVersion
      ? await this.versionRepository.findDataQueriesForVersion(app.editingVersion.id)
      : [];

    const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(app.editingVersion.id) : [];
    const eventsForVersion = app.editingVersion
      ? await this.eventService.findEventsForVersion(app.editingVersion.id)
      : [];

    // serialize queries
    for (const query of dataQueriesForVersion) {
      const decamelizedQuery = decamelizeKeys(query);
      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    response['data_queries'] = seralizedQueries;
    response['definition'] = app.editingVersion?.definition;
    response['pages'] = this.appsUtilService.mergeDefaultComponentData(pagesForVersion);
    response['events'] = eventsForVersion;

    //! if editing version exists, camelize the definition
    if (app.editingVersion) {
      const appTheme = await this.organizationThemeUtilService.getTheme(
        user.organizationId,
        response['editing_version']['global_settings']?.['theme']?.['id']
      );
      response['editing_version']['global_settings']['theme'] = appTheme;

      if (app.editingVersion.definition) {
        response['editing_version'] = {
          ...response['editing_version'],
          definition: camelizeKeys(app.editingVersion.definition),
        };
      }
    }

    if (response['editing_version']) {
      const hasMultiEnvLicense = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
      let shouldFreezeEditor = false;
      let appVersionEnvironment: AppEnvironment;
      if (hasMultiEnvLicense) {
        appVersionEnvironment = await this.appEnvironmentUtilService.get(
          user.organizationId,
          response['editing_version']['current_environment_id']
        );
        shouldFreezeEditor = appVersionEnvironment.priority > 1;
      } else {
        appVersionEnvironment = await this.appEnvironmentUtilService.getByPriority(user.organizationId);
        response['editing_version']['current_environment_id'] = appVersionEnvironment.id;
      }
      response['should_freeze_editor'] = app.creationMode === 'GIT' || shouldFreezeEditor;
      response['editorEnvironment'] = {
        id: appVersionEnvironment.id,
        name: appVersionEnvironment.name,
      };

      // Inject app theme
      const appTheme = await this.organizationThemeUtilService.getTheme(
        user.organizationId,
        response['editing_version']['global_settings']?.['theme']?.['id']
      );
      response['editing_version']['global_settings']['theme'] = appTheme;
    }
    return response;
  }

  async getBySlug(app: App, user: User): Promise<any> {
    const versionToLoad = app.currentVersionId
      ? await this.versionRepository.findVersion(app.currentVersionId)
      : await this.versionRepository.findVersion(app.editingVersion?.id);

    const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(versionToLoad.id) : [];
    const eventsForVersion = app.editingVersion ? await this.eventService.findEventsForVersion(versionToLoad.id) : [];
    const appTheme = await this.organizationThemeUtilService.getTheme(
      app.organizationId,
      versionToLoad?.globalSettings?.theme?.id
    );

    if (app?.isPublic && user) {
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
      });
    }

    // serialize
    return {
      current_version_id: app['currentVersionId'],
      data_queries: versionToLoad?.dataQueries,
      definition: versionToLoad?.definition,
      is_public: app.isPublic,
      is_maintenance_on: app.isMaintenanceOn,
      name: app.name,
      slug: app.slug,
      events: eventsForVersion,
      pages: this.appsUtilService.mergeDefaultComponentData(pagesForVersion),
      homePageId: versionToLoad.homePageId,
      globalSettings: { ...versionToLoad.globalSettings, theme: appTheme },
      showViewerNavigation: versionToLoad.showViewerNavigation,
      pageSettings: versionToLoad?.pageSettings,
    };
  }

  async release(app: App, user: User, versionReleaseDto: VersionReleaseDto) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const { versionToBeReleased } = versionReleaseDto;
      const { id: appId } = app;
      //check if the app version is eligible for release
      const currentEnvironment: AppEnvironment = await manager
        .createQueryBuilder(AppEnvironment, 'app_environments')
        .select(['app_environments.id', 'app_environments.isDefault', 'app_environments.priority'])
        .innerJoinAndSelect('app_versions', 'app_versions', 'app_versions.current_environment_id = app_environments.id')
        .where('app_versions.id = :versionToBeReleased', {
          versionToBeReleased,
        })
        .getOne();

      const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
      /* 
          Allow version release only if the environment is on 
          production with a valid license or 
          expired license and development environment (priority no.1) (CE rollback) 
          */

      if (isMultiEnvironmentEnabled && !currentEnvironment?.isDefault) {
        throw new BadRequestException('You can only release when the version is promoted to production');
      }

      await manager.update(App, appId, { currentVersionId: versionToBeReleased });

      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: app.id,
        resourceName: app.name,
        metadata: { data: { name: 'App Released', versionToBeReleased: versionReleaseDto.versionToBeReleased } },
      });
      return;
    });
  }
}
