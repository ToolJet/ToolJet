/**
 * Base utility service for Git operations across all source control providers.
 *
 * @remarks
 * DEPENDENCY INJECTION: Only inject platform-common services (Licensing, Import/Export).
 * Provider-specific implementations (GitHub, GitLab) must be injected in respective util.service.
 *
 * METHODS: Include only DB interactions and common functionalities applicable to all source controls.
 * No provider-specific logic.
 */
import { InjectRepository } from '@nestjs/typeorm';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import * as fs from 'fs';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { ExportTooljetDatabaseDto, ExportAppDto, ExportResourcesDto } from '@dto/export-resources.dto';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import * as path from 'path';
import { AppGitPushDto } from '@modules/app-git/dto';
import { catchDbException } from 'src/helpers/utils.helper';
import { AppUpdateDto } from '@modules/apps/dto';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppsService } from '@modules/apps/service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { convertSinglePageSchemaToMultiPageSchema } from '@modules/apps/services/app-import-export.service';

@Injectable()
export class BaseGitUtilService {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    @InjectRepository(AppGitSync)
    protected appGitRepository: Repository<AppGitSync>,
    @InjectRepository(OrganizationGitSync)
    protected organizationGitRepository: Repository<OrganizationGitSync>,
    @InjectRepository(AppVersion)
    protected appVersionsRepository: Repository<AppVersion>,
    protected appsService: AppsService,
    protected importExportResourcesService: ImportExportResourcesService,
    protected licenseTermsService: LicenseTermsService
  ) {}
  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { id: appGitId },
      relations: ['orgGit'],
    });
  }
  async findOrgGitById(orgGitId: string): Promise<OrganizationGitSync> {
    return this.organizationGitRepository.findOne({
      where: { id: orgGitId },
    });
  }
  async findOrgGitByOrganizationId(organizationId: string): Promise<OrganizationGitSync> {
    return this.organizationGitRepository.findOne({
      where: { organizationId: organizationId },
    });
  }
  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { appId: appId },
      relations: ['orgGit'],
    });
  }
  async deleteDir(dirPath: string) {
    try {
      fs.rmdir(dirPath, { recursive: true }, () => {});
    } catch {
      console.error('Not able to remove directory:', dirPath);
    }
  }
  async getOrganizationById(userOrganizationId: string, organizationId: string): Promise<OrganizationGitSync> {
    if (organizationId !== userOrganizationId) {
      throw new BadRequestException();
    }
    const organizationGit = await this.findOrgGitByOrganizationId(organizationId);

    if (!organizationGit) {
      return;
    }
    if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.GIT_SYNC))) {
      organizationGit.isEnabled = false;
    }
    return organizationGit;
  }

  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appGit = manager.create(AppGitSync, CreateBody);
      return await manager.save(appGit);
    });
  }
  async WriteAppFile(user: User, repoPath: string, appGit: AppGitSync, version: AppVersion, app: App) {
    const tables: ExportTooljetDatabaseDto[] = await this.appsService.findTooljetDbTables(app.id);
    const appList: ExportAppDto[] = [{ id: app.id, search_params: { version_id: version.id } }];
    const exportDto: ExportResourcesDto = {
      app: appList,
      tooljet_database: tables,
      organization_id: app.organizationId,
    };
    const result = await this.importExportResourcesService.export(user, exportDto);
    const resourceObject = { ...result, tooljet_version: globalThis.TOOLJET_VERSION };
    const appJson = JSON.stringify(resourceObject, null, 2);
    let appPath = path.join(repoPath, appGit.gitAppName);

    if (app.name != appGit.gitAppName) {
      const newPath = path.join(repoPath, app.name);
      if (fs.existsSync(appPath)) {
        fs.rename(appPath, newPath, (err) => {
          if (err) {
            console.error('Issue while renaming', err);
            this.deleteDir(repoPath);
            throw new BadRequestException('Error while writting JSON file');
          }
        });
      }
      appPath = newPath;
      appGit.gitAppName = app.name;
    }

    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }

    let filePath = path.join(appPath, `${appGit.gitVersionName}.json`);

    if (appGit.versionId != null && (appGit.gitVersionId != version.id || appGit.gitVersionName != version.name)) {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            this.deleteDir(repoPath);
            throw new BadRequestException('Error while renaming app version');
          }
        });
      }
    }
    appGit.gitVersionName = version.name;
    appGit.gitVersionId = version.id;
    appGit.versionId = version.id;
    filePath = path.join(appPath, `${appGit.gitVersionName}.json`);
    try {
      await fs.promises.writeFile(filePath, appJson);
      return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
    } catch (err) {
      this.deleteDir(repoPath);
      throw new BadRequestException(`Error writing file "${filePath}": ${err}`);
    }
  }
  async writeMetaFile(user: User, repoPath: string, appGit: AppGitSync, appGitPushBody: AppGitPushDto) {
    const metaDr = path.join(repoPath, '.meta');
    const metaFile = path.join(metaDr, 'meta.json');
    let appMeta = {};
    if (!fs.existsSync(metaDr)) {
      fs.mkdirSync(metaDr, { recursive: true });
    } else {
      const appMetaContent = fs.readFileSync(metaFile, 'utf8');
      appMeta = JSON.parse(appMetaContent);
    }
    appMeta[appGit.gitAppId] = {
      gitAppName: appGit.gitAppName,
      lastCommitMessage: appGitPushBody.lastCommitMessage,
      gitVersionId: appGit.gitVersionId,
      lastpushDate: new Date(),
      gitVersionName: appGit.gitVersionName,
      lastCommitUser: `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`,
    };
    const appMetaString = JSON.stringify(appMeta, null, 2);
    try {
      await fs.promises.writeFile(metaFile, appMetaString);
      return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
    } catch (err) {
      this.deleteDir(repoPath);
      throw new Error(`Error writing file "${metaFile}": ${err}`);
    }
  }
  async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string) {
    const appFilePath = path.join(gitRepoPath, appName, `${versionName}.json`);
    try {
      const appContent = fs.readFileSync(appFilePath, 'utf8');
      this.deleteDir(gitRepoPath);
      const appJson = JSON.parse(appContent);
      return appJson;
    } catch (err) {
      this.deleteDir(gitRepoPath);
      throw new BadRequestException('Error while reading git file');
    }
  }
  async UpdateGitApp(schemaUnifiedAppParam: any, app: App) {
    const appUpdateBody: AppUpdateDto = {
      name: schemaUnifiedAppParam.name,
      slug: undefined, // Prevent db unique constraint error.
      icon: schemaUnifiedAppParam?.icon,
      current_version_id: undefined,
      is_public: app.isPublic,
      is_maintenance_on: app.isMaintenanceOn,
    };
    app.name = schemaUnifiedAppParam.name;
    app.slug = schemaUnifiedAppParam?.slug;
    app.icon = schemaUnifiedAppParam?.icon;
    return await catchDbException(async () => {
      return await this.appsService.update(app, appUpdateBody, undefined); //Need to check undefined for user
    }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'App name already exists' }]);
  }
  async updateAppGit(appGitId: string, UpdateBody: any) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.update(AppGitSync, appGitId, UpdateBody);
    });
  }
  validateAppJsonForImport(appJson, appName) {
    let appParams = appJson;
    if (appParams?.appV2) {
      appParams = { ...appParams.appV2 };
    }

    if (!appParams?.name) {
      throw new BadRequestException('Invalid params for app import');
    }

    const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
      ? appParams
      : convertSinglePageSchemaToMultiPageSchema(appParams);
    schemaUnifiedAppParams.name = appName;
    return schemaUnifiedAppParams;
  }
  async updateGitSyncSettings(organizationId: string, id: string, autoCommit: boolean, isEnabled: boolean) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(OrganizationGitSync, { where: { organizationId, id } });
      await manager.update(OrganizationGitSync, { id }, { autoCommit, isEnabled });
    });
  }
}
